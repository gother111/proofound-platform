import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { matchingProfiles, skills } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitAnalyticsEventAsync } from '@/lib/analytics/events';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import { getWeightBiasBucket } from '@/lib/core/matching/presets';
import { mapIndustryListToCanonical } from '@/lib/industry/options';
import { syncReadinessMilestones } from '@/lib/readiness/analytics';
import { normalizeEngagementType } from '@/lib/engagement-verifications/service';
import { MATCHING_ENABLED } from '@/lib/featureFlags';

// Shared handler imported by the kept launch corridor routes.
export const dynamic = 'force-dynamic';
const ENABLE_MATCHING_PROFILE_SKILL_WRITES =
  process.env.MATCHING_PROFILE_ENABLE_SKILL_WRITES === 'true';

async function checkAndEmitProfileActivation(userId: string): Promise<void> {
  try {
    await syncReadinessMilestones(userId, { source: 'matching_profile_updated' });
  } catch (error) {
    log.error('profile-activation-check.failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Validation schemas
const LanguageSchema = z.object({
  code: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

const SkillInputSchema = z.object({
  skillId: z.string(),
  level: z.number().min(0).max(5),
  monthsExperience: z.number().min(0),
});

const CompensationPeriodSchema = z.enum(['annual', 'monthly', 'hourly']);

const OptionalDateStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const MatchingProfileSchema = z.object({
  timezone: z.string().optional(),
  languages: z.array(LanguageSchema).optional(),
  verified: z.record(z.boolean()).optional(),
  rightToWork: z.enum(['yes', 'no', 'conditional']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  availabilityEarliest: OptionalDateStringSchema,
  availabilityLatest: OptionalDateStringSchema,
  workMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  engagementType: z
    .string()
    .refine((value) => normalizeEngagementType(value) !== null, {
      message:
        'engagementType must normalize to full_time, part_time, contract_consulting, or fractional_project',
    })
    .optional(),
  radiusKm: z.number().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  compPeriod: CompensationPeriodSchema.optional(),
  currency: z.string().optional(),
  desiredRoles: z.array(z.string()).optional(),
  desiredIndustries: z.array(z.string()).optional(),
  preferredIndustryKeys: z.array(z.string()).optional(),
  preferredIndustryLabels: z.array(z.string()).optional(),
  avoidIndustryKeys: z.array(z.string()).optional(),
  avoidIndustryLabels: z.array(z.string()).optional(),
  orgTypes: z.array(z.enum(['company', 'ngo', 'government', 'network', 'startup'])).optional(),
  weights: z.record(z.number()).optional(),
  weightBias: z.number().min(0).max(100).optional(),
  skills: z.array(SkillInputSchema).optional(),
});

function normalizeProfileIndustries(
  input: Pick<
    z.infer<typeof MatchingProfileSchema>,
    | 'desiredIndustries'
    | 'preferredIndustryKeys'
    | 'preferredIndustryLabels'
    | 'avoidIndustryKeys'
    | 'avoidIndustryLabels'
  >
) {
  const hasPreferredInput =
    input.preferredIndustryKeys !== undefined ||
    input.preferredIndustryLabels !== undefined ||
    input.desiredIndustries !== undefined;
  const hasAvoidInput =
    input.avoidIndustryKeys !== undefined || input.avoidIndustryLabels !== undefined;

  const preferredInput =
    input.preferredIndustryKeys ?? input.preferredIndustryLabels ?? input.desiredIndustries ?? [];
  const avoidInput = input.avoidIndustryKeys ?? input.avoidIndustryLabels ?? [];

  const preferred = mapIndustryListToCanonical(preferredInput);
  const avoid = mapIndustryListToCanonical(avoidInput);

  return {
    hasPreferredInput,
    hasAvoidInput,
    preferred,
    avoid,
  };
}

function normalizeProfileResponse(
  profile: typeof matchingProfiles.$inferSelect | null | undefined,
  userSkills: unknown[]
) {
  if (!profile) {
    return null;
  }

  const preferredFromCanonical = mapIndustryListToCanonical(
    profile.preferredIndustryKeys && profile.preferredIndustryKeys.length > 0
      ? profile.preferredIndustryKeys
      : profile.preferredIndustryLabels
  );
  const preferredFromLegacy = mapIndustryListToCanonical(profile.desiredIndustries);
  const preferred =
    preferredFromCanonical.keys.length > 0 ? preferredFromCanonical : preferredFromLegacy;
  const avoid = mapIndustryListToCanonical(
    profile.avoidIndustryKeys && profile.avoidIndustryKeys.length > 0
      ? profile.avoidIndustryKeys
      : profile.avoidIndustryLabels
  );
  const { valuesTags: _valuesTags, causeTags: _causeTags, ...profileWithoutPurposeTags } = profile;

  return {
    ...profileWithoutPurposeTags,
    engagementType:
      normalizeEngagementType(profile.engagementType) ?? profile.engagementType ?? null,
    desiredIndustries: preferred.labels,
    preferredIndustryKeys: preferred.keys,
    preferredIndustryLabels: preferred.labels,
    preferredIndustryLegacy: preferred.legacy,
    avoidIndustryKeys: avoid.keys,
    avoidIndustryLabels: avoid.labels,
    avoidIndustryLegacy: avoid.legacy,
    skills: userSkills,
  };
}

/**
 * GET /api/matching-profile
 *
 * Returns the current user's matching profile, or null if not set up.
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    if (!MATCHING_ENABLED) {
      return NextResponse.json(
        { error: 'Matching disabled', message: 'Matching is temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Fetch matching profile and auto-bootstrap baseline row if missing.
    let profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    if (!profile) {
      await db.insert(matchingProfiles).values({ profileId: user.id }).onConflictDoNothing();
      profile = await db.query.matchingProfiles.findFirst({
        where: eq(matchingProfiles.profileId, user.id),
      });
    }

    // Fetch skills separately
    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    const eligibility = await evaluateIndividualMatchability(user.id);

    if (!profile) {
      return NextResponse.json(
        {
          error: 'Failed to initialize matching profile',
          eligibility,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile: normalizeProfileResponse(profile, userSkills),
      eligibility,
    });
  } catch (error) {
    log.error('matching-profile.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch matching profile' }, { status: 500 });
  }
}

/**
 * PUT /api/matching-profile
 *
 * Creates or updates the current user's matching profile.
 */
export async function PUT(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    if (!MATCHING_ENABLED) {
      return NextResponse.json(
        { error: 'Matching disabled', message: 'Matching is temporarily unavailable.' },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = MatchingProfileSchema.parse(body);

    const { skills: skillsInput, weightBias, ...profileData } = validatedData;

    const {
      availabilityEarliest,
      availabilityLatest,
      desiredRoles,
      desiredIndustries,
      preferredIndustryKeys,
      preferredIndustryLabels,
      avoidIndustryKeys,
      avoidIndustryLabels,
      orgTypes,
      engagementType,
      ...restProfile
    } = profileData;
    const normalizedIndustries = normalizeProfileIndustries({
      desiredIndustries,
      preferredIndustryKeys,
      preferredIndustryLabels,
      avoidIndustryKeys,
      avoidIndustryLabels,
    });

    const profileToUpsert: typeof matchingProfiles.$inferInsert = {
      profileId: user.id,
      ...restProfile,
      ...(availabilityEarliest !== undefined ? { availabilityEarliest } : {}),
      ...(availabilityLatest !== undefined ? { availabilityLatest } : {}),
      ...(desiredRoles !== undefined ? { desiredRoles } : {}),
      ...(normalizedIndustries.hasPreferredInput
        ? {
            desiredIndustries: normalizedIndustries.preferred.labels,
            preferredIndustryKeys: normalizedIndustries.preferred.keys,
            preferredIndustryLabels: normalizedIndustries.preferred.labels,
            preferredIndustryLegacy: normalizedIndustries.preferred.legacy,
          }
        : {}),
      ...(normalizedIndustries.hasAvoidInput
        ? {
            avoidIndustryKeys: normalizedIndustries.avoid.keys,
            avoidIndustryLabels: normalizedIndustries.avoid.labels,
            avoidIndustryLegacy: normalizedIndustries.avoid.legacy,
          }
        : {}),
      ...(orgTypes !== undefined ? { orgTypes } : {}),
      ...(engagementType !== undefined
        ? { engagementType: normalizeEngagementType(engagementType) }
        : {}),
    };

    // Upsert matching profile
    await db
      .insert(matchingProfiles)
      .values(profileToUpsert)
      .onConflictDoUpdate({
        target: matchingProfiles.profileId,
        set: {
          ...profileToUpsert,
          updatedAt: new Date(),
        },
      });

    // Deprecated compatibility path: skill writes are disabled by default.
    if (skillsInput && skillsInput.length > 0) {
      if (ENABLE_MATCHING_PROFILE_SKILL_WRITES) {
        await db.delete(skills).where(eq(skills.profileId, user.id));
        await db.insert(skills).values(
          skillsInput.map((skill) => ({
            profileId: user.id,
            skillId: skill.skillId,
            level: skill.level,
            monthsExperience: skill.monthsExperience,
          }))
        );
      } else {
        log.info('matching-profile.skills_ignored', {
          userId: user.id,
          suppliedSkillCount: skillsInput.length,
        });
      }
    }

    log.info('matching-profile.upserted', {
      userId: user.id,
      skillCount: skillsInput?.length || 0,
    });

    const desiredIndustryLabelsForAnalytics = normalizedIndustries.hasPreferredInput
      ? normalizedIndustries.preferred.labels
      : undefined;

    if (
      desiredRoles !== undefined ||
      desiredIndustryLabelsForAnalytics !== undefined ||
      orgTypes !== undefined
    ) {
      emitAnalyticsEventAsync({
        eventType: 'matching_focus_updated',
        userId: user.id,
        profileId: user.id,
        entityType: 'profile',
        entityId: user.id,
        properties: {
          desiredRolesCount: desiredRoles?.length ?? 0,
          desiredIndustriesCount: desiredIndustryLabelsForAnalytics?.length ?? 0,
          orgTypesCount: orgTypes?.length ?? 0,
          hasFocusFields:
            (desiredRoles?.length ?? 0) > 0 ||
            (desiredIndustryLabelsForAnalytics?.length ?? 0) > 0 ||
            (orgTypes?.length ?? 0) > 0,
        },
      });
    }

    if (typeof weightBias === 'number') {
      emitAnalyticsEventAsync({
        eventType: 'matching_weight_bias_changed',
        userId: user.id,
        profileId: user.id,
        entityType: 'profile',
        entityId: user.id,
        properties: {
          biasValue: weightBias,
          biasBucket: getWeightBiasBucket(weightBias),
          hasFocusFields:
            (desiredRoles?.length ?? 0) > 0 ||
            (desiredIndustryLabelsForAnalytics?.length ?? 0) > 0 ||
            (orgTypes?.length ?? 0) > 0,
        },
      });
    }

    // Check if profile now meets activation criteria
    await checkAndEmitProfileActivation(user.id);
    const eligibility = await evaluateIndividualMatchability(user.id);

    // Fetch and return updated profile
    const updatedProfile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    const updatedSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    return NextResponse.json({
      profile: normalizeProfileResponse(updatedProfile, updatedSkills),
      eligibility,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('matching-profile.upsert.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update matching profile' }, { status: 500 });
  }
}
