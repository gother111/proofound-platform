import { createClient } from './supabase/server';
import type { Organization, OrganizationMember, Profile } from '@/db/schema';
import type { OrgRole } from '@/lib/authz';
import {
  isActiveMembershipState,
  normalizeAuthorizedOrgRole,
  normalizeMembershipState,
} from '@/lib/authz';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as React from 'react';

type ProfileRow = Pick<
  Profile,
  | 'id'
  | 'handle'
  | 'displayName'
  | 'avatarUrl'
  | 'locale'
  | 'persona'
  | 'isBetaTesting'
  | 'createdAt'
  | 'updatedAt'
>;

type OrganizationRow = Pick<
  Organization,
  | 'id'
  | 'slug'
  | 'displayName'
  | 'legalName'
  | 'verified'
  | 'type'
  | 'logoUrl'
  | 'coverImageUrl'
  | 'tagline'
  | 'mission'
  | 'workingContext'
  | 'hiringProcessSummary'
  | 'vision'
  | 'missionLinks'
  | 'visionLinks'
  | 'industry'
  | 'industryKey'
  | 'industryLabel'
  | 'industryLegacyText'
  | 'organizationSize'
  | 'impactArea'
  | 'legalForm'
  | 'foundedDate'
  | 'website'
  | 'values'
  | 'causes'
  | 'workCulture'
  | 'registrationCountry'
  | 'registrationRegion'
  | 'organizationNumber'
  | 'locations'
  | 'createdBy'
  | 'createdAt'
  | 'updatedAt'
>;

type OrganizationMemberRow = Pick<
  OrganizationMember,
  'id' | 'orgId' | 'userId' | 'role' | 'state' | 'joinedAt'
>;

export type ApiAuthContext = {
  user: ProfileRow;
  supabase: SupabaseClient;
};

function dedupeInFlight<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  const inFlight = new Map<string, Promise<TResult>>();

  return async (...args: TArgs) => {
    const key = JSON.stringify(args);
    const existing = inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = fn(...args).finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
  };
}

function cache<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  const reactCache = (React as { cache?: unknown }).cache;

  if (typeof reactCache === 'function') {
    return (
      reactCache as (
        inner: (...args: TArgs) => Promise<TResult>
      ) => (...args: TArgs) => Promise<TResult>
    )(fn);
  }

  return dedupeInFlight(fn);
}

const getRequestScopedClient = async () => createClient();

function mapProfile(row: Partial<ProfileRow> & { id: string }): ProfileRow {
  return {
    id: row.id,
    handle: row.handle ?? null,
    displayName: row.displayName ?? null,
    avatarUrl: row.avatarUrl ?? null,
    locale: row.locale ?? 'en',
    persona: row.persona ?? 'unknown',
    isBetaTesting: row.isBetaTesting ?? false,
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
    verified: row.verified ?? false,
    type: (row.type as OrganizationRow['type']) ?? null,
    logoUrl: row.logoUrl ?? null,
    coverImageUrl: row.coverImageUrl ?? null,
    tagline: row.tagline ?? null,
    mission: row.mission ?? null,
    workingContext: row.workingContext ?? null,
    hiringProcessSummary: row.hiringProcessSummary ?? null,
    vision: row.vision ?? null,
    missionLinks: (row.missionLinks as OrganizationRow['missionLinks']) ?? null,
    visionLinks: (row.visionLinks as OrganizationRow['visionLinks']) ?? null,
    industry: row.industry ?? null,
    industryKey: row.industryKey ?? null,
    industryLabel: row.industryLabel ?? null,
    industryLegacyText: row.industryLegacyText ?? null,
    organizationSize: row.organizationSize ?? null,
    impactArea: row.impactArea ?? null,
    legalForm: row.legalForm ?? null,
    foundedDate: (row.foundedDate as OrganizationRow['foundedDate']) ?? null,
    website: row.website ?? null,
    values: (row.values as OrganizationRow['values']) ?? null,
    causes: (row.causes as OrganizationRow['causes']) ?? null,
    workCulture: (row.workCulture as OrganizationRow['workCulture']) ?? null,
    registrationCountry: row.registrationCountry ?? null,
    registrationRegion: row.registrationRegion ?? null,
    organizationNumber: row.organizationNumber ?? null,
    locations: (row.locations as OrganizationRow['locations']) ?? null,
    createdBy: row.createdBy ?? null,
    createdAt: row.createdAt ? new Date(row.createdAt as unknown as string | number) : new Date(0),
    updatedAt: row.updatedAt ? new Date(row.updatedAt as unknown as string | number) : new Date(),
  };
}

function mapMembership(
  row: Partial<OrganizationMemberRow> & { orgId: string; userId: string }
): OrganizationMemberRow {
  return {
    id: row.id ?? '',
    orgId: row.orgId,
    userId: row.userId,
    role: (normalizeAuthorizedOrgRole(row.role as string | null | undefined) ??
      'org_reviewer') as OrganizationMemberRow['role'],
    state: normalizeMembershipState(row.state as string | null | undefined),
    joinedAt: row.joinedAt ? new Date(row.joinedAt as unknown as string | number) : new Date(),
  };
}

async function getCurrentUserWithClient(supabase: SupabaseClient): Promise<ProfileRow | null> {
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
        isBetaTesting:is_beta_testing,
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

const getCurrentUserCached = async () => {
  const supabase = await getRequestScopedClient();
  return getCurrentUserWithClient(supabase);
};

export async function getCurrentUser() {
  return getCurrentUserCached();
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireApiAuthContext(): Promise<ApiAuthContext | null> {
  const supabase = await createClient({ allowCookieWrite: true });
  const user = await getCurrentUserWithClient(supabase);

  if (!user) {
    return null;
  }

  return { user, supabase };
}

const getUserOrganizationsCached = cache(async (userId: string) => {
  const supabase = await getRequestScopedClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select(
      `
        orgId:org_id,
        id,
        userId:user_id,
        role,
        state,
        joinedAt:joined_at,
        org:organizations (
          id,
          slug,
          displayName:display_name,
          legalName:legal_name,
          verified,
          type,
          logoUrl:logo_url,
          coverImageUrl:cover_image_url,
          tagline,
          mission,
          workingContext:working_context,
          hiringProcessSummary:hiring_process_summary,
          vision,
          missionLinks:mission_links,
          visionLinks:vision_links,
          industry,
          industryKey:industry_key,
          industryLabel:industry_label,
          industryLegacyText:industry_legacy_text,
          organizationSize:organization_size,
          impactArea:impact_area,
          legalForm:legal_form,
          foundedDate:founded_date,
          website,
          values,
          causes,
          workCulture:work_culture,
          registrationCountry:registration_country,
          registrationRegion:registration_region,
          organizationNumber:organization_number,
          locations,
          createdBy:created_by,
          createdAt:created_at,
          updatedAt:updated_at
        )
      `
    )
    .eq('user_id', userId)
    .eq('state', 'active');

  if (error) {
    console.error('Failed to load organizations for user:', error);
    return [];
  }

  type SupabaseOrgMembership = {
    org: OrganizationRow | OrganizationRow[] | null;
    id: string;
    orgId: string;
    userId: string;
    role: OrganizationMemberRow['role'];
    state: OrganizationMemberRow['state'];
    joinedAt?: string | null;
  };

  return (data ?? [])
    .map((item: SupabaseOrgMembership) => {
      const orgRecord = Array.isArray(item.org) ? item.org[0] : item.org;
      if (!orgRecord) {
        return null;
      }

      return {
        org: mapOrganization(orgRecord as OrganizationRow),
        membership: mapMembership({
          id: item.id as string,
          orgId: item.orgId as string,
          userId: item.userId as string,
          role: item.role as OrganizationMemberRow['role'],
          state: item.state as OrganizationMemberRow['state'],
          joinedAt: item.joinedAt
            ? new Date(item.joinedAt as unknown as string | number)
            : undefined,
        }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
});

export async function getUserOrganizations(userId: string) {
  return getUserOrganizationsCached(userId);
}

const getActiveOrgCached = cache(async (slug: string, userId: string) => {
  const supabase = await getRequestScopedClient();
  const { data, error } = await supabase
    .from('organizations')
    .select(
      `
        id,
        slug,
        displayName:display_name,
        legalName:legal_name,
        verified,
        type,
        logoUrl:logo_url,
        coverImageUrl:cover_image_url,
        tagline,
        mission,
        vision,
        missionLinks:mission_links,
        visionLinks:vision_links,
        industry,
        industryKey:industry_key,
        industryLabel:industry_label,
        industryLegacyText:industry_legacy_text,
        organizationSize:organization_size,
        impactArea:impact_area,
        legalForm:legal_form,
        foundedDate:founded_date,
        website,
        values,
        causes,
        workCulture:work_culture,
        registrationCountry:registration_country,
        registrationRegion:registration_region,
        organizationNumber:organization_number,
        locations,
        createdBy:created_by,
        createdAt:created_at,
        updatedAt:updated_at,
        membership:organization_members!inner (
          orgId:org_id,
          id,
          userId:user_id,
          role,
          state,
          joinedAt:joined_at
        )
      `
    )
    .eq('slug', slug)
    .eq('organization_members.user_id', userId)
    .eq('organization_members.state', 'active')
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
      verified: (data as Record<string, unknown>).verified as boolean | undefined,
      type: data.type as OrganizationRow['type'],
      logoUrl: (data as Record<string, unknown>).logoUrl as string | null | undefined,
      coverImageUrl: (data as Record<string, unknown>).coverImageUrl as string | null | undefined,
      tagline: (data as Record<string, unknown>).tagline as string | null | undefined,
      mission: (data as Record<string, unknown>).mission as string | null | undefined,
      vision: (data as Record<string, unknown>).vision as string | null | undefined,
      missionLinks: (data as Record<string, unknown>).missionLinks as
        | OrganizationRow['missionLinks']
        | undefined,
      visionLinks: (data as Record<string, unknown>).visionLinks as
        | OrganizationRow['visionLinks']
        | undefined,
      industry: (data as Record<string, unknown>).industry as string | null | undefined,
      industryKey: (data as Record<string, unknown>).industryKey as string | null | undefined,
      industryLabel: (data as Record<string, unknown>).industryLabel as string | null | undefined,
      industryLegacyText: (data as Record<string, unknown>).industryLegacyText as
        | string
        | null
        | undefined,
      organizationSize: (data as Record<string, unknown>).organizationSize as
        | OrganizationRow['organizationSize']
        | undefined,
      impactArea: (data as Record<string, unknown>).impactArea as string | null | undefined,
      legalForm: (data as Record<string, unknown>).legalForm as
        | OrganizationRow['legalForm']
        | undefined,
      foundedDate: (data as Record<string, unknown>).foundedDate as string | null | undefined,
      website: (data as Record<string, unknown>).website as string | null | undefined,
      values: (data as Record<string, unknown>).values as OrganizationRow['values'],
      workCulture: (data as Record<string, unknown>).workCulture as OrganizationRow['workCulture'],
      registrationCountry: (data as Record<string, unknown>).registrationCountry as
        | string
        | null
        | undefined,
      registrationRegion: (data as Record<string, unknown>).registrationRegion as
        | string
        | null
        | undefined,
      organizationNumber: (data as Record<string, unknown>).organizationNumber as
        | string
        | null
        | undefined,
      locations: (data as Record<string, unknown>).locations as OrganizationRow['locations'],
      createdBy: (data as Record<string, unknown>).createdBy as string | null | undefined,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as Partial<OrganizationRow> & { id: string; slug: string }),
    membership: mapMembership({
      id: membershipRow.id as string,
      orgId: membershipRow.orgId as string,
      userId: membershipRow.userId as string,
      role: membershipRow.role as OrganizationMemberRow['role'],
      state: membershipRow.state as OrganizationMemberRow['state'],
      joinedAt: membershipRow.joinedAt
        ? new Date(membershipRow.joinedAt as unknown as string | number)
        : undefined,
    }),
  };
});

export async function getActiveOrg(slug: string, userId: string) {
  return getActiveOrgCached(slug, userId);
}

export async function assertOrgRole(orgId: string, userId: string, roles: OrgRole[]) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_members')
    .select('id, orgId:org_id, userId:user_id, role, state, joinedAt:joined_at')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to verify organization role:', error);
    throw new Error('Unable to verify permissions');
  }

  const normalizedState = normalizeMembershipState(data?.state as string | null | undefined);
  const normalizedRole = normalizeAuthorizedOrgRole(data?.role as string | null | undefined);

  if (
    !data ||
    !isActiveMembershipState(normalizedState) ||
    !normalizedRole ||
    !roles.includes(normalizedRole)
  ) {
    throw new Error('Insufficient permissions');
  }

  return mapMembership({
    id: data.id as string,
    orgId,
    userId,
    role: normalizedRole as OrganizationMemberRow['role'],
    state: normalizedState,
    joinedAt: data.joinedAt ? new Date(data.joinedAt as unknown as string | number) : undefined,
  });
}

export type Role = OrgRole;

export async function getPersona(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('persona').eq('id', userId).maybeSingle();

  return (data?.persona as ProfileRow['persona']) ?? 'unknown';
}

async function getFirstOrganizationSlug(userId: string) {
  const organizations = await getUserOrganizations(userId);
  return organizations[0]?.org.slug ?? null;
}

export async function resolveUserHomePath(client?: SupabaseClient) {
  const supabase = client ?? (await createClient());

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return '/login';
  }

  // Check if user is a platform admin first AND get persona in one query
  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role, persona')
    .eq('id', user.id)
    .single();

  if (profile?.platform_role === 'platform_admin' || profile?.platform_role === 'super_admin') {
    return '/admin';
  }

  // Use persona from the same query instead of calling getPersona separately
  const persona = (profile?.persona as ProfileRow['persona']) ?? 'unknown';

  if (persona === 'individual') {
    return '/app/i/home';
  }

  if (persona === 'org_member') {
    const slug = await getFirstOrganizationSlug(user.id);
    if (slug) {
      return `/app/o/${slug}/home`;
    }
  }

  return '/onboarding';
}

export async function requirePersona(expected: ProfileRow['persona']) {
  const user = await requireAuth();

  if (user.persona === expected) {
    return user;
  }

  if (user.persona === 'individual') {
    redirect('/app/i/home');
  }

  if (user.persona === 'org_member') {
    const slug = await getFirstOrganizationSlug(user.id);
    if (slug) {
      redirect(`/app/o/${slug}/home`);
    }
    redirect('/onboarding');
  }

  redirect('/onboarding');
}

export async function checkAdminRole(userId: string): Promise<boolean> {
  // For MVP, hardcode admin emails (Pavlo and Yurii)
  // TODO: Move to database table in Phase 2
  const adminEmails = ['pavlo@proofound.io', 'yurii@proofound.io'];

  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();

  if (!data) return false;

  const { data: authUser } = await supabase.auth.getUser();
  if (!authUser?.user?.email) return false;

  return adminEmails.includes(authUser.user.email);
}

export async function requireAdmin() {
  const user = await requireAuth();
  const isAdmin = await checkAdminRole(user.id);

  if (!isAdmin) {
    redirect('/app/i/home');
  }

  return user;
}
