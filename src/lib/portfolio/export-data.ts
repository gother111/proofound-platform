import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import type { SupabaseClient } from '@supabase/supabase-js';

export type TrustExportData = {
  profile: {
    id: string;
    handle: string;
    displayName: string;
    headline: string;
    bio?: string;
    contactEmail?: string;
  };
  signals: ReturnType<typeof buildTrustSignals>;
  skills: Array<{ id: string; name: string; level: number }>;
  visibility: ReturnType<typeof mergeVisibilityFlags>;
};

export type OrganizationTrustExportData = {
  organization: {
    id: string;
    slug: string;
    displayName: string;
    tagline?: string;
    mission?: string;
    website?: string;
    type?: string;
    verified: boolean;
    values: string[];
    causes: string[];
  };
  metrics: {
    activeAssignments: number;
    teamMembers: number;
  };
};

function toValueLabels(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object' && 'label' in item) {
        const label = (item as { label?: unknown }).label;
        return typeof label === 'string' ? label.trim() : '';
      }
      return '';
    })
    .filter((item) => item.length > 0)
    .slice(0, 8);
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(0, 8);
}

export async function fetchTrustExportData(
  supabase: SupabaseClient,
  userId: string
): Promise<TrustExportData | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
        id,
        handle,
        display_name,
        individual_profiles (
          headline,
          bio,
          tagline,
          verification_status,
          verification_method,
          verified_at,
          work_email,
          work_email_verified,
          linkedin_verification_status,
          linkedin_verified_at,
          linkedin_verification_data,
          verified
        ),
        field_visibility: individual_profiles ( field_visibility )
      `
    )
    .eq('id', userId)
    .maybeSingle();

  if (!profile || !profile.handle) return null;

  let proofsCount = 0;
  let acceptedVerificationsCount = 0;
  let attestationCount = 0;
  let skills: Array<{ id: string; name: string; level: number }> = [];

  try {
    const { count } = await supabase
      .from('skill_proofs')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', profile.id);
    proofsCount = count || 0;
  } catch {
    proofsCount = 0;
  }

  try {
    const { count } = await supabase
      .from('skill_verification_requests')
      .select('id', { count: 'exact', head: true })
      .eq('requester_profile_id', profile.id)
      .eq('status', 'accepted')
      .eq('integrity_status', 'clear');
    acceptedVerificationsCount = count || 0;
  } catch {
    acceptedVerificationsCount = 0;
  }

  try {
    const { count } = await supabase
      .from('attestations')
      .select('id', { count: 'exact', head: true })
      .eq('subject_user_id', profile.id)
      .eq('status', 'verified');
    attestationCount = count || 0;
  } catch {
    attestationCount = 0;
  }

  try {
    const { data } = await supabase
      .from('skills')
      .select(
        `
          id,
          level,
          skill_code,
          taxonomy:skill_code (
            name_i18n
          )
        `
      )
      .eq('profile_id', profile.id)
      .order('level', { ascending: false })
      .limit(6);

    skills =
      data?.map((skill) => {
        const name =
          (skill.taxonomy as any)?.name_i18n?.en ||
          (skill.taxonomy as any)?.name_i18n?.default ||
          skill.skill_code ||
          'Skill';
        return {
          id: skill.id,
          name,
          level: skill.level ?? 0,
        };
      }) || [];
  } catch {
    skills = [];
  }

  const signals = buildTrustSignals(profile as any, {
    proofsCount,
    acceptedVerificationsCount,
    attestationCount,
  });

  const individual = Array.isArray((profile as any).individual_profiles)
    ? (profile as any).individual_profiles[0]
    : (profile as any).individual_profiles;

  return {
    profile: {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.display_name || profile.handle,
      headline: individual?.headline || individual?.tagline || 'Proofound portfolio',
      bio: individual?.bio || undefined,
      contactEmail: individual?.work_email || undefined,
    },
    signals,
    skills,
    visibility: mergeVisibilityFlags(
      Array.isArray((profile as any).field_visibility)
        ? (profile as any).field_visibility[0]?.field_visibility
        : (profile as any).field_visibility?.field_visibility
    ),
  };
}

export async function fetchOrganizationTrustExportData(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrganizationTrustExportData | null> {
  const { data: organization } = await supabase
    .from('organizations')
    .select(
      `
        id,
        slug,
        display_name,
        tagline,
        mission,
        website,
        type,
        values,
        causes,
        verified
      `
    )
    .eq('id', orgId)
    .maybeSingle();

  if (!organization || !organization.slug) {
    return null;
  }

  const [activeAssignmentsResult, teamMembersResult] = await Promise.all([
    supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', organization.id)
      .eq('status', 'active'),
    supabase
      .from('organization_members')
      .select('user_id', { count: 'exact', head: true })
      .eq('org_id', organization.id)
      .eq('status', 'active'),
  ]);

  return {
    organization: {
      id: organization.id,
      slug: organization.slug,
      displayName: organization.display_name || organization.slug,
      tagline: organization.tagline || undefined,
      mission: organization.mission || undefined,
      website: normalizeOrganizationWebsite(organization.website).value || undefined,
      type: organization.type || undefined,
      verified: Boolean(organization.verified),
      values: toValueLabels(organization.values),
      causes: toStringList(organization.causes),
    },
    metrics: {
      activeAssignments: activeAssignmentsResult.count || 0,
      teamMembers: teamMembersResult.count || 0,
    },
  };
}
