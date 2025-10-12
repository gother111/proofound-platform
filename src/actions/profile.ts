'use server';

import { db } from '@/db';
import { profiles, individualProfiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/)
    .optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

const updateIndividualProfileSchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  skills: z.array(z.string()).optional(),
  location: z.string().max(100).optional().nullable(),
  visibility: z.enum(['public', 'network', 'private']).optional(),
});

export async function updateProfile(formData: FormData) {
  const user = await requireAuth();

  const data = {
    displayName: formData.get('displayName') as string | undefined,
    handle: formData.get('handle') as string | undefined,
    avatarUrl: formData.get('avatarUrl') as string | undefined | null,
  };

  const result = updateProfileSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid profile data' };
  }

  try {
    await db
      .update(profiles)
      .set({
        ...result.data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath('/app/i/profile');
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') {
      return { error: 'Handle already taken' };
    }
    return { error: 'Failed to update profile' };
  }
}

export async function updateIndividualProfile(formData: FormData) {
  const user = await requireAuth();

  const skillsRaw = formData.get('skills') as string;
  const skills = skillsRaw ? skillsRaw.split(',').map((s) => s.trim()) : [];

  const data = {
    headline: formData.get('headline') as string | undefined | null,
    bio: formData.get('bio') as string | undefined | null,
    skills,
    location: formData.get('location') as string | undefined | null,
    visibility: formData.get('visibility') as string | undefined,
  };

  const result = updateIndividualProfileSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid profile data' };
  }

  try {
    await db
      .update(individualProfiles)
      .set(result.data)
      .where(eq(individualProfiles.userId, user.id));

    revalidatePath('/app/i/profile');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update profile' };
  }
}
