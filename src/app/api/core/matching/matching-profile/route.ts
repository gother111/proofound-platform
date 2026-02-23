import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matchingProfiles, skills } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitAnalyticsEventAsync, emitProfileActivated } from '@/lib/analytics/events';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import { getWeightBiasBucket } from '@/lib/core/matching/presets';
import { MATCHABILITY_STRONG_SKILLS_WITH_RECENCY } from '@/lib/matching/thresholds';
import { getRows } from '@/lib/db/rows';

export const dynamic = 'force-dynamic';
const ENABLE_MATCHING_PROFILE_SKILL_WRITES =
  process.env.MATCHING_PROFILE_ENABLE_SKILL_WRITES === 'true';

/**
 * Track if profile was already activated (to avoid duplicate events)
 */
const activatedProfiles = new Set<string>();

async function ensureMatchingProfile(profileId: string) {
  await db
    .insert(matchingProfiles)
    .values({ profileId })
    .onConflictDoNothing({ target: matchingProfiles.profileId });

  return db.query.matchingProfiles.findFirst({
    where: eq(matchingProfiles.profileId, profileId),
  });
}

async function hasActivationEvent(profileId: string) {
  const existing = await db.execute(sql`
    SELECT id
    FROM analytics_events
    WHERE user_id = ${profileId}
      AND event_type = 'profile_activated'
    LIMIT 1
  `);

  return getRows(existing as any).length > 0;
}

/**
 * Check if profile meets activation criteria and emit event.
 */
async function checkAndEmitProfileActivation(userId: string): Promise<void> {
  if (activatedProfiles.has(userId)) return;

  try {
    if (await hasActivationEvent(userId)) {
      activatedProfiles.add(userId);
      return;
    }

    const eligibility = await evaluateIndividualMatchability(userId);
    if (!eligibility.eligible) return;

    const completionScore = eligibility.tier === 'strong' ? 100 : 75;
    await emitProfileActivated(userId, 0, {
      completionScore,
      hasMinimumL4Count:
        eligibility.counts.skillsWithRecency >= MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
      l4SkillsCount: eligibility.counts.skillsWithRecency,
      hasPurposeBlock: eligibility.counts.hasPurpose,
      hasMatchingProfile: eligibility.counts.hasConstraints,
      proofCount: eligibility.counts.proofCount,
      activationTier: eligibility.tier,
      nextTierTarget: eligibility.nextTierTarget?.tier || null,
    });

    activatedProfiles.add(userId);
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

const MatchingProfileSchema = z.object({
  valuesTags: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  timezone: z.string().optional(),
  languages: z.array(LanguageSchema).optional(),
  verified: z.record(z.boolean()).optional(),
  rightToWork: z.enum(['yes', 'no', 'conditional']).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  availabilityEarliest: z.string().optional(), // ISO date string
  availabilityLatest: z.string().optional(),
  workMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  desiredRoles: z.array(z.string()).optional(),
  desiredIndustries: z.array(z.string()).optional(),
  orgTypes: z.array(z.enum(['company', 'ngo', 'government', 'network', 'startup'])).optional(),
  weights: z.record(z.number()).optional(),
  weightBias: z.number().min(0).max(100).optional(),
  skills: z.array(SkillInputSchema).optional(),
});

/**
 * GET /api/matching-profile
 *
 * Returns the current user's matching profile.
 * Bootstraps a baseline row if missing.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await ensureMatchingProfile(user.id);

    // Fetch skills separately
    const userSkills = await db.query.skills.findMany({
      where: eq(skills.profileId, user.id),
    });

    const eligibility = await evaluateIndividualMatchability(user.id);

    if (!profile) {
      return NextResponse.json({ error: 'Failed to initialize matching profile' }, { status: 500 });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        skills: userSkills,
      },
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
    const user = await requireAuth();
    const body = await request.json();

    // Validate input
    const validatedData = MatchingProfileSchema.parse(body);

    // Extract skills separately
    const { skills: skillsInput, weightBias, ...profileData } = validatedData;

    const {
      availabilityEarliest,
      availabilityLatest,
      desiredRoles,
      desiredIndustries,
      orgTypes,
      ...restProfile
    } = profileData;

    const profileToUpsert: typeof matchingProfiles.$inferInsert = {
      profileId: user.id,
      ...restProfile,
      ...(availabilityEarliest !== undefined ? { availabilityEarliest } : {}),
      ...(availabilityLatest !== undefined ? { availabilityLatest } : {}),
      ...(desiredRoles !== undefined ? { desiredRoles } : {}),
      ...(desiredIndustries !== undefined ? { desiredIndustries } : {}),
      ...(orgTypes !== undefined ? { orgTypes } : {}),
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

    if (desiredRoles !== undefined || desiredIndustries !== undefined || orgTypes !== undefined) {
      emitAnalyticsEventAsync({
        eventType: 'matching_focus_updated',
        userId: user.id,
        profileId: user.id,
        entityType: 'profile',
        entityId: user.id,
        properties: {
          desiredRolesCount: desiredRoles?.length ?? 0,
          desiredIndustriesCount: desiredIndustries?.length ?? 0,
          orgTypesCount: orgTypes?.length ?? 0,
          hasFocusFields:
            (desiredRoles?.length ?? 0) > 0 ||
            (desiredIndustries?.length ?? 0) > 0 ||
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
            (desiredIndustries?.length ?? 0) > 0 ||
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
      profile: {
        ...updatedProfile,
        skills: updatedSkills,
      },
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
