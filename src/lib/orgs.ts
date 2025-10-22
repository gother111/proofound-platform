import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export type MembershipWithOrganization = {
  status: string | null;
  organization: {
    id: string;
    slug: string | null;
    display_name: string | null;
  } | null;
};

export async function ensureOrgSlugForId(
  orgId: string,
  displayName?: string | null,
  adminClient?: SupabaseClient
): Promise<string> {
  const admin = adminClient ?? createAdminClient();

  const { data: org, error: readErr } = await admin
    .from('organizations')
    .select('id, slug, display_name')
    .eq('id', orgId)
    .single();

  if (readErr) {
    throw readErr;
  }

  if (org.slug) {
    return org.slug;
  }

  const base = toSlug(displayName ?? org.display_name ?? org.id);
  let candidate = base || toSlug(org.id);

  for (let i = 0; i < 12; i += 1) {
    const { data: conflict } = await admin
      .from('organizations')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!conflict) {
      const { data: updated, error: updateErr } = await admin
        .from('organizations')
        .update({ slug: candidate })
        .eq('id', orgId)
        .select('slug')
        .single();

      if (!updateErr && updated?.slug) {
        return updated.slug;
      }

      if (updateErr && !/duplicate|unique/i.test(updateErr.message ?? '')) {
        throw updateErr;
      }
    }

    candidate = `${base}-${i + 2}`;
  }

  throw new Error('Failed to ensure unique slug');
}

export async function ensureOrgContextForUser(
  userId: string,
  opts?: { displayNameHint?: string | null; email?: string | null }
): Promise<string> {
  const admin = createAdminClient();

  const { data: membership } = await admin
    .from('organization_members')
    .select('status, role, organization:organizations(id, slug, display_name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle<MembershipWithOrganization>();

  if (membership?.status === 'active' && membership.organization) {
    const slug = await ensureOrgSlugForId(
      membership.organization.id,
      membership.organization.display_name,
      admin
    );

    console.info('[ensureOrgContextForUser] result', {
      userId,
      slug,
      source: 'existing-membership',
      createdOrg: false,
    });

    return slug;
  }

  const fallbackName =
    opts?.displayNameHint ?? (opts?.email ? opts.email.split('@')[0] : 'My Organization');

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({
      display_name: fallbackName,
      created_by: userId,
    })
    .select('id, display_name')
    .single();

  if (orgErr) {
    throw orgErr;
  }

  const { error: membershipErr } = await admin.from('organization_members').insert({
    user_id: userId,
    org_id: org.id,
    role: 'owner',
    status: 'active',
  });

  if (membershipErr) {
    throw membershipErr;
  }

  const { error: profileErr } = await admin
    .from('profiles')
    .upsert({ id: userId, persona: 'org_member' }, { onConflict: 'id' });

  if (profileErr) {
    console.warn('[ensureOrgContextForUser] upsert persona failed', {
      userId,
      error: String(profileErr),
    });
  }

  const slug = await ensureOrgSlugForId(org.id, org.display_name, admin);

  console.info('[ensureOrgContextForUser] result', {
    userId,
    slug,
    source: 'provisioned-org',
    createdOrg: true,
  });

  return slug;
}
