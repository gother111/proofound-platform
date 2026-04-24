'use server';

import { revalidatePath } from 'next/cache';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { headers } from 'next/headers';
import { eq, and, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import {
  profiles,
  individualProfiles,
  matchingProfiles,
  impactStories,
  experiences,
  education,
  volunteering,
  skills as skillsTable,
  skillsTaxonomy,
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { triggerProfileActivationSurvey } from '@/lib/surveys/sus-triggers';
import { sendEmail } from '@/lib/email/sender';
import { resolveCanonicalSiteUrl } from '@/lib/env';
import { buildExperienceTimeline } from '@/lib/profile/experience-timeline';
import { resolveIndustryFromInputs } from '@/lib/industry/options';
import {
  EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS,
  EXPERIENCE_ORGANIZATION_TYPE_OPTIONS,
  EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS,
} from '@/lib/profile/experience-options';
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
import { listCanonicalSkillProofSummariesForOwner } from '@/lib/proofs/canonical-pack';
import {
  createCanonicalImpactVerificationRequest,
  findExistingCanonicalImpactVerificationRequest,
  listCanonicalImpactVerificationRequestsForOwner,
  mapCanonicalImpactVerificationRequestRecord,
  updateCanonicalImpactVerificationRequest,
} from '@/lib/verification/canonical-impact-requests';
import {
  VERIFICATION_INTEGRITY_REASONS,
  assessVerificationRequestIntegrity,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';
import { getClaimTemplateLabel } from '@/lib/verification/scoped-contract';
import { syncReadinessMilestones } from '@/lib/readiness/analytics';
import type {
  ProfileData,
  BasicInfo,
  GuidedSetupState,
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
  ExperienceMeasuredOutcome,
  ExperienceProjectEntry,
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

async function checkAndEmitProfileActivation(userId: string): Promise<void> {
  try {
    await syncReadinessMilestones(userId, { source: 'profile_updated' });
    await triggerProfileActivationSurvey(userId);
  } catch (error) {
    console.error('Profile activation check failed:', error);
    // Don't throw - activation tracking shouldn't break profile updates
  }
}

function toJsonbArrayLiteral(value: unknown[]): ReturnType<typeof sql.raw> {
  const json = JSON.stringify(value);
  const escapedJson = json.replace(/'/g, "''");
  return sql.raw(`'${escapedJson}'::jsonb`);
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
  await revalidatePublicPortfolioByProfileId(user.id);
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
  await revalidatePublicPortfolioByProfileId(user.id);
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
          handle: profiles.handle,
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
    let matchingProfileRow: Pick<
      GuidedSetupState,
      'timezone' | 'desiredRoles' | 'workMode' | 'engagementType'
    > | null = null;

    try {
      [impactRows, experienceRows, educationRows, volunteeringRows, skillRows, matchingProfileRow] =
        await Promise.all([
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
              organizationName: experiences.organizationName,
              organizationType: experiences.organizationType,
              organizationIndustry: experiences.organizationIndustry,
              organizationIndustryKey: experiences.organizationIndustryKey,
              organizationIndustryLabel: experiences.organizationIndustryLabel,
              organizationIndustryLegacyText: experiences.organizationIndustryLegacyText,
              organizationEmployeeAmount: experiences.organizationEmployeeAmount,
              orgDescription: experiences.orgDescription,
              duration: experiences.duration,
              startDate: experiences.startDate,
              endDate: experiences.endDate,
              outcomes: experiences.outcomes,
              projects: experiences.projects,
              measuredOutcomes: experiences.measuredOutcomes,
              projectEntries: experiences.projectEntries,
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
          ((
            db as {
              query?: { matchingProfiles?: { findFirst?: (args: unknown) => Promise<any> } };
            }
          ).query?.matchingProfiles?.findFirst?.({
            where: eq(matchingProfiles.profileId, user.id),
            columns: {
              timezone: true,
              desiredRoles: true,
              workMode: true,
              engagementType: true,
            },
          }) ?? Promise.resolve(null)) as Promise<any>,
        ]);
    } catch (error) {
      console.error('Failed to fetch profile related data:', error);
      // Continue with empty arrays
    }

    try {
      impactVerificationRows = (await listCanonicalImpactVerificationRequestsForOwner(user.id)).map(
        (row) => {
          const record = mapCanonicalImpactVerificationRequestRecord(row);
          return {
            impactStoryId: record.impact_story_id,
            status: record.status,
            verifierEmail: record.verifier_email,
            createdAt: record.created_at,
            emailSentAt: record.email_sent ? record.created_at : null,
            emailError: record.email_error,
          };
        }
      );

      impactVerificationRows.sort((a, b) => {
        const left = toIsoStringOrNull(a?.createdAt) || '';
        const right = toIsoStringOrNull(b?.createdAt) || '';
        return right.localeCompare(left);
      });
    } catch (error) {
      const verificationMarkers = ['verification_records', 'created_at'];
      if (!isSchemaDriftError(error, verificationMarkers)) {
        console.error('Failed to fetch impact verification summaries:', error);
      }
      impactVerificationRows = [];
    }

    // Transform L4 skills to profile format
    // Check for proofs to determine verified status
    let trustedSkillIds = new Set<string>();
    let proofArtifactCount = 0;
    let acceptedVerificationCount = 0;
    try {
      const skillProofSummaries = await listCanonicalSkillProofSummariesForOwner(user.id);
      proofArtifactCount = skillProofSummaries.reduce(
        (sum, summary) => sum + summary.proofCount,
        0
      );
      acceptedVerificationCount = skillProofSummaries.reduce(
        (sum, summary) => sum + summary.verificationCount,
        0
      );
      trustedSkillIds = new Set(
        skillProofSummaries
          .filter((summary) => summary.hasTrustedSignal)
          .map((summary) => summary.skillId)
      );
    } catch {
      // Continue without proof counts
    }

    const mappedSkills: Skill[] = skillRows.map((row: any) => {
      const nameI18n = row.nameI18n as Record<string, string> | null;
      const skillName = nameI18n?.en || row.skillId || 'Unknown Skill';
      return {
        id: row.id,
        name: skillName,
        verified: trustedSkillIds.has(row.id),
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
        organizationName:
          typeof row.organizationName === 'string' && row.organizationName.trim().length > 0
            ? row.organizationName.trim()
            : null,
        organizationType:
          typeof row.organizationType === 'string' &&
          Object.prototype.hasOwnProperty.call(
            EXPERIENCE_ORGANIZATION_TYPE_LABELS,
            row.organizationType
          )
            ? row.organizationType
            : null,
        organizationIndustry:
          typeof (row.organizationIndustryLabel || row.organizationIndustry) === 'string' &&
          (row.organizationIndustryLabel || row.organizationIndustry).trim().length > 0
            ? (row.organizationIndustryLabel || row.organizationIndustry).trim()
            : null,
        organizationIndustryKey:
          typeof row.organizationIndustryKey === 'string' &&
          row.organizationIndustryKey.trim().length > 0
            ? row.organizationIndustryKey.trim()
            : null,
        organizationIndustryLabel:
          typeof row.organizationIndustryLabel === 'string' &&
          row.organizationIndustryLabel.trim().length > 0
            ? row.organizationIndustryLabel.trim()
            : null,
        organizationIndustryLegacyText:
          typeof row.organizationIndustryLegacyText === 'string' &&
          row.organizationIndustryLegacyText.trim().length > 0
            ? row.organizationIndustryLegacyText.trim()
            : null,
        organizationEmployeeAmount:
          typeof row.organizationEmployeeAmount === 'string' &&
          row.organizationEmployeeAmount.trim().length > 0
            ? row.organizationEmployeeAmount.trim()
            : null,
        orgDescription: row.orgDescription,
        duration: timeline.duration,
        startDate: timeline.startDate,
        endDate: timeline.endDate,
        outcomes: row.outcomes,
        projects: row.projects,
        measuredOutcomes: normalizeExperienceMeasuredOutcomes(row.measuredOutcomes),
        projectEntries: normalizeExperienceProjectEntries(row.projectEntries),
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
        status: toLegacyImpactVerificationRequestStatus(verificationRow.status),
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
          ? ({
              experiences: 'private',
              education: 'private',
              volunteering: 'private',
              ...(profile.fieldVisibility as FieldVisibility),
            } as FieldVisibility)
          : {
              experiences: 'private',
              education: 'private',
              volunteering: 'private',
            },
      redactMode: profile?.redactMode ?? false,
      guidedSetup: {
        handle: profileBasics?.handle ?? null,
        headline: profile?.headline ?? null,
        timezone: matchingProfileRow?.timezone ?? null,
        desiredRoles: Array.isArray(matchingProfileRow?.desiredRoles)
          ? matchingProfileRow.desiredRoles
          : [],
        workMode: matchingProfileRow?.workMode ?? null,
        engagementType: matchingProfileRow?.engagementType ?? null,
      },
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
      fieldVisibility: {
        experiences: 'private',
        education: 'private',
        volunteering: 'private',
      },
      redactMode: false,
      guidedSetup: {
        handle: null,
        headline: null,
        timezone: null,
        desiredRoles: [],
        workMode: null,
        engagementType: null,
      },
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
  await revalidatePublicPortfolioByProfileId(user.id);
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
  await revalidatePublicPortfolioByProfileId(user.id);
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
  requesterDisplayName?: string | null;
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

const ACTIVE_IMPACT_VERIFICATION_STATUSES = ['pending', 'accepted'] as const;
const DUPLICATE_IMPACT_VERIFICATION_WARNING =
  'An active verification request already exists for this verifier.';

const EXPERIENCE_PARTICIPATION_LABELS: Record<string, string> =
  EXPERIENCE_PARTICIPATION_CAPACITY_OPTIONS.reduce(
    (acc, option) => ({ ...acc, [option.value]: option.label }),
    {} as Record<string, string>
  );

const EXPERIENCE_ORGANIZATION_TYPE_LABELS: Record<string, string> =
  EXPERIENCE_ORGANIZATION_TYPE_OPTIONS.reduce(
    (acc, option) => ({ ...acc, [option.value]: option.label }),
    {} as Record<string, string>
  );

const EXPERIENCE_EMPLOYEE_AMOUNT_SET = new Set(
  EXPERIENCE_EMPLOYEE_AMOUNT_OPTIONS.map((option) => option.value)
);

function normalizeExperienceMeasuredOutcomes(value: unknown): ExperienceMeasuredOutcome[] {
  if (!Array.isArray(value)) {
    return [];
  }

  type NormalizedOutcomeRow = {
    id: string;
    name: string;
    value: number | null;
    unit: string | null;
  };

  const normalized: NormalizedOutcomeRow[] = value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const row = entry as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (!name) {
        return null;
      }

      const rawValue = row.value;
      const parsedValue =
        rawValue === null || rawValue === undefined || String(rawValue).trim().length === 0
          ? null
          : Number(rawValue);

      return {
        id:
          typeof row.id === 'string' && row.id.trim().length > 0
            ? row.id.trim()
            : `outcome-${index + 1}`,
        name,
        value: parsedValue !== null && Number.isFinite(parsedValue) ? parsedValue : null,
        unit: typeof row.unit === 'string' && row.unit.trim().length > 0 ? row.unit.trim() : null,
      };
    })
    .filter((entry): entry is NormalizedOutcomeRow => entry !== null);

  return normalized;
}

function normalizeExperienceProjectEntries(value: unknown): ExperienceProjectEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const row = entry as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      const duration = typeof row.duration === 'string' ? row.duration.trim() : '';
      const participationCapacity =
        typeof row.participationCapacity === 'string' &&
        Object.prototype.hasOwnProperty.call(
          EXPERIENCE_PARTICIPATION_LABELS,
          row.participationCapacity
        )
          ? row.participationCapacity
          : 'contributed';

      if (!name || !duration) {
        return null;
      }

      return {
        id:
          typeof row.id === 'string' && row.id.trim().length > 0
            ? row.id.trim()
            : `project-${index + 1}`,
        name,
        participationCapacity:
          participationCapacity as ExperienceProjectEntry['participationCapacity'],
        duration,
      };
    })
    .filter((entry): entry is ExperienceProjectEntry => entry !== null);
}

function summarizeExperienceOutcomes(
  measuredOutcomes: ExperienceMeasuredOutcome[] | null | undefined,
  fallback: string
) {
  if (!Array.isArray(measuredOutcomes) || measuredOutcomes.length === 0) {
    return fallback;
  }

  const summary = measuredOutcomes
    .map((outcome) => {
      const name = outcome.name?.trim();
      if (!name) return null;

      const hasValue =
        outcome.value !== null &&
        outcome.value !== undefined &&
        String(outcome.value).trim().length > 0;

      if (!hasValue) {
        return name;
      }

      const value = String(outcome.value).trim();
      const unitSuffix = outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : '';
      return `${name}: ${value}${unitSuffix}`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('; ');

  return summary || fallback;
}

function summarizeExperienceProjects(
  projectEntries: ExperienceProjectEntry[] | null | undefined,
  fallback: string
) {
  if (!Array.isArray(projectEntries) || projectEntries.length === 0) {
    return fallback;
  }

  const summary = projectEntries
    .map((project) => {
      const name = project.name?.trim();
      const duration = project.duration?.trim();
      if (!name || !duration) {
        return null;
      }

      const participationLabel =
        EXPERIENCE_PARTICIPATION_LABELS[project.participationCapacity] || 'Contributed';
      return `${name} (${participationLabel}, ${duration})`;
    })
    .filter((entry): entry is string => Boolean(entry))
    .join('; ');

  return summary || fallback;
}

function buildPublicExperienceOrgDescription(data: {
  organizationType?: string | null;
  organizationIndustryKey?: string | null;
  organizationIndustryLabel?: string | null;
  organizationIndustry?: string | null;
  organizationEmployeeAmount?: string | null;
  orgDescription?: string | null;
}) {
  const orgType =
    typeof data.organizationType === 'string'
      ? EXPERIENCE_ORGANIZATION_TYPE_LABELS[data.organizationType] || null
      : null;
  const hasIndustryInput = Boolean(
    (typeof data.organizationIndustryKey === 'string' && data.organizationIndustryKey.trim()) ||
      (typeof data.organizationIndustryLabel === 'string' &&
        data.organizationIndustryLabel.trim()) ||
      (typeof data.organizationIndustry === 'string' && data.organizationIndustry.trim())
  );
  const organizationIndustry = hasIndustryInput
    ? resolveIndustryFromInputs({
        industryKey: data.organizationIndustryKey,
        industryLabel: data.organizationIndustryLabel,
        legacyIndustry: data.organizationIndustry,
      }).industryLabel
    : '';
  const employeeAmount =
    typeof data.organizationEmployeeAmount === 'string'
      ? data.organizationEmployeeAmount.trim()
      : '';

  const parts = [
    orgType,
    organizationIndustry || null,
    employeeAmount ? `${employeeAmount} employees` : null,
  ]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .map((part) => part.trim());

  if (parts.length > 0) {
    return parts.join(', ');
  }

  if (data.orgDescription?.trim()) {
    return data.orgDescription.trim();
  }

  return 'Organization details not specified';
}

type ExistingImpactVerificationRow = {
  id: string;
  status: ImpactStoryVerificationRequestStatus;
  verifierEmail: string | null;
  createdAt: Date | string | null;
  emailSentAt: Date | string | null;
  emailError: string | null;
};

function toLegacyImpactVerificationRequestStatus(
  status: string | null | undefined
): ImpactStoryVerificationRequestStatus {
  if (status === 'accepted' || status === 'expired' || status === 'failed') {
    return status;
  }

  if (status === 'declined' || status === 'cancelled' || status === 'revoked') {
    return 'declined';
  }

  return 'pending';
}

function toCanonicalImpactIntegrityStatus(status: 'clear' | 'flagged') {
  return status === 'flagged' ? 'warning' : 'clear';
}

function impactVerificationStatusPriority(status: ImpactStoryVerificationRequestStatus): number {
  return status === 'accepted' ? 0 : 1;
}

function mapExistingImpactVerificationToRecord(
  row: ExistingImpactVerificationRow,
  verifierEmail: string
): ImpactStoryVerificationRecord {
  return {
    requestId: row.id,
    status: row.status,
    emailSent: Boolean(row.emailSentAt),
    emailError: row.emailError || null,
    warning: DUPLICATE_IMPACT_VERIFICATION_WARNING,
    verifierEmail,
    createdAt: toIsoStringOrNull(row.createdAt) || new Date().toISOString(),
    emailSentAt: toIsoStringOrNull(row.emailSentAt),
  };
}

function extractDatabaseErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const err = error as { code?: unknown; cause?: unknown };
  if (typeof err.code === 'string' && err.code.trim().length > 0) {
    return err.code;
  }

  if (err.cause) {
    return extractDatabaseErrorCode(err.cause);
  }

  return null;
}

function isImpactDuplicateConstraintError(error: unknown): boolean {
  if (extractDatabaseErrorCode(error) !== '23505') {
    return false;
  }

  const errorText = collectSchemaErrorText(error).toLowerCase();
  return errorText.includes('idx_impact_verification_active_unique_verifier');
}

async function findExistingActiveImpactVerificationRequest(args: {
  userId: string;
  impactStoryId: string;
  verifierEmail: string;
}): Promise<ExistingImpactVerificationRow | null> {
  const existing = await findExistingCanonicalImpactVerificationRequest({
    ownerId: args.userId,
    impactStoryId: args.impactStoryId,
    verifierEmail: args.verifierEmail,
  }).catch(() => null);

  if (!existing) {
    return null;
  }

  const canonicalRecord = mapCanonicalImpactVerificationRequestRecord(existing);
  return {
    id: canonicalRecord.id,
    status: toLegacyImpactVerificationRequestStatus(canonicalRecord.status),
    verifierEmail: canonicalRecord.verifier_email,
    createdAt: canonicalRecord.created_at,
    emailSentAt: canonicalRecord.email_sent ? canonicalRecord.created_at : null,
    emailError: canonicalRecord.email_error,
  };
}

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

  const summary = measuredOutcomes
    .map((outcome, index) => {
      const changeText = (outcome.change || outcome.label || '').trim() || `Outcome ${index + 1}`;
      const hasValue =
        outcome.value !== null &&
        outcome.value !== undefined &&
        String(outcome.value).trim().length > 0;
      if (!hasValue) {
        return changeText;
      }

      const value = String(outcome.value).trim();
      const unitSuffix = outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : '';
      return `${changeText}: ${value}${unitSuffix}`;
    })
    .join('; ');

  return summary || fallback;
}

function normalizeMeasuredOutcomes(
  measuredOutcomes: ImpactStoryOutcome[] | null | undefined
): ImpactStoryOutcome[] {
  if (!Array.isArray(measuredOutcomes)) {
    return [];
  }

  return measuredOutcomes.map((outcome, index) => {
    const normalizedChange = (outcome.change || outcome.label || '').trim();
    const label = (outcome.label || normalizedChange || `Outcome ${index + 1}`).trim();
    const change = normalizedChange || label;

    const rawValue = outcome.value;
    const parsedValue =
      rawValue === null || rawValue === undefined || String(rawValue).trim().length === 0
        ? null
        : Number(rawValue);
    const value = parsedValue !== null && Number.isFinite(parsedValue) ? parsedValue : null;

    const baselineNumber =
      outcome.baseline === null ||
      outcome.baseline === undefined ||
      String(outcome.baseline).trim().length === 0
        ? null
        : Number(outcome.baseline);
    const baseline =
      baselineNumber !== null && Number.isFinite(baselineNumber) ? baselineNumber : null;

    const afterNumber =
      outcome.after === null ||
      outcome.after === undefined ||
      String(outcome.after).trim().length === 0
        ? null
        : Number(outcome.after);
    const after = afterNumber !== null && Number.isFinite(afterNumber) ? afterNumber : null;

    const valueMode =
      outcome.valueMode === 'delta' || outcome.valueMode === 'absolute' ? outcome.valueMode : null;
    const confidence =
      outcome.confidence === 'exact' ||
      outcome.confidence === 'estimated' ||
      outcome.confidence === 'directional'
        ? outcome.confidence
        : null;

    return {
      id: outcome.id || `outcome-${index + 1}`,
      change,
      label,
      value,
      unit: outcome.unit?.trim() || null,
      valueMode,
      timeframe: outcome.timeframe?.trim() || null,
      baseline,
      after,
      confidence,
    };
  });
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
    ? `Documented ${outcomeCount} impact change${outcomeCount > 1 ? 's' : ''}`
    : 'Structured impact story recorded';
}

function prepareImpactStoryPersistenceFields(data: Omit<ImpactStory, 'id'>) {
  const normalizedMeasuredOutcomes = normalizeMeasuredOutcomes(data.measuredOutcomes);
  const normalizedData = {
    ...data,
    measuredOutcomes: normalizedMeasuredOutcomes,
  };

  return {
    normalizedMeasuredOutcomes,
    timelineText: formatTimelineForLegacy(data.timelineStructured, data.timeline),
    outcomesText: formatOutcomesForLegacy(normalizedMeasuredOutcomes, data.outcomes),
    legacyOrgDescription: buildLegacyOrgDescription(normalizedData),
    legacyImpact: buildLegacyImpact(normalizedData),
    legacyBusinessValue: buildLegacyBusinessValue(normalizedData),
  };
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
    requesterName?: string | null;
  }
) {
  const roleClaimTemplate =
    data.roleScope === 'contributed' ? 'contributed_this_part' : 'did_this_work';
  const measuredOutcomeClaims = (data.measuredOutcomes || [])
    .map((outcome, index) => {
      const changeText = (outcome.change || outcome.label || '').trim() || `Outcome ${index + 1}`;
      const hasValue =
        outcome.value !== null &&
        outcome.value !== undefined &&
        String(outcome.value).trim().length > 0;
      const valueSuffix = hasValue
        ? `${String(outcome.value).trim()}${outcome.unit?.trim() ? ` ${outcome.unit.trim()}` : ''}`
        : null;
      const outcomeId = (outcome.id || '').trim() || `generated-${index + 1}`;
      return {
        id: `outcome:${outcomeId}`,
        outcomeId,
        template: 'outcome_happened' as const,
        label: getClaimTemplateLabel('outcome_happened'),
        detail: valueSuffix ? `${changeText} (${valueSuffix})` : changeText,
      };
    })
    .filter((claim) => claim.label.trim().length > 0);
  const legacyOutcomeClaimLabel =
    measuredOutcomeClaims.length > 0 ? null : buildLegacyOutcomeClaimLabel(data.outcomes);
  const outcomeClaims =
    measuredOutcomeClaims.length > 0
      ? measuredOutcomeClaims
      : legacyOutcomeClaimLabel
        ? [
            {
              id: 'outcome:legacy',
              template: 'outcome_happened' as const,
              label: getClaimTemplateLabel('outcome_happened'),
              detail: legacyOutcomeClaimLabel,
            },
          ]
        : [];

  return {
    verificationType: 'impact_story',
    claimTemplate: roleClaimTemplate,
    claimLabel: getClaimTemplateLabel(roleClaimTemplate),
    title: data.title,
    roleClaim: {
      id: 'role',
      template: roleClaimTemplate,
      label: getClaimTemplateLabel(roleClaimTemplate),
      detail: `${data.roleTitle || 'Contributor'}${data.roleScope ? `, ${data.roleScope}` : ''}`,
    },
    outcomeClaims,
    artifactsClaim: {
      id: 'artifacts',
      label: 'Supporting evidence only',
      enabled: (data.supportingArtifacts || []).length > 0,
    },
    roleScope: data.roleScope || null,
    context: {
      verifierRelationship: context?.verifierRelationship || null,
      requesterDomain: context?.requesterDomain || null,
      verifierDomain: context?.verifierDomain || null,
      requesterEmail: context?.requesterEmail || null,
      requesterName: context?.requesterName || null,
    },
  };
}

function normalizeBaseUrl(url?: string | null) {
  const base = (url || '').trim();
  if (!base) return '';
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

  const existingActiveRequest = await findExistingActiveImpactVerificationRequest({
    userId: input.userId,
    impactStoryId: input.impactStoryId,
    verifierEmail: normalizedVerifierEmail,
  });

  if (existingActiveRequest) {
    return {
      verification: mapExistingImpactVerificationToRecord(
        existingActiveRequest,
        normalizedVerifierEmail
      ),
      warning: DUPLICATE_IMPACT_VERIFICATION_WARNING,
      storageUnavailable: false,
    };
  }

  const claimSnapshot = buildClaimSnapshot(input.storyData, {
    verifierRelationship: input.verificationRequest.verifierRelationship || null,
    requesterDomain: integrityAssessment.requesterDomain,
    verifierDomain: integrityAssessment.verifierDomain,
    requesterEmail: integrityAssessment.normalizedRequesterEmail,
    requesterName: input.requesterDisplayName || null,
  });

  let verificationRequest: {
    id: string;
    integrityStatus?: string | null;
    createdAt?: Date | string | null;
    rawToken?: string;
  } | null = null;

  try {
    const createdVerificationRequest = await createCanonicalImpactVerificationRequest({
      ownerId: input.userId,
      impactStoryId: input.impactStoryId,
      storyTitle: input.storyData.title,
      requesterName: input.requesterDisplayName || 'Proofound member',
      requesterEmailSnapshot: integrityAssessment.normalizedRequesterEmail,
      verifierEmail: normalizedVerifierEmail,
      verifierName: input.verificationRequest.verifierName || null,
      verifierRelationship: input.verificationRequest.verifierRelationship || null,
      verifierProfileId: integrityAssessment.verifierProfileId,
      message: input.verificationRequest.message || null,
      claimSnapshot,
      integrityStatus: toCanonicalImpactIntegrityStatus(integrityAssessment.policy.integrityStatus),
      integrityReason: integrityAssessment.policy.integrityReason,
      riskSignals: integrityAssessment.riskSignals,
      requiresAuthenticatedVerifier: integrityAssessment.policy.requiresAuthenticatedVerifier,
    });

    verificationRequest = {
      id: createdVerificationRequest.record.id,
      integrityStatus: createdVerificationRequest.record.integrityStatus,
      createdAt: createdVerificationRequest.record.createdAt,
      rawToken: createdVerificationRequest.rawToken,
    };
  } catch (error) {
    const verificationMarkers = ['verification_records', 'claim_snapshot', 'metadata'];
    if (isSchemaDriftError(error, verificationMarkers)) {
      return {
        verification: null,
        warning: 'Verification storage is unavailable until the latest migrations are applied.',
        storageUnavailable: true,
      };
    }

    if (isImpactDuplicateConstraintError(error)) {
      const existingDuringRace = await findExistingActiveImpactVerificationRequest({
        userId: input.userId,
        impactStoryId: input.impactStoryId,
        verifierEmail: normalizedVerifierEmail,
      });

      if (existingDuringRace) {
        return {
          verification: mapExistingImpactVerificationToRecord(
            existingDuringRace,
            normalizedVerifierEmail
          ),
          warning: DUPLICATE_IMPACT_VERIFICATION_WARNING,
          storageUnavailable: false,
        };
      }
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

  const baseUrl = normalizeBaseUrl(resolveCanonicalSiteUrl());
  if (!baseUrl) {
    return {
      verification: null,
      warning: 'Verification email configuration is unavailable.',
      storageUnavailable: false,
    };
  }
  const verifyUrl = `${baseUrl}/verify/${verificationRequest.rawToken}`;

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
          <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">This link expires in 14 days.</p>
        </div>
      `,
    text: `You have been asked to verify claims for "${input.storyData.title}". Open: ${verifyUrl}`,
  });

  const createdAtIso = toIsoStringOrNull(verificationRequest.createdAt) || new Date().toISOString();

  if (!emailResult.success) {
    const warning = emailResult.error || 'Failed to send verification request email.';
    await updateCanonicalImpactVerificationRequest({
      requestId: verificationRequest.id,
      status: 'failed',
      emailSent: false,
      emailError: warning,
    });

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
  await updateCanonicalImpactVerificationRequest({
    requestId: verificationRequest.id,
    status: 'pending',
    emailSent: true,
    emailError: null,
  });

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
  const {
    normalizedMeasuredOutcomes,
    timelineText,
    outcomesText,
    legacyOrgDescription,
    legacyImpact,
    legacyBusinessValue,
  } = prepareImpactStoryPersistenceFields(data);
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
    measuredOutcomes: normalizedMeasuredOutcomes,
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
      requesterDisplayName: user.displayName || null,
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
          'Saved in compatibility mode because canonical verification storage is unavailable in the active schema.';
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
    requesterDisplayName: user.displayName || null,
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
  const {
    normalizedMeasuredOutcomes,
    timelineText,
    outcomesText,
    legacyOrgDescription,
    legacyImpact,
    legacyBusinessValue,
  } = prepareImpactStoryPersistenceFields(data);
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
    measuredOutcomes: normalizedMeasuredOutcomes,
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
  const normalizedMeasuredOutcomes = normalizeExperienceMeasuredOutcomes(data.measuredOutcomes);
  const normalizedProjectEntries = normalizeExperienceProjectEntries(data.projectEntries);
  const measuredOutcomesJsonb = toJsonbArrayLiteral(normalizedMeasuredOutcomes);
  const projectEntriesJsonb = toJsonbArrayLiteral(normalizedProjectEntries);
  const organizationType =
    typeof data.organizationType === 'string' &&
    Object.prototype.hasOwnProperty.call(EXPERIENCE_ORGANIZATION_TYPE_LABELS, data.organizationType)
      ? data.organizationType
      : null;
  const organizationEmployeeAmount =
    typeof data.organizationEmployeeAmount === 'string' &&
    EXPERIENCE_EMPLOYEE_AMOUNT_SET.has(data.organizationEmployeeAmount as any)
      ? data.organizationEmployeeAmount
      : null;
  const resolvedIndustry = resolveIndustryFromInputs({
    industryKey: data.organizationIndustryKey,
    industryLabel: data.organizationIndustryLabel,
    legacyIndustry: data.organizationIndustry,
  });
  const organizationIndustry = resolvedIndustry.industryLabel;
  const organizationName =
    typeof data.organizationName === 'string' && data.organizationName.trim().length > 0
      ? data.organizationName.trim()
      : null;
  const outcomesText = summarizeExperienceOutcomes(
    normalizedMeasuredOutcomes,
    (data.outcomes || '').trim() || 'Not specified'
  );
  const projectsText = summarizeExperienceProjects(
    normalizedProjectEntries,
    (data.projects || '').trim() || 'Not specified'
  );
  const publicOrgDescription = buildPublicExperienceOrgDescription({
    organizationType,
    organizationIndustryKey: resolvedIndustry.industryKey,
    organizationIndustryLabel: resolvedIndustry.industryLabel,
    organizationIndustry,
    organizationEmployeeAmount,
    orgDescription: data.orgDescription,
  });

  const [inserted] = await db
    .insert(experiences)
    .values({
      userId: user.id,
      title: data.title,
      organizationName,
      organizationType,
      organizationIndustry,
      organizationIndustryKey: resolvedIndustry.industryKey,
      organizationIndustryLabel: resolvedIndustry.industryLabel,
      organizationIndustryLegacyText: resolvedIndustry.legacyText,
      organizationEmployeeAmount,
      orgDescription: publicOrgDescription,
      duration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      outcomes: outcomesText,
      projects: projectsText,
      measuredOutcomes: measuredOutcomesJsonb,
      projectEntries: projectEntriesJsonb,
      colleagues: data.colleagues || 'Not specified',
      achievements: data.achievements || 'Not specified',
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
    measuredOutcomes: normalizeExperienceMeasuredOutcomes((inserted as any).measuredOutcomes),
    projectEntries: normalizeExperienceProjectEntries((inserted as any).projectEntries),
  };
}

export async function updateExperience(id: string, data: Omit<Experience, 'id'>) {
  const user = await requireAuth();
  const timeline = buildExperienceTimeline({
    startDate: data.startDate,
    endDate: data.endDate,
    duration: data.duration,
  });
  const normalizedMeasuredOutcomes = normalizeExperienceMeasuredOutcomes(data.measuredOutcomes);
  const normalizedProjectEntries = normalizeExperienceProjectEntries(data.projectEntries);
  const measuredOutcomesJsonb =
    data.measuredOutcomes !== undefined
      ? toJsonbArrayLiteral(normalizedMeasuredOutcomes)
      : undefined;
  const projectEntriesJsonb =
    data.projectEntries !== undefined ? toJsonbArrayLiteral(normalizedProjectEntries) : undefined;
  const hasOutcomeInput =
    normalizedMeasuredOutcomes.length > 0 ||
    (typeof data.outcomes === 'string' && data.outcomes.trim().length > 0);
  const hasProjectInput =
    normalizedProjectEntries.length > 0 ||
    (typeof data.projects === 'string' && data.projects.trim().length > 0);

  const organizationType =
    typeof data.organizationType === 'string' &&
    Object.prototype.hasOwnProperty.call(EXPERIENCE_ORGANIZATION_TYPE_LABELS, data.organizationType)
      ? data.organizationType
      : data.organizationType === null
        ? null
        : undefined;
  const organizationEmployeeAmount =
    typeof data.organizationEmployeeAmount === 'string' &&
    EXPERIENCE_EMPLOYEE_AMOUNT_SET.has(data.organizationEmployeeAmount as any)
      ? data.organizationEmployeeAmount
      : data.organizationEmployeeAmount === null
        ? null
        : undefined;
  const resolvedIndustry =
    data.organizationIndustry !== undefined ||
    data.organizationIndustryKey !== undefined ||
    data.organizationIndustryLabel !== undefined
      ? resolveIndustryFromInputs({
          industryKey: data.organizationIndustryKey,
          industryLabel: data.organizationIndustryLabel,
          legacyIndustry: data.organizationIndustry,
        })
      : null;
  const organizationIndustry = resolvedIndustry ? resolvedIndustry.industryLabel : undefined;
  const organizationName =
    typeof data.organizationName === 'string'
      ? data.organizationName.trim() || null
      : data.organizationName === null
        ? null
        : undefined;
  const shouldUpdateOrgDescription =
    data.orgDescription !== undefined ||
    data.organizationType !== undefined ||
    data.organizationIndustry !== undefined ||
    data.organizationIndustryKey !== undefined ||
    data.organizationIndustryLabel !== undefined ||
    data.organizationEmployeeAmount !== undefined;
  const publicOrgDescription = shouldUpdateOrgDescription
    ? buildPublicExperienceOrgDescription({
        organizationType: organizationType === undefined ? null : organizationType,
        organizationIndustryKey: resolvedIndustry ? resolvedIndustry.industryKey : null,
        organizationIndustryLabel: resolvedIndustry ? resolvedIndustry.industryLabel : null,
        organizationIndustry: organizationIndustry === undefined ? null : organizationIndustry,
        organizationEmployeeAmount:
          organizationEmployeeAmount === undefined ? null : organizationEmployeeAmount,
        orgDescription: data.orgDescription,
      })
    : undefined;

  const [updated] = await db
    .update(experiences)
    .set({
      title: data.title,
      organizationName,
      organizationType,
      organizationIndustry,
      organizationIndustryKey: resolvedIndustry ? resolvedIndustry.industryKey : undefined,
      organizationIndustryLabel: resolvedIndustry ? resolvedIndustry.industryLabel : undefined,
      organizationIndustryLegacyText: resolvedIndustry ? resolvedIndustry.legacyText : undefined,
      organizationEmployeeAmount,
      orgDescription: publicOrgDescription,
      duration: timeline.duration,
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      outcomes: hasOutcomeInput
        ? summarizeExperienceOutcomes(
            normalizedMeasuredOutcomes,
            (data.outcomes || '').trim() || 'Not specified'
          )
        : undefined,
      projects: hasProjectInput
        ? summarizeExperienceProjects(
            normalizedProjectEntries,
            (data.projects || '').trim() || 'Not specified'
          )
        : undefined,
      measuredOutcomes: data.measuredOutcomes !== undefined ? measuredOutcomesJsonb : undefined,
      projectEntries: data.projectEntries !== undefined ? projectEntriesJsonb : undefined,
      colleagues: data.colleagues ?? undefined,
      achievements: data.achievements ?? undefined,
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
    measuredOutcomes: normalizeExperienceMeasuredOutcomes((updated as any).measuredOutcomes),
    projectEntries: normalizeExperienceProjectEntries((updated as any).projectEntries),
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
