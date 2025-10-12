'use server';

import { db } from '@/db';
import { profiles, individualProfiles, organizations, organizationMembers } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateSlug } from '@/lib/utils';
import { nanoid } from 'nanoid';

const choosePersonaSchema = z.object({
  persona: z.enum(['individual', 'org_member']),
});

const individualSetupSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/),
  displayName: z.string().min(1).max(100),
  locale: z.string().default('en'),
});

const orgSetupSchema = z.object({
  displayName: z.string().min(1).max(100),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  type: z.enum(['company', 'ngo', 'government', 'network', 'other']),
  mission: z.string().optional(),
});

export async function choosePersona(formData: FormData) {
  const user = await requireAuth();

  const data = {
    persona: formData.get('persona') as string,
  };

  const result = choosePersonaSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid persona choice' };
  }

  await db.update(profiles).set({ persona: result.data.persona }).where(eq(profiles.id, user.id));

  revalidatePath('/onboarding');
  return { success: true, persona: result.data.persona };
}

export async function completeIndividualOnboarding(formData: FormData) {
  const user = await requireAuth();

  const displayName = formData.get('displayName') as string;
  const handle = formData.get('handle') as string;
  const headline = formData.get('headline') as string;
  const bio = formData.get('bio') as string;
  const location = formData.get('location') as string;

  if (!displayName || !handle) {
    return { error: 'Display name and handle are required' };
  }

  // Validate handle format
  if (!/^[a-zA-Z0-9_-]+$/.test(handle)) {
    return { error: 'Handle can only contain letters, numbers, hyphens, and underscores' };
  }

  try {
    // Update profile
    await db
      .update(profiles)
      .set({
        handle: handle.toLowerCase(),
        displayName,
        persona: 'individual',
      })
      .where(eq(profiles.id, user.id));

    // Create individual profile
    await db.insert(individualProfiles).values({
      userId: user.id,
      headline: headline || null,
      bio: bio || null,
      location: location || null,
      visibility: 'network',
    });

    revalidatePath('/app/i');
    return { success: true };
  } catch (error: any) {
    if (error.code === '23505') {
      return { error: 'Handle already taken. Please choose another.' };
    }
    console.error('Individual onboarding error:', error);
    return { error: 'Failed to complete setup. Please try again.' };
  }
}

export async function completeOrganizationOnboarding(formData: FormData) {
  const user = await requireAuth();

  const displayName = formData.get('displayName') as string;
  const slug = formData.get('slug') as string;
  const type = formData.get('type') as string;
  const legalName = formData.get('legalName') as string;
  const mission = formData.get('mission') as string;
  const website = formData.get('website') as string;

  if (!displayName || !slug || !type) {
    return { error: 'Organization name, slug, and type are required' };
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Slug can only contain lowercase letters, numbers, and hyphens' };
  }

  // Validate type
  const validTypes = ['company', 'ngo', 'government', 'network', 'other'];
  if (!validTypes.includes(type)) {
    return { error: 'Invalid organization type' };
  }

  try {
    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        slug: slug.toLowerCase(),
        displayName,
        legalName: legalName || null,
        type: type as any,
        mission: mission || null,
        website: website || null,
        createdBy: user.id,
      })
      .returning();

    // Add user as owner
    await db.insert(organizationMembers).values({
      orgId: org.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
    });

    // Update profile persona
    await db.update(profiles).set({ persona: 'org_member' }).where(eq(profiles.id, user.id));

    revalidatePath(`/app/o/${org.slug}`);
    return { success: true, orgSlug: org.slug };
  } catch (error: any) {
    if (error.code === '23505') {
      return { error: 'Organization slug already taken. Please choose another.' };
    }
    console.error('Organization onboarding error:', error);
    return { error: 'Failed to create organization. Please try again.' };
  }
}
