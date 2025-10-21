'use server';

import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateSlug } from '@/lib/utils';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ persona: result.data.persona, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to update persona:', error);
    return { error: 'Failed to update persona. Please try again.' };
  }

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
    const supabase = await createClient();

    const profileUpdate = await supabase
      .from('profiles')
      .update({
        handle: handle.toLowerCase(),
        display_name: displayName,
        persona: 'individual',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (profileUpdate.error) {
      if (profileUpdate.error.code === '23505') {
        return { error: 'Handle already taken. Please choose another.' };
      }

      console.error('Failed to update profile during onboarding:', profileUpdate.error);
      return { error: 'Failed to complete setup. Please try again.' };
    }

    const individualInsert = await supabase.from('individual_profiles').upsert({
      user_id: user.id,
      headline: headline || null,
      bio: bio || null,
      location: location || null,
      visibility: 'network',
    });

    if (individualInsert.error) {
      console.error(
        'Failed to create individual profile during onboarding:',
        individualInsert.error
      );
      return { error: 'Failed to complete setup. Please try again.' };
    }

    revalidatePath('/app/i');
    return { success: true };
  } catch (error: any) {
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
    const supabase = await createClient();

    const orgId = randomUUID();
    const orgSlug = slug.toLowerCase();

    const orgInsert = await supabase.from('organizations').insert({
      id: orgId,
      slug: orgSlug,
      display_name: displayName,
      legal_name: legalName || null,
      type,
      mission: mission || null,
      website: website || null,
      created_by: user.id,
    });

    if (orgInsert.error) {
      if (orgInsert.error.code === '23505') {
        return { error: 'Organization slug already taken. Please choose another.' };
      }
      console.error('Organization onboarding insert error:', orgInsert.error);
      return { error: 'Failed to create organization. Please try again.' };
    }

    const memberInsert = await supabase.from('organization_members').insert({
      org_id: orgId,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    });

    if (memberInsert.error) {
      console.error('Failed to add organization owner:', memberInsert.error);
      return { error: 'Failed to create organization. Please try again.' };
    }

    const personaUpdate = await supabase
      .from('profiles')
      .update({ persona: 'org_member', updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (personaUpdate.error) {
      console.error('Failed to update persona after organization onboarding:', personaUpdate.error);
    }

    revalidatePath(`/app/o/${orgSlug}`);
    return { success: true, orgSlug };
  } catch (error: any) {
    console.error('Organization onboarding error:', error);
    return { error: 'Failed to create organization. Please try again.' };
  }
}
