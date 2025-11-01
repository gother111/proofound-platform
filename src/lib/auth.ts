import { createClient } from './supabase/server';
import type { Organization, OrganizationMember, Profile } from '@/db/schema';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  | 'coverImageUrl'
  | 'tagline'
  | 'mission'
  | 'vision'
  | 'industry'
  | 'organizationSize'
  | 'impactArea'
  | 'legalForm'
  | 'foundedDate'
  | 'website'
  | 'values'
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
    coverImageUrl: row.coverImageUrl ?? null,
    tagline: row.tagline ?? null,
    mission: row.mission ?? null,
    vision: row.vision ?? null,
    industry: row.industry ?? null,
    organizationSize: row.organizationSize ?? null,
    impactArea: row.impactArea ?? null,
    legalForm: row.legalForm ?? null,
    foundedDate: (row.foundedDate as OrganizationRow['foundedDate']) ?? null,
    website: row.website ?? null,
    values: (row.values as OrganizationRow['values']) ?? null,
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
          coverImageUrl:cover_image_url,
          tagline,
          mission,
          vision,
          industry,
          organizationSize:organization_size,
          impactArea:impact_area,
          legalForm:legal_form,
          foundedDate:founded_date,
          website,
          values,
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
    .eq('status', 'active');

  if (error) {
    console.error('Failed to load organizations for user:', error);
    return [];
  }

  type SupabaseOrgMembership = {
    org: OrganizationRow | OrganizationRow[] | null;
    orgId: string;
    userId: string;
    role: OrganizationMemberRow['role'];
    status: OrganizationMemberRow['status'];
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
          orgId: item.orgId as string,
          userId: item.userId as string,
          role: item.role as OrganizationMemberRow['role'],
          status: item.status as OrganizationMemberRow['status'],
          joinedAt: item.joinedAt
            ? new Date(item.joinedAt as unknown as string | number)
            : undefined,
        }),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
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
        coverImageUrl:cover_image_url,
        tagline,
        mission,
        vision,
        industry,
        organizationSize:organization_size,
        impactArea:impact_area,
        legalForm:legal_form,
        foundedDate:founded_date,
        website,
        values,
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
      coverImageUrl: (data as Record<string, unknown>).coverImageUrl as string | null | undefined,
      tagline: (data as Record<string, unknown>).tagline as string | null | undefined,
      mission: (data as Record<string, unknown>).mission as string | null | undefined,
      vision: (data as Record<string, unknown>).vision as string | null | undefined,
      industry: (data as Record<string, unknown>).industry as string | null | undefined,
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

  const persona = await getPersona(user.id);

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
