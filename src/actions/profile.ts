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
} from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import type {
  ProfileData,
  BasicInfo,
  Value,
  Skill,
  ImpactStory,
  Experience,
  Education as EducationType,
  Volunteering as VolunteeringType,
} from '@/types/profile';

/**
 * Fetch the authenticated user's profile and related records.
 */
export async function getProfileData(): Promise<ProfileData> {
  const user = await requireAuth();

  const [profileRow] = await db
    .select()
    .from(individualProfiles)
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  if (!profileRow) {
    await db.insert(individualProfiles).values({
      userId: user.id,
      skills: [],
      causes: [],
      values: [],
    });
  }

  const [profile] = await db
    .select()
    .from(individualProfiles)
    .where(eq(individualProfiles.userId, user.id))
    .limit(1);

  const [profileBasics] = await db
    .select({
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  const [impactRows, experienceRows, educationRows, volunteeringRows] = await Promise.all([
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
  ]);

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
    values: (profile?.values as Value[]) ?? [],
    causes: profile?.causes ?? [],
    skills: (profile?.skills ?? []).map((skill) =>
      typeof skill === 'string' ? { id: skill, name: skill, verified: false } : skill
    ),
    impactStories: impactRows,
    experiences: experienceRows,
    education: educationRows,
    volunteering: volunteeringRows,
  };
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

export async function updateMission(mission: string | null) {
  const user = await requireAuth();
  await db
    .update(individualProfiles)
    .set({ mission })
    .where(eq(individualProfiles.userId, user.id));
  revalidatePath('/app/i/profile');
}

export async function replaceValues(values: Value[]) {
  const user = await requireAuth();
  await db.update(individualProfiles).set({ values }).where(eq(individualProfiles.userId, user.id));
  revalidatePath('/app/i/profile');
}

export async function replaceCauses(causes: string[]) {
  const user = await requireAuth();
  await db.update(individualProfiles).set({ causes }).where(eq(individualProfiles.userId, user.id));
  revalidatePath('/app/i/profile');
}

export async function replaceSkills(skills: Skill[]) {
  const user = await requireAuth();
  await db
    .update(individualProfiles)
    .set({ skills: skills.map((skill) => skill.name) })
    .where(eq(individualProfiles.userId, user.id));
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
