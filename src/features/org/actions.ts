'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { checkSlugAvailability, updateOrgSlug } from '@/lib/orgs';
import { viewerCanEditOrg } from '@/features/org/data';

const nullableUrl = z.string().url().nullable().optional();
const nullableString = z.string().nullable().optional();

const OrgPatch = z.object({
  logo_url: nullableUrl,
  tagline: z.string().max(160).nullable().optional(),
  size: nullableString,
  industry: nullableString,
  founded_date: nullableString,
  legal_form: nullableString,
  locations: z.any().optional(),
  mission: nullableString,
  vision: nullableString,
  core_values: z.array(z.string()).optional(),
  causes: z.array(z.string()).optional(),
  verifications: z.any().optional(),
  impact_pipeline: z.any().optional(),
  commitments: z.any().optional(),
  website_url: nullableUrl,
  social_urls: z.any().optional(),
});

export async function patchOrganization(orgId: string, input: unknown) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('unauthorized');

  const body = OrgPatch.parse(input);
  const { error } = await supabase.from('organizations').update(body).eq('id', orgId);
  if (error) throw error;
}

export async function actionCheckSlugAvailability(formData: FormData) {
  const slugInput = String(formData.get('slug') ?? '');
  const orgId = formData.get('orgId') ? String(formData.get('orgId')) : undefined;

  const { available, normalized } = await checkSlugAvailability(slugInput, {
    excludeOrgId: orgId,
  });

  if (!normalized) {
    return { ok: false, slug: '', reason: 'invalid' as const };
  }

  if (normalized.length < 3) {
    return { ok: false, slug: normalized, reason: 'invalid' as const };
  }

  return { ok: available, slug: normalized, reason: available ? undefined : ('taken' as const) };
}

export async function actionConfirmSlug(formData: FormData) {
  const orgId = String(formData.get('orgId') ?? '');
  const slugInput = String(formData.get('slug') ?? '');

  if (!orgId) {
    throw new Error('org-required');
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('unauthorized');
  }

  const { data: membership, error: membershipErr } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle<{ role: string | null; status: string | null }>();

  if (membershipErr) {
    throw membershipErr;
  }

  if (!membership || membership.status !== 'active' || !viewerCanEditOrg(membership.role)) {
    throw new Error('forbidden');
  }

  const slug = await updateOrgSlug(orgId, slugInput);

  return { slug };
}
