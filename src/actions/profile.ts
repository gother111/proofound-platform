'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';

import { db } from '@/db';
import {
  profiles,
  individualProfiles,
  impactStories,
  impactStoryVerificationRequests,
  experiences,
  education,
  volunteering,
  skills as skillsTable,
  skillsTaxonomy,
  skillProofs,
  skillVerificationRequests,
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { emitProfileActivated } from '@/lib/analytics/events';
import { triggerProfileActivationSurvey } from '@/lib/surveys/sus-triggers';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import { MATCHABILITY_STRONG_SKILLS_WITH_RECENCY } from '@/lib/matching/thresholds';
import { sendEmail } from '@/lib/email/sender';
import { resolveSiteUrlFromHeaders } from '@/lib/env';
import { buildExperienceTimeline } from '@/lib/profile/experience-timeline';
import { isMissingColumnError } from '@/lib/db/schemaCompatibility';
import {
  createIndividualDefaultPurposeLinks,
  normalizeIndividualCauses,
  normalizeIndividualValues,
  normalizeIndividualPurposeLinks,
  normalizeIndividualValueLabels,
  pruneIndividualPurposeLinks,
} from '@/lib/profile/normalizePurposeLinks';
import { hasRequiredPurposeLinks } from '@/lib/purpose/normalizePurposeLinks';
import {
  VERIFICATION_INTEGRITY_REASONS,
  assessVerificationRequestIntegrity,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';
import type {
  ProfileData,
  BasicInfo,
  PurposeLinks,
  Value,
  Skill,
  ImpactStory,
  ImpactStoryArtifact,
  ImpactStoryOutcome,
  ImpactStoryRoleScope,
  ImpactStorySaveMode,
  ImpactStoryTimeline,
  ImpactStoryVerificationRequestDispatchParams,
  ImpactStoryVerificationRequestDispatchResult,
  ImpactStoryVerificationRequestInput,
  ImpactStoryVerificationRequestStatus,
  Experience,
  Education as EducationType,
  Volunteering as VolunteeringType,
  FieldVisibility,
} from '@/types/profile';

function coerceDateOnlyString(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const isoDatePrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (isoDatePrefix) {
    return isoDatePrefix[1];
  }

  const isoMonthOnly = trimmed.match(/^(\d{4}-\d{2})$/);
  if (isoMonthOnly) {
    return `${isoMonthOnly[1]}-01`;
  }

  return null;
}

/**
 * Track if profile was already activated (to avoid duplicate events)
 */
const activatedProfiles = new Set<string>();

/**
 * Check if profile meets activation criteria and emit event.
 * Uses shared matchability eligibility to avoid rule drift.
 */
async function checkAndEmitProfileActivation(userId: string): Promise<void> {
  // Skip if already emitted for this profile
  if (activatedProfiles.has(userId)) {
    return;
  }

  try {
    const eligibility = await evaluateIndividualMatchability(userId);
    if (!eligibility.eligible) return;

    const completionScore = eligibility.tier === 'strong' ? 100 : 75;
    const hasMinimumL4Count =
      eligibility.counts.skillsWithRecency >= MATCHABILITY_STRONG_SKILLS_WITH_RECENCY;
    const hasPurposeBlock = eligibility.counts.hasPurpose;
    const hasMatchingProfile = eligibility.counts.hasConstraints;

    // All criteria met - emit activation event!
    await emitProfileActivated(userId, 0, {
      completionScore,
      hasMinimumL4Count,
      l4SkillsCount: eligibility.counts.skillsWithRecency,
      hasPurposeBlock,
      hasMatchingProfile,
      proofCount: eligibility.counts.proofCount,
      activationTier: eligibility.tier,
      nextTierTarget: eligibility.nextTierTarget?.tier || null,
    });

    // Trigger SUS survey for profile activation milestone
    await triggerProfileActivationSurvey(userId);

    // Mark as emitted to prevent duplicates
    activatedProfiles.add(userId);
  } catch (error) {
    console.error('Profile activation check failed:', error);
    // Don't throw - activation tracking shouldn't break profile updates
  }
}

type PurposeVisibility = 'public' | 'network' | 'private';
type PurposeTextField = 'mission' | 'vision';
type PurposeListField = 'values' | 'causes';

const purposeTextColumnMap = {
  mission: individualProfiles.mission,
  vision: individualProfiles.vision,
} as const;

async function updatePurposeTextField(
  field: PurposeTextField,
  value: string | null,
  links: PurposeLinks | undefined,
  visibility: PurposeVisibility | undefined,
  defaultVisibility: PurposeVisibility
) {
  const user = await requireAuth();

  const current = await db
    .select({
      value: purposeTextColumnMap[field],
      fieldVisibility: individualProfiles.fieldVisibility,
      values: individualProfiles.values,
      causes: individualProfiles.causes,
      missionLinks: individualProfiles.missionLinks,
      visionLinks: individualProfiles.visionLinks,
    })
    .from(individualProfiles)
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  const currentValues = normalizeIndividualValueLabels(current[0]?.values);
  const currentCauses = normalizeIndividualCauses(current[0]?.causes);
  const normalizedValue = typeof value === 'string' ? value.trim() : '';
  const isSettingPurpose = normalizedValue.length > 0;

  if (isSettingPurpose) {
    const missingRequirements: string[] = [];
    if (currentValues.length === 0) {
      missingRequirements.push('at least one value');
    }
    if (currentCauses.length === 0) {
      missingRequirements.push('at least one cause');
    }
    if (missingRequirements.length > 0) {
      throw new Error(`Add ${missingRequirements.join(' and ')} before updating your ${field}.`);
    }
  }

  const oldValue = (current[0]?.value as string | null | undefined) || null;
  const currentFieldVisibility = (current[0]?.fieldVisibility as FieldVisibility) || {};
  const currentLinksRaw = field === 'mission' ? current[0]?.missionLinks : current[0]?.visionLinks;
  const existingLinks = pruneIndividualPurposeLinks(
    normalizeIndividualPurposeLinks(currentLinksRaw),
    currentValues,
    currentCauses
  );
  const requestedLinks = links ? normalizeIndividualPurposeLinks(links) : existingLinks;
  const nextLinks = pruneIndividualPurposeLinks(requestedLinks, currentValues, currentCauses);

  if (isSettingPurpose && !hasRequiredPurposeLinks(nextLinks)) {
    throw new Error(
      `Select at least one linked value and one linked cause before updating your ${field}.`
    );
  }

  const { logPurposeEdit } = await import('@/lib/audit/purpose-log');
  await logPurposeEdit(user.id, field, oldValue, normalizedValue);

  const linksField = field === 'mission' ? 'missionLinks' : 'visionLinks';
  const updateData: Record<string, unknown> = {
    [field]: normalizedValue || null,
    [linksField]: isSettingPurpose ? nextLinks : createIndividualDefaultPurposeLinks([], []),
  };
  if (visibility) {
    updateData.fieldVisibility = {
      ...currentFieldVisibility,
      [field]: visibility,
    };
  }

  await db.update(individualProfiles).set(updateData).where(eq(individualProfiles.userId, user.id));

  const { emitEvent } = await import('@/lib/analytics/events');
  await emitEvent({
    eventType: 'purpose_updated',
    userId: user.id,
    properties: {
      field,
      wordCount: normalizedValue.split(/\s+/).filter(Boolean).length,
      hasValue: Boolean(normalizedValue),
      visibility: visibility || currentFieldVisibility[field] || defaultVisibility,
    },
  });

  await checkAndEmitProfileActivation(user.id);

  revalidatePath('/app/i/profile');
}

async function replacePurposeListField(field: PurposeListField, values: Value[] | string[]) {
  const user = await requireAuth();
  const [current] = await db
    .select({
      values: individualProfiles.values,
      causes: individualProfiles.causes,
      missionLinks: individualProfiles.missionLinks,
      visionLinks: individualProfiles.visionLinks,
    })
    .from(individualProfiles)
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  const nextValues = field === 'values' ? normalizeIndividualValueLabels(values) : current?.values;
  const nextCauses = field === 'causes' ? normalizeIndividualCauses(values) : current?.causes;

  const nextMissionLinks = pruneIndividualPurposeLinks(
    normalizeIndividualPurposeLinks(current?.missionLinks),
    nextValues,
    nextCauses
  );
  const nextVisionLinks = pruneIndividualPurposeLinks(
    normalizeIndividualPurposeLinks(current?.visionLinks),
    nextValues,
    nextCauses
  );

  try {
    await db
      .update(individualProfiles)
      .set({
        [field]: values,
        missionLinks: nextMissionLinks,
        visionLinks: nextVisionLinks,
      } as Record<string, unknown>)
      .where(eq(individualProfiles.userId, user.id));
  } catch (error) {
    if (!isMissingColumnError(error, ['mission_links', 'vision_links'])) {
      throw error;
    }

    console.warn('Purpose link columns are unavailable, falling back to list-only update.', {
      field,
    });
    await db
      .update(individualProfiles)
      .set({ [field]: values } as Record<string, unknown>)
      .where(eq(individualProfiles.userId, user.id));
  }

  const { emitEvent } = await import('@/lib/analytics/events');
  await emitEvent({
    eventType: 'purpose_updated',
    userId: user.id,
    properties: {
      field,
      count: values.length,
      hasValue: values.length > 0,
    },
  });

  revalidatePath('/app/i/profile');
}

/**
 * Fetch the authenticated user's profile and related records.
 */
export async function getProfileData(): Promise<ProfileData> {
  try {
    const user = await requireAuth();

    // In some environments (notably mock auth during E2E) the authenticated user may not have a
    // corresponding `profiles` row yet. Since `individual_profiles.user_id` FK references
    // `profiles.id`, ensure the parent exists before attempting to create the child row.
    try {
      await db
        .insert(profiles)
        .values({
          id: user.id,
          persona: (user.persona as any) ?? 'unknown',
          displayName: user.displayName ?? null,
          avatarUrl: user.avatarUrl ?? null,
          locale: user.locale ?? 'en',
        })
        .onConflictDoNothing();
    } catch (error) {
      console.error('Failed to ensure profiles row exists:', error);
      // Continue - downstream queries may still work if the profile already exists.
    }

    let profileRow;
    try {
      [profileRow] = await db
        .select()
        .from(individualProfiles)
        .where(eq(individualProfiles.userId, user.id))
        .limit(1);
    } catch (error) {
      console.error('Failed to fetch profile row:', error);
      // Continue with empty profile
    }

    if (!profileRow) {
      try {
        await db.insert(individualProfiles).values({
          userId: user.id,
          skills: [],
          causes: [],
          values: [],
        });
      } catch (error) {
        console.error('Failed to create profile row:', error);
        // Continue - profile might already exist
      }
    }

    let profile;
    try {
      [profile] = await db
        .select()
        .from(individualProfiles)
        .where(eq(individualProfiles.userId, user.id))
        .limit(1);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      profile = null;
    }

    let profileBasics;
    try {
      [profileBasics] = await db
        .select({
          displayName: profiles.displayName,
          avatarUrl: profiles.avatarUrl,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
    } catch (error) {
      console.error('Failed to fetch profile basics:', error);
      profileBasics = null;
    }

    let impactRows: any[] = [];
    let impactVerificationRows: any[] = [];
    let experienceRows: any[] = [];
    let educationRows: any[] = [];
    let volunteeringRows: any[] = [];
    let skillRows: any[] = [];

    try {
      [impactRows, experienceRows, educationRows, volunteeringRows, skillRows] = await Promise.all([
        db
          .select({
            id: impactStories.id,
            title: impactStories.title,
            orgDescription: impactStories.orgDescription,
            impact: impactStories.impact,
            businessValue: impactStories.businessValue,
            outcomes: impactStories.outcomes,
            timeline: impactStories.timeline,
            timelineStructured: impactStories.timelineStructured,
            affiliationType: impactStories.affiliationType,
            affiliationDetails: impactStories.affiliationDetails,
            roleTitle: impactStories.roleTitle,
            roleScope: impactStories.roleScope,
            primaryCause: impactStories.primaryCause,
            secondaryCauses: impactStories.secondaryCauses,
            measuredOutcomes: impactStories.measuredOutcomes,
            supportingArtifacts: impactStories.supportingArtifacts,
            verified: impactStories.verified,
          })
          .from(impactStories)
          .where(eq(impactStories.userId, user.id)),
        db
          .select({
            id: experiences.id,
            title: experiences.title,
            orgDescription: experiences.orgDescription,
            duration: experiences.duration,
            startDate: experiences.startDate,
            endDate: experiences.endDate,
            outcomes: experiences.outcomes,
            projects: experiences.projects,
            colleagues: experiences.colleagues,
            achievements: experiences.achievements,
            verified: experiences.verified,
          })
          .from(experiences)
          .where(eq(experiences.userId, user.id)),
        db
          .select({
            id: education.id,
            institution: education.institution,
            degree: education.degree,
            duration: education.duration,
            skills: education.skills,
            projects: education.projects,
            verified: education.verified,
          })
          .from(education)
          .where(eq(education.userId, user.id)),
        db
          .select({
            id: volunteering.id,
            title: volunteering.title,
            orgDescription: volunteering.orgDescription,
            duration: volunteering.duration,
            cause: volunteering.cause,
            impact: volunteering.impact,
            skillsDeployed: volunteering.skillsDeployed,
            personalWhy: volunteering.personalWhy,
            verified: volunteering.verified,
          })
          .from(volunteering)
          .where(eq(volunteering.userId, user.id)),
        // Fetch L4 skills from the skills table with taxonomy data
        db
          .select({
            id: skillsTable.id,
            skillCode: skillsTable.skillCode,
            skillId: skillsTable.skillId,
            level: skillsTable.level,
            nameI18n: skillsTaxonomy.nameI18n,
          })
          .from(skillsTable)
          .leftJoin(skillsTaxonomy, eq(skillsTable.skillCode, skillsTaxonomy.code))
          .where(eq(skillsTable.profileId, user.id)),
      ]);
    } catch (error) {
      console.error('Failed to fetch profile related data:', error);
      // Continue with empty arrays
    }

    try {
      impactVerificationRows = await db
        .select({
          impactStoryId: impactStoryVerificationRequests.impactStoryId,
          status: impactStoryVerificationRequests.status,
          verifierEmail: impactStoryVerificationRequests.verifierEmail,
          createdAt: impactStoryVerificationRequests.createdAt,
          emailSentAt: impactStoryVerificationRequests.emailSentAt,
          emailError: impactStoryVerificationRequests.emailError,
        })
        .from(impactStoryVerificationRequests)
        .where(eq(impactStoryVerificationRequests.requesterProfileId, user.id));

      impactVerificationRows.sort((a, b) => {
        const left = toIsoStringOrNull(a?.createdAt) || '';
        const right = toIsoStringOrNull(b?.createdAt) || '';
        return right.localeCompare(left);
      });
    } catch (error) {
      const verificationMarkers = ['impact_story_verification_requests', 'created_at'];
      if (!isSchemaDriftError(error, verificationMarkers)) {
        console.error('Failed to fetch impact verification summaries:', error);
      }
      impactVerificationRows = [];
    }

    // Transform L4 skills to profile format
    // Check for proofs to determine verified status
    let proofCounts: Record<string, number> = {};
    let proofArtifactCount = 0;
    let acceptedVerificationCount = 0;
    try {
      const proofs = await db
        .select({ skillId: skillProofs.skillId })
        .from(skillProofs)
        .where(eq(skillProofs.profileId, user.id));
      proofArtifactCount = proofs.length;
      proofs.forEach((p) => {
        proofCounts[p.skillId] = (proofCounts[p.skillId] || 0) + 1;
      });
    } catch {
      // Continue without proof counts
    }

    try {
      const verificationRows = await db
        .select({ id: skillVerificationRequests.id })
        .from(skillVerificationRequests)
        .where(
          and(
            eq(skillVerificationRequests.requesterProfileId, user.id),
            eq(skillVerificationRequests.status, 'accepted')
          )
        );
      acceptedVerificationCount = verificationRows.length;
    } catch {
      // Continue without accepted verification count
    }

    const mappedSkills: Skill[] = skillRows.map((row: any) => {
      const nameI18n = row.nameI18n as Record<string, string> | null;
      const skillName = nameI18n?.en || row.skillId || 'Unknown Skill';
      return {
        id: row.id,
        name: skillName,
        verified: (proofCounts[row.id] || 0) > 0,
      };
    });

    const mappedExperiences: Experience[] = experienceRows.map((row: any) => {
      const timeline = buildExperienceTimeline({
        startDate: coerceDateOnlyString(row.startDate),
        endDate: coerceDateOnlyString(row.endDate),
        duration: row.duration,
      });

      return {
        id: row.id,
        title: row.title,
        orgDescription: row.orgDescription,
        duration: timeline.duration,
        startDate: timeline.startDate,
        endDate: timeline.endDate,
        outcomes: row.outcomes,
        projects: row.projects,
        colleagues: row.colleagues,
        achievements: row.achievements,
        verified: row.verified,
      };
    });

    const mappedValues = normalizeIndividualValues(profile?.values);
    const mappedCauses = normalizeIndividualCauses(profile?.causes);
    const missionLinks = pruneIndividualPurposeLinks(
      normalizeIndividualPurposeLinks(profile?.missionLinks),
      mappedValues,
      mappedCauses
    );
    const visionLinks = pruneIndividualPurposeLinks(
      normalizeIndividualPurposeLinks(profile?.visionLinks),
      mappedValues,
      mappedCauses
    );
    const defaultPurposeLinks = createIndividualDefaultPurposeLinks(mappedValues, mappedCauses);
    const resolvedMissionLinks =
      profile?.mission && !hasRequiredPurposeLinks(missionLinks)
        ? defaultPurposeLinks
        : missionLinks;
    const resolvedVisionLinks =
      profile?.vision && !hasRequiredPurposeLinks(visionLinks) ? defaultPurposeLinks : visionLinks;
    const latestImpactVerificationByStory = new Map<
      string,
      {
        status: ImpactStoryVerificationRequestStatus;
        verifierEmail: string | null;
        createdAt: string | null;
        emailSentAt: string | null;
        emailError: string | null;
      }
    >();

    for (const verificationRow of impactVerificationRows) {
      if (!verificationRow?.impactStoryId) continue;
      if (latestImpactVerificationByStory.has(verificationRow.impactStoryId)) continue;
      latestImpactVerificationByStory.set(verificationRow.impactStoryId, {
        status: verificationRow.status as ImpactStoryVerificationRequestStatus,
        verifierEmail: verificationRow.verifierEmail || null,
        createdAt: toIsoStringOrNull(verificationRow.createdAt),
        emailSentAt: toIsoStringOrNull(verificationRow.emailSentAt),
        emailError: verificationRow.emailError || null,
      });
    }

    const impactStoriesWithVerification: ImpactStory[] = impactRows.map((row: any) => {
      const verificationSummary = latestImpactVerificationByStory.get(row.id);
      return {
        ...row,
        verificationRequestStatus: verificationSummary?.status || null,
        verificationRequestedAt: verificationSummary?.createdAt || null,
        verificationVerifierEmail: verificationSummary?.verifierEmail || null,
        verificationEmailSentAt: verificationSummary?.emailSentAt || null,
        verificationEmailError: verificationSummary?.emailError || null,
      };
    });

    return {
      basicInfo: {
        name: profileBasics?.displayName ?? user.displayName ?? 'Your Name',
        tagline: profile?.tagline ?? null,
        location: profile?.location ?? null,
        joinedDate: (profileBasics?.createdAt ?? new Date()).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        avatar: profileBasics?.avatarUrl ?? user.avatarUrl ?? null,
        coverImage: profile?.coverImageUrl ?? null,
      },
      mission: profile?.mission ?? null,
      vision: profile?.vision ?? null,
      missionLinks: resolvedMissionLinks,
      visionLinks: resolvedVisionLinks,
      values: mappedValues,
      causes: mappedCauses,
      skills: mappedSkills, // Now fetched from L4 skills table
      proofArtifactCount,
      acceptedVerificationCount,
      impactStories: impactStoriesWithVerification,
      experiences: mappedExperiences,
      education: educationRows,
      volunteering: volunteeringRows,
      fieldVisibility:
        profile?.fieldVisibility && typeof profile.fieldVisibility === 'object'
          ? (profile.fieldVisibility as FieldVisibility)
          : {},
      redactMode: profile?.redactMode ?? false,
    };
  } catch (error) {
    // Re-throw Next.js redirect/not-found errors - they must propagate
    if (
      error instanceof Error &&
      (error.message === 'NEXT_REDIRECT' ||
        error.message === 'NEXT_NOT_FOUND' ||
        (error as any).digest?.startsWith('NEXT_REDIRECT') ||
        (error as any).digest?.startsWith('NEXT_NOT_FOUND'))
    ) {
      throw error;
    }
    console.error('Failed to get profile data:', error);
    // Return empty profile structure instead of throwing
    // This prevents the page from crashing completely
    return {
      basicInfo: {
        name: 'Your Name',
        tagline: null,
        location: null,
        joinedDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        }),
        avatar: null,
        coverImage: null,
      },
      mission: null,
      vision: null,
      missionLinks: createIndividualDefaultPurposeLinks([], []),
      visionLinks: createIndividualDefaultPurposeLinks([], []),
      values: [],
      causes: [],
      skills: [],
      proofArtifactCount: 0,
      acceptedVerificationCount: 0,
      impactStories: [],
      experiences: [],
      education: [],
      volunteering: [],
      fieldVisibility: {},
      redactMode: false,
    };
  }
}

export async function updateBasicInfo(updates: Partial<BasicInfo>) {
  const user = await requireAuth();

  const individualUpdates: Record<string, unknown> = {};
  if (updates.tagline !== undefined) individualUpdates.tagline = updates.tagline;
  if (updates.location !== undefined) individualUpdates.location = updates.location;
  if (updates.coverImage !== undefined) individualUpdates.coverImageUrl = updates.coverImage;

  if (Object.keys(individualUpdates).length > 0) {
    await db
      .update(individualProfiles)
      .set(individualUpdates)
      .where(eq(individualProfiles.userId, user.id));
  }

  const profileUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) profileUpdates.displayName = updates.name;
  if (updates.avatar !== undefined) profileUpdates.avatarUrl = updates.avatar;

  if (Object.keys(profileUpdates).length > 0) {
    await db.update(profiles).set(profileUpdates).where(eq(profiles.id, user.id));
  }

  revalidatePath('/app/i/profile');
}

export async function updateMission(
  mission: string | null,
  links?: PurposeLinks,
  visibility?: 'public' | 'network' | 'private'
) {
  await updatePurposeTextField('mission', mission, links, visibility, 'public');
}

export async function updateVision(
  vision: string | null,
  links?: PurposeLinks,
  visibility?: 'public' | 'network' | 'private'
) {
  await updatePurposeTextField('vision', vision, links, visibility, 'network');
}

export async function replaceValues(values: Value[]) {
  await replacePurposeListField('values', values);
}

export async function replaceCauses(causes: string[]) {
  await replacePurposeListField('causes', causes);
}

export async function replaceSkills(skills: Skill[]) {
  const user = await requireAuth();
  await db
    .update(individualProfiles)
    .set({ skills: skills.map((skill) => skill.name) })
    .where(eq(individualProfiles.userId, user.id));

  // Check if profile now meets activation criteria
  await checkAndEmitProfileActivation(user.id);

  revalidatePath('/app/i/profile');
}

const ROLE_SCOPE_LABELS: Record<ImpactStoryRoleScope, string> = {
  owned: 'Owned',
  co_led: 'Co-led',
  contributed: 'Contributed',
};

type ImpactStoryCreateResult = ImpactStory & {
  verificationWarning?: string | null;
  saveMode?: ImpactStorySaveMode;
  saveWarning?: string | null;
};

type ImpactStoryVerificationRecord = {
  requestId: string;
  status: ImpactStoryVerificationRequestStatus;
  emailSent: boolean;
  emailError: string | null;
  warning: string | null;
  verifierEmail: string;
  createdAt: string;
  emailSentAt: string | null;
};

type ImpactStoryVerificationRequestInternalInput = {
  userId: string;
  impactStoryId: string;
  storyData: Omit<ImpactStory, 'id'>;
  verificationRequest: ImpactStoryVerificationRequestInput;
  requestHeaders?: Headers | null;
};

type ImpactStoryVerificationRequestInternalResult = {
  verification: ImpactStoryVerificationRecord | null;
  warning: string | null;
  storageUnavailable: boolean;
};

function formatTimelineForLegacy(
  timeline: ImpactStoryTimeline | null | undefined,
  fallback: string
) {
  if (!timeline) return fallback;

  if (timeline.mode === 'single') {
    return timeline.start;
  }

  if (timeline.ongoing) {
    return `${timeline.start} - Present`;
  }

  return timeline.end ? `${timeline.start} - ${timeline.end}` : timeline.start;
}

function formatOutcomesForLegacy(
  measuredOutcomes: ImpactStoryOutcome[] | null | undefined,
  fallback: string
) {
  if (!measuredOutcomes || measuredOutcomes.length === 0) return fallback;

  return measuredOutcomes
    .map((outcome) => {
      const value = Number.isFinite(outcome.value) ? outcome.value : 0;
      return `${outcome.label}: ${value} ${outcome.unit} (${outcome.valueMode})`;
    })
    .join('; ');
}

function buildLegacyOrgDescription(data: Omit<ImpactStory, 'id'>) {
  if (data.orgDescription?.trim()) return data.orgDescription.trim();

  if (data.affiliationType === 'organization') {
    return data.affiliationDetails?.trim() || 'Affiliated organization';
  }

  return data.affiliationDetails?.trim() || 'Individual effort';
}

function buildLegacyImpact(data: Omit<ImpactStory, 'id'>) {
  if (data.impact?.trim()) return data.impact.trim();

  const scope = data.roleScope ? ROLE_SCOPE_LABELS[data.roleScope] : 'Contributed';
  const role = data.roleTitle?.trim() || 'Contributor';
  const causes = [data.primaryCause, ...(data.secondaryCauses || [])].filter(Boolean).join(', ');
  return `${scope} as ${role}${causes ? ` across ${causes}` : ''}`;
}

function buildLegacyBusinessValue(data: Omit<ImpactStory, 'id'>) {
  if (data.businessValue?.trim()) return data.businessValue.trim();
  const outcomeCount = data.measuredOutcomes?.length || 0;
  return outcomeCount > 0
    ? `Delivered ${outcomeCount} measured outcome${outcomeCount > 1 ? 's' : ''}`
    : 'Structured impact story recorded';
}

function buildLegacyOutcomeClaimLabel(outcomesText: string | null | undefined) {
  if (!outcomesText) return null;

  const collapsed = outcomesText.replace(/\s+/g, ' ').trim();
  if (!collapsed) return null;

  const maxLength = 140;
  const normalizedText =
    collapsed.length > maxLength ? `${collapsed.slice(0, maxLength - 3).trimEnd()}...` : collapsed;

  return `Outcome confirmation (${normalizedText})`;
}

function buildClaimSnapshot(
  data: Omit<ImpactStory, 'id'>,
  context?: {
    verifierRelationship?: string | null;
    requesterDomain?: string | null;
    verifierDomain?: string | null;
    requesterEmail?: string | null;
  }
) {
  const measuredOutcomeClaims = (data.measuredOutcomes || []).map((outcome) => ({
    id: `outcome:${outcome.id}`,
    outcomeId: outcome.id,
    label: `${outcome.label} (${outcome.value} ${outcome.unit})`,
  }));
  const legacyOutcomeClaimLabel =
    measuredOutcomeClaims.length > 0 ? null : buildLegacyOutcomeClaimLabel(data.outcomes);
  const outcomeClaims =
    measuredOutcomeClaims.length > 0
      ? measuredOutcomeClaims
      : legacyOutcomeClaimLabel
        ? [
            {
              id: 'outcome:legacy',
              label: legacyOutcomeClaimLabel,
            },
          ]
        : [];

  return {
    verificationType: 'impact_story',
    title: data.title,
    roleClaim: {
      id: 'role',
      label: `Role participation (${data.roleTitle || 'Contributor'}, ${data.roleScope || 'contributed'})`,
    },
    outcomeClaims,
    artifactsClaim: {
      id: 'artifacts',
      label: 'Supporting artifacts authenticity',
      enabled: (data.supportingArtifacts || []).length > 0,
    },
    context: {
      verifierRelationship: context?.verifierRelationship || null,
      requesterDomain: context?.requesterDomain || null,
      verifierDomain: context?.verifierDomain || null,
      requesterEmail: context?.requesterEmail || null,
    },
  };
}

function normalizeBaseUrl(url?: string | null) {
  const base = (url || '').trim();
  if (!base) return 'http://localhost:3000';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function toIsoStringOrNull(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? trimmed : parsed.toISOString();
  }

  return null;
}

async function resolveRequesterEmailSnapshot(): Promise<string | null> {
  try {
    const supabase = await createClient({ allowCookieWrite: true });
    const { data: authUserData } = await supabase.auth.getUser();
    return normalizeEmail(authUserData.user?.email || null);
  } catch (authContextError) {
    console.warn('impact verification: unable to resolve requester auth email', authContextError);
    return null;
  }
}

function mapImpactStoryRowToDraft(
  row: {
    title: string;
    orgDescription: string;
    impact: string;
    businessValue: string;
    outcomes: string;
    timeline: string;
    timelineStructured: unknown;
    affiliationType: string | null;
    affiliationDetails: string | null;
    roleTitle: string | null;
    roleScope: string | null;
    primaryCause: string | null;
    secondaryCauses: unknown;
    measuredOutcomes: unknown;
    supportingArtifacts: unknown;
    verified: boolean | null;
  },
  verificationRequest?: ImpactStoryVerificationRequestInput | null
): Omit<ImpactStory, 'id'> {
  const measuredOutcomes = Array.isArray(row.measuredOutcomes)
    ? (row.measuredOutcomes as ImpactStoryOutcome[])
    : [];
  const supportingArtifacts = Array.isArray(row.supportingArtifacts)
    ? (row.supportingArtifacts as ImpactStoryArtifact[])
    : [];
  const secondaryCauses = Array.isArray(row.secondaryCauses)
    ? row.secondaryCauses.filter((item): item is string => typeof item === 'string')
    : [];

  return {
    title: row.title,
    orgDescription: row.orgDescription,
    impact: row.impact,
    businessValue: row.businessValue,
    outcomes: row.outcomes,
    timeline: row.timeline,
    verified: row.verified ?? false,
    timelineStructured: (row.timelineStructured as ImpactStoryTimeline) || null,
    affiliationType: (row.affiliationType as ImpactStory['affiliationType']) || null,
    affiliationDetails: row.affiliationDetails || null,
    roleTitle: row.roleTitle || null,
    roleScope: (row.roleScope as ImpactStoryRoleScope) || null,
    primaryCause: row.primaryCause || null,
    secondaryCauses,
    measuredOutcomes,
    supportingArtifacts,
    verificationRequest: verificationRequest || null,
  };
}

async function createImpactStoryVerificationRequestInternal(
  input: ImpactStoryVerificationRequestInternalInput
): Promise<ImpactStoryVerificationRequestInternalResult> {
  const normalizedVerifierEmail = normalizeEmail(input.verificationRequest.verifierEmail);
  if (!normalizedVerifierEmail) {
    return {
      verification: null,
      warning: 'Verifier email must be valid.',
      storageUnavailable: false,
    };
  }

  const requesterEmail = await resolveRequesterEmailSnapshot();
  const integrityAssessment = await assessVerificationRequestIntegrity({
    requesterProfileId: input.userId,
    requesterEmail,
    verifierEmail: normalizedVerifierEmail,
    verifierSource: null,
    headers: input.requestHeaders || null,
  });

  if (integrityAssessment.policy.blockSelf) {
    await writeVerificationAuditLog({
      actorId: input.userId,
      action: 'verification.request.blocked',
      targetType: 'impact_story',
      targetId: input.impactStoryId,
      meta: {
        reason: VERIFICATION_INTEGRITY_REASONS.SELF_VERIFICATION_BLOCKED,
        verifier_email: normalizedVerifierEmail,
        risk_signals: integrityAssessment.riskSignals,
      },
    });

    return {
      verification: null,
      warning: 'Self-verification requests are not allowed. Choose an independent verifier.',
      storageUnavailable: false,
    };
  }

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const claimSnapshot = buildClaimSnapshot(input.storyData, {
    verifierRelationship: input.verificationRequest.verifierRelationship || null,
    requesterDomain: integrityAssessment.requesterDomain,
    verifierDomain: integrityAssessment.verifierDomain,
    requesterEmail: integrityAssessment.normalizedRequesterEmail,
  });

  let verificationRequest: {
    id: string;
    integrityStatus?: string | null;
    createdAt?: Date | string | null;
  } | null = null;

  try {
    const [insertedVerificationRequest] = await db
      .insert(impactStoryVerificationRequests)
      .values({
        impactStoryId: input.impactStoryId,
        requesterProfileId: input.userId,
        requesterEmailSnapshot: integrityAssessment.normalizedRequesterEmail,
        requesterDomainSnapshot: integrityAssessment.requesterDomain,
        verifierEmail: normalizedVerifierEmail,
        verifierDomainSnapshot: integrityAssessment.verifierDomain,
        verifierProfileId: integrityAssessment.verifierProfileId,
        verifierName: input.verificationRequest.verifierName || null,
        verifierRelationship: input.verificationRequest.verifierRelationship || null,
        message: input.verificationRequest.message || null,
        riskSignals: integrityAssessment.riskSignals,
        requiresAuthenticatedVerifier: integrityAssessment.policy.requiresAuthenticatedVerifier,
        integrityStatus: integrityAssessment.policy.integrityStatus,
        integrityReason: integrityAssessment.policy.integrityReason,
        integrityMeta: {
          policy: {
            requires_authenticated_verifier:
              integrityAssessment.policy.requiresAuthenticatedVerifier,
            integrity_status: integrityAssessment.policy.integrityStatus,
            integrity_reason: integrityAssessment.policy.integrityReason,
          },
        },
        requesterIpHash: integrityAssessment.requesterFingerprints.ipHash,
        requesterUserAgentHash: integrityAssessment.requesterFingerprints.userAgentHash,
        token,
        status: 'pending',
        expiresAt,
        claimSnapshot,
      })
      .returning({
        id: impactStoryVerificationRequests.id,
        integrityStatus: impactStoryVerificationRequests.integrityStatus,
        createdAt: impactStoryVerificationRequests.createdAt,
      });
    verificationRequest = insertedVerificationRequest || null;
  } catch (error) {
    const verificationMarkers = ['impact_story_verification_requests', 'claim_snapshot'];
    if (isSchemaDriftError(error, verificationMarkers)) {
      return {
        verification: null,
        warning: 'Verification storage is unavailable until the latest migrations are applied.',
        storageUnavailable: true,
      };
    }

    throw error;
  }

  if (!verificationRequest) {
    return {
      verification: null,
      warning: 'Failed to create verification request.',
      storageUnavailable: false,
    };
  }

  await writeVerificationAuditLog({
    actorId: input.userId,
    action: 'verification.request.created',
    targetType: 'impact_story_verification_request',
    targetId: verificationRequest.id,
    meta: {
      impact_story_id: input.impactStoryId,
      verifier_email: normalizedVerifierEmail,
      integrity_status: verificationRequest.integrityStatus || 'clear',
      requires_authenticated_verifier: integrityAssessment.policy.requiresAuthenticatedVerifier,
      risk_signals: integrityAssessment.riskSignals,
    },
  });

  const headerBaseUrl = input.requestHeaders ? resolveSiteUrlFromHeaders(input.requestHeaders) : '';
  const baseUrl = normalizeBaseUrl(
    headerBaseUrl ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.SITE_URL
  );
  const verifyUrl = `${baseUrl}/verify/${token}`;

  const emailResult = await sendEmail({
    to: normalizedVerifierEmail,
    subject: `${input.storyData.title} verification request on Proofound`,
    html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">
          <h2 style="margin-bottom: 16px; color: #1f2937;">Impact story verification request</h2>
          <p style="color: #374151;">You have been asked to verify claims for the impact story <strong>${input.storyData.title}</strong>.</p>
          <p style="color: #374151;">Please review role participation, measurable outcomes, and supporting artifacts claims.</p>
          ${
            input.verificationRequest.message
              ? `<p style="color: #374151;"><em>"${input.verificationRequest.message}"</em></p>`
              : ''
          }
          <p style="margin-top: 24px;">
            <a href="${verifyUrl}" style="display: inline-block; background: #1f4d3a; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px;">Open verification request</a>
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">This link expires on ${expiresAt.toISOString().split('T')[0]}.</p>
        </div>
      `,
    text: `You have been asked to verify claims for "${input.storyData.title}". Open: ${verifyUrl}`,
  });

  const createdAtIso = toIsoStringOrNull(verificationRequest.createdAt) || new Date().toISOString();

  if (!emailResult.success) {
    const warning = emailResult.error || 'Failed to send verification request email.';
    await db
      .update(impactStoryVerificationRequests)
      .set({
        status: 'failed',
        emailError: warning,
        updatedAt: new Date(),
      })
      .where(eq(impactStoryVerificationRequests.id, verificationRequest.id));

    return {
      verification: {
        requestId: verificationRequest.id,
        status: 'failed',
        emailSent: false,
        emailError: warning,
        warning,
        verifierEmail: normalizedVerifierEmail,
        createdAt: createdAtIso,
        emailSentAt: null,
      },
      warning,
      storageUnavailable: false,
    };
  }

  const emailSentAt = new Date();
  await db
    .update(impactStoryVerificationRequests)
    .set({
      emailSentAt,
      updatedAt: emailSentAt,
    })
    .where(eq(impactStoryVerificationRequests.id, verificationRequest.id));

  return {
    verification: {
      requestId: verificationRequest.id,
      status: 'pending',
      emailSent: true,
      emailError: null,
      warning: null,
      verifierEmail: normalizedVerifierEmail,
      createdAt: createdAtIso,
      emailSentAt: emailSentAt.toISOString(),
    },
    warning: null,
    storageUnavailable: false,
  };
}

function collectSchemaErrorText(error: unknown): string {
  const values = [error];
  const seen = new Set<unknown>();
  const chunks: string[] = [];

  while (values.length > 0) {
    const current = values.pop();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (typeof current === 'string') {
      chunks.push(current);
      continue;
    }

    if (typeof current !== 'object') {
      continue;
    }

    const objectValue = current as {
      message?: unknown;
      detail?: unknown;
      details?: unknown;
      hint?: unknown;
      cause?: unknown;
    };

    if (typeof objectValue.message === 'string') chunks.push(objectValue.message);
    if (typeof objectValue.detail === 'string') chunks.push(objectValue.detail);
    if (typeof objectValue.details === 'string') chunks.push(objectValue.details);
    if (typeof objectValue.hint === 'string') chunks.push(objectValue.hint);
    if (objectValue.cause) values.push(objectValue.cause);
  }

  return chunks.join(' ').toLowerCase();
}

function getSchemaErrorCode(error: unknown): string | null {
  const values = [error];
  const seen = new Set<unknown>();

  while (values.length > 0) {
    const current = values.pop();
    if (!current || seen.has(current)) {
      continue;
    }
    seen.add(current);

    if (typeof current !== 'object') {
      continue;
    }

    const objectValue = current as { code?: unknown; cause?: unknown };
    if (typeof objectValue.code === 'string' && objectValue.code.trim()) {
      return objectValue.code;
    }

    if (objectValue.cause) {
      values.push(objectValue.cause);
    }
  }

  return null;
}

function isSchemaDriftError(error: unknown, markers: string[]): boolean {
  const code = getSchemaErrorCode(error);
  if (!code || !['42703', '42P01', 'PGRST204'].includes(code)) {
    return false;
  }

  const text = collectSchemaErrorText(error);
  return markers.some((marker) => text.includes(marker));
}

export async function createImpactStory(data: Omit<ImpactStory, 'id'>) {
  const user = await requireAuth();
  const timelineText = formatTimelineForLegacy(data.timelineStructured, data.timeline);
  const outcomesText = formatOutcomesForLegacy(data.measuredOutcomes, data.outcomes);
  const legacyOrgDescription = buildLegacyOrgDescription(data);
  const legacyImpact = buildLegacyImpact(data);
  const legacyBusinessValue = buildLegacyBusinessValue(data);
  const structuredInsertPayload = {
    userId: user.id,
    title: data.title,
    orgDescription: legacyOrgDescription,
    impact: legacyImpact,
    businessValue: legacyBusinessValue,
    outcomes: outcomesText,
    timeline: timelineText,
    timelineStructured: data.timelineStructured || {},
    affiliationType: data.affiliationType ?? null,
    affiliationDetails: data.affiliationDetails ?? null,
    roleTitle: data.roleTitle ?? null,
    roleScope: data.roleScope ?? null,
    primaryCause: data.primaryCause ?? null,
    secondaryCauses: data.secondaryCauses ?? [],
    measuredOutcomes: data.measuredOutcomes || [],
    supportingArtifacts: data.supportingArtifacts || [],
    verified: data.verified ?? false,
  };
  const legacyInsertPayload = {
    userId: user.id,
    title: data.title,
    orgDescription: legacyOrgDescription,
    impact: legacyImpact,
    businessValue: legacyBusinessValue,
    outcomes: outcomesText,
    timeline: timelineText,
    verified: data.verified ?? false,
  };
  const structuredSchemaMarkers = [
    'impact_stories',
    'timeline_structured',
    'affiliation_type',
    'affiliation_details',
    'role_title',
    'role_scope',
    'primary_cause',
    'secondary_causes',
    'measured_outcomes',
    'supporting_artifacts',
  ];

  let saveMode: ImpactStorySaveMode = 'structured';
  let saveWarning: string | null = null;
  let inserted: any;

  try {
    [inserted] = await db.insert(impactStories).values(structuredInsertPayload).returning();
  } catch (error) {
    if (!isSchemaDriftError(error, structuredSchemaMarkers)) {
      throw error;
    }

    [inserted] = await db.insert(impactStories).values(legacyInsertPayload).returning();
    saveMode = 'legacy_fallback';
    saveWarning =
      'Saved in compatibility mode because structured impact columns are unavailable in the active schema.';
  }

  let verificationWarning: string | null = null;

  if (data.verificationRequest?.verifierEmail) {
    let requestHeaders: Headers | null = null;
    try {
      requestHeaders = (await headers()) as unknown as Headers;
    } catch {
      requestHeaders = null;
    }

    const verificationResult = await createImpactStoryVerificationRequestInternal({
      userId: user.id,
      impactStoryId: inserted.id,
      storyData: mapImpactStoryRowToDraft(
        {
          title: inserted.title,
          orgDescription: inserted.orgDescription,
          impact: inserted.impact,
          businessValue: inserted.businessValue,
          outcomes: inserted.outcomes,
          timeline: inserted.timeline,
          timelineStructured: inserted.timelineStructured,
          affiliationType: inserted.affiliationType,
          affiliationDetails: inserted.affiliationDetails,
          roleTitle: inserted.roleTitle,
          roleScope: inserted.roleScope,
          primaryCause: inserted.primaryCause,
          secondaryCauses: inserted.secondaryCauses,
          measuredOutcomes: inserted.measuredOutcomes,
          supportingArtifacts: inserted.supportingArtifacts,
          verified: inserted.verified,
        },
        data.verificationRequest
      ),
      verificationRequest: data.verificationRequest,
      requestHeaders,
    });

    if (verificationResult.storageUnavailable) {
      verificationWarning =
        verificationResult.warning ||
        'Impact story saved, but verification storage is unavailable until the latest migrations are applied.';
      if (!saveWarning) {
        saveWarning =
          'Saved in compatibility mode because verification request tables are unavailable in the active schema.';
      }
      if (saveMode !== 'legacy_fallback') {
        saveMode = 'legacy_fallback';
      }
    } else if (verificationResult.warning) {
      verificationWarning =
        verificationResult.warning === 'Verifier email must be valid.'
          ? 'Impact story saved, but verifier email was invalid.'
          : verificationResult.warning;
    }

    if (verificationResult.verification) {
      inserted = {
        ...inserted,
        verificationRequestStatus: verificationResult.verification.status,
        verificationRequestedAt: verificationResult.verification.createdAt,
        verificationVerifierEmail: verificationResult.verification.verifierEmail,
        verificationEmailSentAt: verificationResult.verification.emailSentAt,
        verificationEmailError: verificationResult.verification.emailError,
      };
    }
  }

  revalidatePath('/app/i/profile');
  return {
    ...inserted,
    saveMode,
    saveWarning,
    verificationWarning,
  } as ImpactStoryCreateResult;
}

export async function requestImpactStoryVerification(
  params: ImpactStoryVerificationRequestDispatchParams
): Promise<ImpactStoryVerificationRequestDispatchResult> {
  const user = await requireAuth();
  const storyId = params.storyId?.trim();
  const verificationRequest = params.verificationRequest;

  let baseStory: ImpactStoryCreateResult;
  let verificationStoryDraft: Omit<ImpactStory, 'id'>;
  let saveWarning: string | null = null;

  if (storyId && params.storyDraft) {
    const updatedStory = await updateImpactStory(storyId, {
      ...params.storyDraft,
      verificationRequest: null,
    });

    baseStory = updatedStory;
    verificationStoryDraft = mapImpactStoryRowToDraft(
      {
        title: updatedStory.title,
        orgDescription: updatedStory.orgDescription,
        impact: updatedStory.impact,
        businessValue: updatedStory.businessValue,
        outcomes: updatedStory.outcomes,
        timeline: updatedStory.timeline,
        timelineStructured: updatedStory.timelineStructured || null,
        affiliationType: updatedStory.affiliationType || null,
        affiliationDetails: updatedStory.affiliationDetails || null,
        roleTitle: updatedStory.roleTitle || null,
        roleScope: updatedStory.roleScope || null,
        primaryCause: updatedStory.primaryCause || null,
        secondaryCauses: updatedStory.secondaryCauses || [],
        measuredOutcomes: updatedStory.measuredOutcomes || [],
        supportingArtifacts: updatedStory.supportingArtifacts || [],
        verified: updatedStory.verified,
      },
      verificationRequest
    );
  } else if (storyId) {
    const [storyRow] = await db
      .select({
        id: impactStories.id,
        title: impactStories.title,
        orgDescription: impactStories.orgDescription,
        impact: impactStories.impact,
        businessValue: impactStories.businessValue,
        outcomes: impactStories.outcomes,
        timeline: impactStories.timeline,
        timelineStructured: impactStories.timelineStructured,
        affiliationType: impactStories.affiliationType,
        affiliationDetails: impactStories.affiliationDetails,
        roleTitle: impactStories.roleTitle,
        roleScope: impactStories.roleScope,
        primaryCause: impactStories.primaryCause,
        secondaryCauses: impactStories.secondaryCauses,
        measuredOutcomes: impactStories.measuredOutcomes,
        supportingArtifacts: impactStories.supportingArtifacts,
        verified: impactStories.verified,
      })
      .from(impactStories)
      .where(and(eq(impactStories.id, storyId), eq(impactStories.userId, user.id)))
      .limit(1);

    if (!storyRow) {
      throw new Error('Impact story not found.');
    }

    baseStory = {
      ...storyRow,
    } as ImpactStoryCreateResult;
    verificationStoryDraft = mapImpactStoryRowToDraft(storyRow, verificationRequest);
  } else {
    if (!params.storyDraft) {
      throw new Error('Story details are required before requesting verification.');
    }

    const createdStory = await createImpactStory({
      ...params.storyDraft,
      verificationRequest: null,
    });

    baseStory = createdStory;
    saveWarning = createdStory.saveWarning || null;
    verificationStoryDraft = mapImpactStoryRowToDraft(
      {
        title: createdStory.title,
        orgDescription: createdStory.orgDescription,
        impact: createdStory.impact,
        businessValue: createdStory.businessValue,
        outcomes: createdStory.outcomes,
        timeline: createdStory.timeline,
        timelineStructured: createdStory.timelineStructured,
        affiliationType: createdStory.affiliationType || null,
        affiliationDetails: createdStory.affiliationDetails || null,
        roleTitle: createdStory.roleTitle || null,
        roleScope: createdStory.roleScope || null,
        primaryCause: createdStory.primaryCause || null,
        secondaryCauses: createdStory.secondaryCauses || [],
        measuredOutcomes: createdStory.measuredOutcomes || [],
        supportingArtifacts: createdStory.supportingArtifacts || [],
        verified: createdStory.verified,
      },
      verificationRequest
    );
  }

  let requestHeaders: Headers | null = null;
  try {
    requestHeaders = (await headers()) as unknown as Headers;
  } catch {
    requestHeaders = null;
  }

  const verificationResult = await createImpactStoryVerificationRequestInternal({
    userId: user.id,
    impactStoryId: baseStory.id,
    storyData: verificationStoryDraft,
    verificationRequest,
    requestHeaders,
  });

  if (!verificationResult.verification) {
    throw new Error(verificationResult.warning || 'Failed to create verification request.');
  }

  const storyWithVerification: ImpactStoryCreateResult = {
    ...baseStory,
    verificationRequestStatus: verificationResult.verification.status,
    verificationRequestedAt: verificationResult.verification.createdAt,
    verificationVerifierEmail: verificationResult.verification.verifierEmail,
    verificationEmailSentAt: verificationResult.verification.emailSentAt,
    verificationEmailError: verificationResult.verification.emailError,
    verificationWarning: verificationResult.warning,
  };

  revalidatePath('/app/i/profile');

  return {
    story: storyWithVerification,
    verification: {
      requestId: verificationResult.verification.requestId,
      status: verificationResult.verification.status,
      emailSent: verificationResult.verification.emailSent,
      emailError: verificationResult.verification.emailError,
      warning: verificationResult.verification.warning,
      verifierEmail: verificationResult.verification.verifierEmail,
      createdAt: verificationResult.verification.createdAt,
      emailSentAt: verificationResult.verification.emailSentAt,
    },
    saveWarning,
  };
}

export async function updateImpactStory(id: string, data: Omit<ImpactStory, 'id'>) {
  const user = await requireAuth();
  const timelineText = formatTimelineForLegacy(data.timelineStructured, data.timeline);
  const outcomesText = formatOutcomesForLegacy(data.measuredOutcomes, data.outcomes);
  const legacyOrgDescription = buildLegacyOrgDescription(data);
  const legacyImpact = buildLegacyImpact(data);
  const legacyBusinessValue = buildLegacyBusinessValue(data);
  const structuredUpdatePayload = {
    title: data.title,
    orgDescription: legacyOrgDescription,
    impact: legacyImpact,
    businessValue: legacyBusinessValue,
    outcomes: outcomesText,
    timeline: timelineText,
    timelineStructured: data.timelineStructured || {},
    affiliationType: data.affiliationType ?? null,
    affiliationDetails: data.affiliationDetails ?? null,
    roleTitle: data.roleTitle ?? null,
    roleScope: data.roleScope ?? null,
    primaryCause: data.primaryCause ?? null,
    secondaryCauses: data.secondaryCauses ?? [],
    measuredOutcomes: data.measuredOutcomes || [],
    supportingArtifacts: data.supportingArtifacts || [],
    verified: data.verified ?? false,
  };
  const legacyUpdatePayload = {
    title: data.title,
    orgDescription: legacyOrgDescription,
    impact: legacyImpact,
    businessValue: legacyBusinessValue,
    outcomes: outcomesText,
    timeline: timelineText,
    verified: data.verified ?? false,
  };
  const structuredSchemaMarkers = [
    'impact_stories',
    'timeline_structured',
    'affiliation_type',
    'affiliation_details',
    'role_title',
    'role_scope',
    'primary_cause',
    'secondary_causes',
    'measured_outcomes',
    'supporting_artifacts',
  ];

  let updated: any;

  try {
    [updated] = await db
      .update(impactStories)
      .set(structuredUpdatePayload)
      .where(and(eq(impactStories.id, id), eq(impactStories.userId, user.id)))
      .returning();
  } catch (error) {
    if (!isSchemaDriftError(error, structuredSchemaMarkers)) {
      throw error;
    }

    [updated] = await db
      .update(impactStories)
      .set(legacyUpdatePayload)
      .where(and(eq(impactStories.id, id), eq(impactStories.userId, user.id)))
      .returning();
  }

  if (!updated) {
    throw new Error('Impact story not found.');
  }

  revalidatePath('/app/i/profile');
  return updated as ImpactStoryCreateResult;
}

export async function deleteImpactStory(id: string) {
  const user = await requireAuth();
  await db
    .delete(impactStories)
    .where(and(eq(impactStories.id, id), eq(impactStories.userId, user.id)));
  revalidatePath('/app/i/profile');
}

export async function createExperience(data: Omit<Experience, 'id'>) {
  const user = await requireAuth();
  const timeline = buildExperienceTimeline({
    startDate: data.startDate,
    endDate: data.endDate,
    duration: data.duration,
  });

  const [inserted] = await db
    .insert(experiences)
    .values({
      userId: user.id,
      title: data.title,
      orgDescription: data.orgDescription,
      duration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      outcomes: data.outcomes,
      projects: data.projects,
      colleagues: data.colleagues,
      achievements: data.achievements,
      verified: data.verified ?? false,
    })
    .returning();

  revalidatePath('/app/i/profile');
  const normalizedStartDate = coerceDateOnlyString((inserted as any).startDate);
  const normalizedEndDate = coerceDateOnlyString((inserted as any).endDate);
  const normalizedTimeline = buildExperienceTimeline({
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    duration: (inserted as any).duration,
  });

  return {
    ...(inserted as any),
    startDate: normalizedTimeline.startDate,
    endDate: normalizedTimeline.endDate,
    duration: normalizedTimeline.duration,
  };
}

export async function updateExperience(id: string, data: Omit<Experience, 'id'>) {
  const user = await requireAuth();
  const timeline = buildExperienceTimeline({
    startDate: data.startDate,
    endDate: data.endDate,
    duration: data.duration,
  });

  const [updated] = await db
    .update(experiences)
    .set({
      title: data.title,
      orgDescription: data.orgDescription,
      duration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      outcomes: data.outcomes,
      projects: data.projects,
      colleagues: data.colleagues,
      achievements: data.achievements,
      verified: data.verified ?? false,
    })
    .where(and(eq(experiences.id, id), eq(experiences.userId, user.id)))
    .returning();

  if (!updated) {
    throw new Error('Experience entry not found.');
  }

  revalidatePath('/app/i/profile');
  const normalizedStartDate = coerceDateOnlyString((updated as any).startDate);
  const normalizedEndDate = coerceDateOnlyString((updated as any).endDate);
  const normalizedTimeline = buildExperienceTimeline({
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    duration: (updated as any).duration,
  });

  return {
    ...(updated as any),
    startDate: normalizedTimeline.startDate,
    endDate: normalizedTimeline.endDate,
    duration: normalizedTimeline.duration,
  };
}

export async function deleteExperience(id: string) {
  const user = await requireAuth();
  await db.delete(experiences).where(and(eq(experiences.id, id), eq(experiences.userId, user.id)));
  revalidatePath('/app/i/profile');
}

export async function createEducation(data: Omit<EducationType, 'id'>) {
  const user = await requireAuth();
  const [inserted] = await db
    .insert(education)
    .values({
      userId: user.id,
      institution: data.institution,
      degree: data.degree,
      duration: data.duration,
      skills: data.skills,
      projects: data.projects,
      verified: data.verified ?? false,
    })
    .returning();

  revalidatePath('/app/i/profile');
  return inserted;
}

export async function updateEducation(id: string, data: Omit<EducationType, 'id'>) {
  const user = await requireAuth();
  const [updated] = await db
    .update(education)
    .set({
      institution: data.institution,
      degree: data.degree,
      duration: data.duration,
      skills: data.skills,
      projects: data.projects,
      verified: data.verified ?? false,
    })
    .where(and(eq(education.id, id), eq(education.userId, user.id)))
    .returning();

  if (!updated) {
    throw new Error('Education entry not found.');
  }

  revalidatePath('/app/i/profile');
  return updated;
}

export async function deleteEducation(id: string) {
  const user = await requireAuth();
  await db.delete(education).where(and(eq(education.id, id), eq(education.userId, user.id)));
  revalidatePath('/app/i/profile');
}

export async function createVolunteering(data: Omit<VolunteeringType, 'id'>) {
  const user = await requireAuth();
  const [inserted] = await db
    .insert(volunteering)
    .values({
      userId: user.id,
      title: data.title,
      orgDescription: data.orgDescription,
      duration: data.duration,
      cause: data.cause,
      impact: data.impact,
      skillsDeployed: data.skillsDeployed,
      personalWhy: data.personalWhy,
      verified: data.verified ?? false,
    })
    .returning();

  revalidatePath('/app/i/profile');
  return inserted;
}

export async function updateVolunteering(id: string, data: Omit<VolunteeringType, 'id'>) {
  const user = await requireAuth();
  const [updated] = await db
    .update(volunteering)
    .set({
      title: data.title,
      orgDescription: data.orgDescription,
      duration: data.duration,
      cause: data.cause,
      impact: data.impact,
      skillsDeployed: data.skillsDeployed,
      personalWhy: data.personalWhy,
      verified: data.verified ?? false,
    })
    .where(and(eq(volunteering.id, id), eq(volunteering.userId, user.id)))
    .returning();

  if (!updated) {
    throw new Error('Volunteering entry not found.');
  }

  revalidatePath('/app/i/profile');
  return updated;
}

export async function deleteVolunteering(id: string) {
  const user = await requireAuth();
  await db
    .delete(volunteering)
    .where(and(eq(volunteering.id, id), eq(volunteering.userId, user.id)));
  revalidatePath('/app/i/profile');
}

/**
 * Toggle redact mode for privacy
 * When enabled, sensitive profile information is hidden from viewers
 */
export async function toggleRedactMode(enabled: boolean) {
  const user = await requireAuth();

  await db
    .update(individualProfiles)
    .set({ redactMode: enabled })
    .where(eq(individualProfiles.userId, user.id));

  // Emit analytics event
  const { emitEvent } = await import('@/lib/analytics/events');
  await emitEvent({
    eventType: 'privacy_settings_updated',
    userId: user.id,
    properties: {
      redactMode: enabled,
      action: enabled ? 'enabled' : 'disabled',
    },
  });

  revalidatePath('/app/i/profile');
}
