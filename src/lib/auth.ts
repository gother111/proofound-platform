import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from './supabase/server';
import type { Organization, OrganizationMember, Profile } from '@/db/schema';
import { redirect } from 'next/navigation';
import { ensureOrgSlug } from './orgs';

type ProfileRow = Pick<
  Profile,
  'id' | 'handle' | 'displayName' | 'avatarUrl' | 'locale' | 'persona' | 'createdAt' | 'updatedAt'
>;

type OrganizationRow = Pick<
  Organization,
  | 'id'
  | 'slug'
  | 'displayName'
  | 'legalName'
  | 'type'
  | 'logoUrl'
  | 'mission'
  | 'website'
  | 'createdBy'
  | 'createdAt'
  | 'updatedAt'
>;

type OrganizationMemberRow = Pick<
  OrganizationMember,
  'orgId' | 'userId' | 'role' | 'status' | 'joinedAt'
>;

function mapProfile(row: Partial<ProfileRow> & { id: string }): ProfileRow {
  return {
    id: row.id,
    handle: row.handle ?? null,
    displayName: row.displayName ?? null,
    avatarUrl: row.avatarUrl ?? null,
    locale: row.locale ?? 'en',
    persona: row.persona ?? 'unknown',
    createdAt: row.createdAt ? new Date(row.createdAt as unknown as string | number) : new Date(0),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as unknown as string | number) : new Date(),
  };
}

function mapOrganization(
  row: Partial<OrganizationRow> & { id: string; slug: string }
): OrganizationRow {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.displayName ?? '',
    legalName: row.legalName ?? null,
    type: (row.type as OrganizationRow['type']) ?? null,
    logoUrl: row.logoUrl ?? null,
    mission: row.mission ?? null,
    website: row.website ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt ? new Date(row.createdAt as unknown as string | number) : new Date(0),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as unknown as string | number) : new Date(),
  };
}

function mapMembership(
  row: Partial<OrganizationMemberRow> & { orgId: string; userId: string }
): OrganizationMemberRow {
  return {
    orgId: row.orgId,
    userId: row.userId,
    role: (row.role as OrganizationMemberRow['role']) ?? 'member',
    status: (row.status as OrganizationMemberRow['status']) ?? 'active',
    joinedAt: row.joinedAt ? new Date(row.joinedAt as unknown as string | number) : new Date(),
  };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      `
        id,
        handle,
        displayName:display_name,
        avatarUrl:avatar_url,
        locale,
        persona,
        createdAt:created_at,
        updatedAt:updated_at
      `
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load profile for current user:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapProfile(data as ProfileRow);
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getUserOrganizations(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
        orgId:org_id,
        userId:user_id,
        role,
        status,
        joinedAt:joined_at,
        org:organizations (
          id,
          slug,
          displayName:display_name,
          legalName:legal_name,
          type,
          logoUrl:logo_url,
          mission,
          website,
          createdBy:created_by,
          createdAt:created_at,
          updatedAt:updated_at
        )
      `
    )
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) {
    console.error('Failed to load organizations for user:', error);
    return [];
  }

  return (data ?? [])
    .filter((item): item is typeof item & { org: OrganizationRow } => Boolean(item.org))
    .map((item) => ({
      org: mapOrganization(item.org as OrganizationRow),
      membership: mapMembership({
        orgId: item.orgId as string,
        userId: item.userId as string,
        role: item.role as OrganizationMemberRow['role'],
        status: item.status as OrganizationMemberRow['status'],
        joinedAt: item.joinedAt ? new Date(item.joinedAt as unknown as string | number) : undefined,
      }),
    }));
}

export async function getActiveOrg(slug: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select(
      `
        id,
        slug,
        displayName:display_name,
        legalName:legal_name,
        type,
        logoUrl:logo_url,
        mission,
        website,
        createdBy:created_by,
        createdAt:created_at,
        updatedAt:updated_at,
        membership:organization_members!inner (
          orgId:org_id,
          userId:user_id,
          role,
          status,
          joinedAt:joined_at
        )
      `
    )
    .eq('slug', slug)
    .eq('organization_members.user_id', userId)
    .eq('organization_members.status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Failed to load active organization:', error);
    return null;
  }

  if (!data || !data.membership) {
    return null;
  }

  const membershipRow = Array.isArray(data.membership) ? data.membership[0] : data.membership;

  if (!membershipRow) {
    return null;
  }

  return {
    org: mapOrganization({
      id: data.id,
      slug: data.slug,
      displayName: (data as Record<string, unknown>).displayName as string | undefined,
      legalName: (data as Record<string, unknown>).legalName as string | null | undefined,
      type: data.type as OrganizationRow['type'],
      logoUrl: (data as Record<string, unknown>).logoUrl as string | null | undefined,
      mission: (data as Record<string, unknown>).mission as string | null | undefined,
      website: (data as Record<string, unknown>).website as string | null | undefined,
      createdBy: (data as Record<string, unknown>).createdBy as string | null | undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Partial<OrganizationRow> & { id: string; slug: string }),
    membership: mapMembership({
      orgId: membershipRow.orgId as string,
      userId: membershipRow.userId as string,
      role: membershipRow.role as OrganizationMemberRow['role'],
      status: membershipRow.status as OrganizationMemberRow['status'],
      joinedAt: membershipRow.joinedAt
        ? new Date(membershipRow.joinedAt as unknown as string | number)
        : undefined,
    }),
  };
}

export async function assertOrgRole(orgId: string, userId: string, roles: string[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('orgId:org_id, userId:user_id, role, status, joinedAt:joined_at')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Failed to verify organization role:', error);
    throw new Error('Unable to verify permissions');
  }

  if (!data || !roles.includes(data.role as string)) {
    throw new Error('Insufficient permissions');
  }

  return mapMembership({
    orgId,
    userId,
    role: data.role as OrganizationMemberRow['role'],
    status: data.status as OrganizationMemberRow['status'],
    joinedAt: data.joinedAt ? new Date(data.joinedAt as unknown as string | number) : undefined,
  });
}

export type Role = 'owner' | 'admin' | 'member' | 'viewer';

type MembershipWithOrganization = {
  status: string | null;
  organization: {
    id: string;
    slug: string | null;
    display_name: string | null;
  } | null;
};

export async function resolveUserHomePath(supabaseClient?: SupabaseClient): Promise<string> {
  const supabase = supabaseClient ?? (await createClient());

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    console.info('[resolveUserHomePath] no-user-or-auth-error', { authErr: Boolean(authErr) });
    return '/app/i/home';
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('persona')
    .eq('id', user.id)
    .maybeSingle();

  const { data: membership, error: memErr } = await supabase
    .from('organization_members')
    .select('status, organization:organizations(id, slug, display_name)')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle<MembershipWithOrganization>();

  const hasActiveOrg = !!membership && membership.status === 'active' && !!membership.organization;

  if (hasActiveOrg) {
    let slug = membership!.organization!.slug ?? null;

    if (!slug) {
      try {
        slug = await ensureOrgSlug(
          supabase,
          membership!.organization!.id,
          membership!.organization!.display_name ?? null
        );
      } catch (error) {
        console.warn('[resolveUserHomePath] ensureOrgSlug failed, falling back to onboarding', {
          error: String(error),
        });
      }
    }

    if (slug) {
      console.info('[resolveUserHomePath] active-org -> org-home', {
        userId: user.id,
        slug,
      });
      return `/app/o/${slug}/home`;
    }

    console.info('[resolveUserHomePath] active-org-but-no-slug -> onboarding', { userId: user.id });
    return '/onboarding';
  }

  if (memErr) {
    console.info('[resolveUserHomePath] membership-error', {
      userId: user.id,
      error: String(memErr),
    });
  }

  if (profileErr) {
    console.info('[resolveUserHomePath] profile-error -> individual home', {
      userId: user.id,
      profileErr: String(profileErr),
    });
    return '/app/i/home';
  }

  if (profile?.persona === 'individual') {
    console.info('[resolveUserHomePath] persona-individual -> individual home', {
      userId: user.id,
    });
    return '/app/i/home';
  }

  console.info('[resolveUserHomePath] no-active-org-and-non-individual -> onboarding', {
    userId: user.id,
    persona: profile?.persona ?? null,
  });
  return '/onboarding';
}
