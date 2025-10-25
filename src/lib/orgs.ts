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

type OrgClientOptions = {
  supabase?: SupabaseClient;
  admin?: SupabaseClient;
  attemptAdmin?: boolean;
};

type ResolvedClients = {
  readClient: SupabaseClient;
  writeClient: SupabaseClient;
  adminClient?: SupabaseClient;
  usedFallback: boolean;
};

function resolveClients(context: string, options?: OrgClientOptions): ResolvedClients {
  const attemptAdmin = options?.attemptAdmin !== false;
  const sessionClient = options?.supabase ?? null;

  if (options?.admin) {
    return {
      readClient: sessionClient ?? options.admin,
      writeClient: options.admin,
      adminClient: options.admin,
      usedFallback: false,
    };
  }

  if (attemptAdmin) {
    try {
      const adminClient = createAdminClient();
      return {
        readClient: sessionClient ?? adminClient,
        writeClient: adminClient,
        adminClient,
        usedFallback: false,
      };
    } catch (error) {
      if (!sessionClient) {
        throw error;
      }

      console.warn(
        `[${context}] falling back to session-scoped Supabase client because admin client is unavailable`,
        {
          error: String(error),
        }
      );
    }
  }

  if (!sessionClient) {
    throw new Error(
      `[${context}] no Supabase client available after admin client fallback; cannot complete organization context setup`
    );
  }

  return {
    readClient: sessionClient,
    writeClient: sessionClient,
    usedFallback: true,
  };
}

export type MembershipWithOrganization = {
  status: string | null;
  organization: {
    id: string;
    slug: string | null;
    display_name: string | null;
  } | null;
};

async function ensureOrgPersona(client: SupabaseClient, userId: string) {
  const { data: profile, error: profileErr } = await client
    .from('profiles')
    .select('persona')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) {
    console.warn('[ensureOrgPersona] failed to load persona', {
      userId,
      error: String(profileErr),
    });
    return;
  }

  if (profile?.persona === 'org_member') {
    return;
  }

  const { error: updateErr } = await client
    .from('profiles')
    .upsert({ id: userId, persona: 'org_member' }, { onConflict: 'id' });

  if (updateErr) {
    console.warn('[ensureOrgPersona] failed to upsert persona', {
      userId,
      error: String(updateErr),
    });
  }
}

export async function ensureOrgSlugForId(
  orgId: string,
  displayName?: string | null,
  clientOptions?: OrgClientOptions
): Promise<string> {
  const { readClient, writeClient } = resolveClients('ensureOrgSlugForId', clientOptions);

  const { data: org, error: readErr } = await readClient
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
    const { data: conflict } = await readClient
      .from('organizations')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle();

    if (!conflict) {
      const { data: updated, error: updateErr } = await writeClient
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
  opts?: { displayNameHint?: string | null; email?: string | null },
  clientOptions?: OrgClientOptions
): Promise<string> {
  const { readClient, writeClient, adminClient, usedFallback } = resolveClients(
    'ensureOrgContextForUser',
    clientOptions
  );

  const { data: membership } = await readClient
    .from('organization_members')
    .select('status, role, organization:organizations(id, slug, display_name)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle<MembershipWithOrganization>();

  if (membership?.status === 'active' && membership.organization) {
    await ensureOrgPersona(writeClient, userId);
    return ensureOrgSlugForId(membership.organization.id, membership.organization.display_name, {
      supabase: readClient,
      admin: adminClient,
      attemptAdmin: !usedFallback,
    });
  }

  const fallbackName =
    opts?.displayNameHint ?? (opts?.email ? opts.email.split('@')[0] : 'My Organization');

  const { data: org, error: orgErr } = await writeClient
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

  const { error: membershipErr } = await writeClient.from('organization_members').insert({
    user_id: userId,
    org_id: org.id,
    role: 'owner',
    status: 'active',
  });

  if (membershipErr) {
    throw membershipErr;
  }

  await ensureOrgPersona(writeClient, userId);

  return ensureOrgSlugForId(org.id, org.display_name, {
    supabase: readClient,
    admin: adminClient,
    attemptAdmin: !usedFallback,
  });
}
