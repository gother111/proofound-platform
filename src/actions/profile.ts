'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

import { db } from '@/db';
import {
  profiles,
  individualProfiles,
  impactStories,
  experiences,
  education,
  volunteering,
  skills as skillsTable,
  skillsTaxonomy,
  skillProofs,
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { emitProfileActivated } from '@/lib/analytics/events';
import { triggerProfileActivationSurvey } from '@/lib/surveys/sus-triggers';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import { MATCHABILITY_STRONG_SKILLS_WITH_RECENCY } from '@/lib/matching/thresholds';
import type {
  ProfileData,
  BasicInfo,
  Value,
  Skill,
  ImpactStory,
  Experience,
  Education as EducationType,
  Volunteering as VolunteeringType,
  FieldVisibility,
} from '@/types/profile';

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
  visibility: PurposeVisibility | undefined,
  defaultVisibility: PurposeVisibility
) {
  const user = await requireAuth();

  const current = await db
    .select({
      value: purposeTextColumnMap[field],
      fieldVisibility: individualProfiles.fieldVisibility,
    })
    .from(individualProfiles)
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  const oldValue = (current[0]?.value as string | null | undefined) || null;
  const currentFieldVisibility = (current[0]?.fieldVisibility as FieldVisibility) || {};

  const { logPurposeEdit } = await import('@/lib/audit/purpose-log');
  await logPurposeEdit(user.id, field, oldValue, value || '');

  const updateData: Record<string, unknown> = { [field]: value };
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
      wordCount: value?.split(/\s+/).length || 0,
      hasValue: !!value,
      visibility: visibility || currentFieldVisibility[field] || defaultVisibility,
    },
  });

  await checkAndEmitProfileActivation(user.id);

  revalidatePath('/app/i/profile');
}

async function replacePurposeListField(field: PurposeListField, values: Value[] | string[]) {
  const user = await requireAuth();

  await db
    .update(individualProfiles)
    .set({ [field]: values } as Record<string, unknown>)
    .where(eq(individualProfiles.userId, user.id));

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
            learning: experiences.learning,
            growth: experiences.growth,
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

    // Transform L4 skills to profile format
    // Check for proofs to determine verified status
    let proofCounts: Record<string, number> = {};
    try {
      const proofs = await db
        .select({ skillId: skillProofs.skillId })
        .from(skillProofs)
        .where(eq(skillProofs.profileId, user.id));
      proofs.forEach((p) => {
        proofCounts[p.skillId] = (proofCounts[p.skillId] || 0) + 1;
      });
    } catch {
      // Continue without proof counts
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
      values: (profile?.values as Value[]) ?? [],
      causes: profile?.causes ?? [],
      skills: mappedSkills, // Now fetched from L4 skills table
      impactStories: impactRows,
      experiences: experienceRows,
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
      values: [],
      causes: [],
      skills: [],
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
  visibility?: 'public' | 'network' | 'private'
) {
  await updatePurposeTextField('mission', mission, visibility, 'public');
}

export async function updateVision(
  vision: string | null,
  visibility?: 'public' | 'network' | 'private'
) {
  await updatePurposeTextField('vision', vision, visibility, 'network');
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

export async function createImpactStory(data: Omit<ImpactStory, 'id'>) {
  const user = await requireAuth();
  const [inserted] = await db
    .insert(impactStories)
    .values({
      userId: user.id,
      title: data.title,
      orgDescription: data.orgDescription,
      impact: data.impact,
      businessValue: data.businessValue,
      outcomes: data.outcomes,
      timeline: data.timeline,
      verified: data.verified ?? false,
    })
    .returning();

  revalidatePath('/app/i/profile');
  return inserted;
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
  const [inserted] = await db
    .insert(experiences)
    .values({
      userId: user.id,
      title: data.title,
      orgDescription: data.orgDescription,
      duration: data.duration,
      learning: data.learning,
      growth: data.growth,
      verified: data.verified ?? false,
    })
    .returning();

  revalidatePath('/app/i/profile');
  return inserted;
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
