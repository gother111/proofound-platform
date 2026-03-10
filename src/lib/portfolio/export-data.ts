import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import {
  deriveEffectivePublicPortfolioState,
  isAccessiblePublicPortfolioState,
  resolveRequestedPublicPortfolioState,
} from '@/lib/portfolio/public-contract';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import {
  listCanonicalProofPackAggregatesForOwner,
  summarizeCanonicalProofOwnerAggregates,
} from '@/lib/proofs/canonical-pack';
import { getPublicIndividualPortfolioProjectionByHandle } from '@/lib/portfolio/public-projection';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';
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
  publication: {
    requestedState: string;
    effectiveState: string;
    searchIndexingEnabled: boolean;
  };
  signals: ReturnType<typeof buildTrustSignals>;
  skills: Array<{ id: string; name: string; level: number }>;
  proofPacks: Array<{
    id: string;
    scope: 'owner_full' | 'public_safe';
    title: string;
    verificationStatus: string;
    freshnessState: string;
    artifactCount: number;
  }>;
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

type ProfileExportRow = {
  id: string;
  handle: string;
  display_name: string | null;
  public_portfolio_state?: string | null;
  search_indexing_enabled_at?: string | null;
  individual_profiles:
    | Array<{
        headline?: string | null;
        bio?: string | null;
        tagline?: string | null;
        skills?: string[] | null;
        redact_mode?: boolean | null;
        verification_status?: string | null;
        verification_method?: string | null;
        verified_at?: string | null;
        work_email?: string | null;
        work_email_verified?: boolean | null;
        linkedin_verification_status?: string | null;
        linkedin_verified_at?: string | null;
        linkedin_verification_data?: Record<string, unknown> | null;
        verified?: boolean | null;
      }>
    | {
        headline?: string | null;
        bio?: string | null;
        tagline?: string | null;
        skills?: string[] | null;
        redact_mode?: boolean | null;
        verification_status?: string | null;
        verification_method?: string | null;
        verified_at?: string | null;
        work_email?: string | null;
        work_email_verified?: boolean | null;
        linkedin_verification_status?: string | null;
        linkedin_verified_at?: string | null;
        linkedin_verification_data?: Record<string, unknown> | null;
        verified?: boolean | null;
      }
    | null;
  field_visibility:
    | Array<{
        field_visibility?: Record<string, unknown> | null;
      }>
    | {
        field_visibility?: Record<string, unknown> | null;
      }
    | null;
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

async function loadCanonicalTrustState(
  profileId: string,
  scope: 'owner_full' | 'public_safe'
): Promise<{
  proofsCount: number;
  acceptedVerificationsCount: number;
  attestationCount: number;
  proofPacks: TrustExportData['proofPacks'];
  verificationSummary: ReturnType<typeof summarizeVerificationPolicy>;
}> {
  const [aggregates, verificationRecords] = await Promise.all([
    listCanonicalProofPackAggregatesForOwner('individual_profile', profileId),
    listVerificationRecordsForOwner('individual_profile', profileId).catch(() => []),
  ]);

  const scopedAggregates =
    scope === 'public_safe'
      ? aggregates.filter((aggregate) => aggregate.publicSafe !== null)
      : aggregates;
  const summary = summarizeCanonicalProofOwnerAggregates(scopedAggregates);
  const verifiedReferences = new Map(
    scopedAggregates
      .flatMap((aggregate) => aggregate.verificationReferences)
      .filter((record) => record.status === 'verified')
      .map((record) => [record.id, record])
  );
  const attestationKinds = new Set([
    'skill_attestation_peer',
    'skill_attestation_manager',
    'impact_attestation',
  ]);
  const acceptedVerificationsCount = [...verifiedReferences.values()].filter(
    (record) => !attestationKinds.has(record.verificationKind)
  ).length;
  const attestationCount = [...verifiedReferences.values()].filter((record) =>
    attestationKinds.has(record.verificationKind)
  ).length;
  const verificationSummary = summarizeVerificationPolicy({
    records: verificationRecords,
  });

  return {
    proofsCount: summary.packCount,
    acceptedVerificationsCount,
    attestationCount,
    proofPacks: scopedAggregates.map((aggregate) => ({
      id: aggregate.pack.id,
      scope,
      title: aggregate.pack.title,
      verificationStatus: aggregate.verificationStatus,
      freshnessState: aggregate.freshnessState,
      artifactCount:
        scope === 'public_safe'
          ? (aggregate.publicSafe?.items.length ?? 0)
          : aggregate.ownerFull.items.length,
    })),
    verificationSummary,
  };
}

async function loadTopSkills(
  supabase: SupabaseClient,
  profileId: string
): Promise<Array<{ id: string; name: string; level: number }>> {
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
      .eq('profile_id', profileId)
      .order('level', { ascending: false })
      .limit(6);

    return (
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
      }) || []
    );
  } catch {
    return [];
  }
}

function toVisibility(profile: ProfileExportRow): ReturnType<typeof mergeVisibilityFlags> {
  return mergeVisibilityFlags(
    Array.isArray(profile.field_visibility)
      ? profile.field_visibility[0]?.field_visibility
      : profile.field_visibility?.field_visibility
  );
}

function toIndividual(profile: ProfileExportRow) {
  return Array.isArray(profile.individual_profiles)
    ? profile.individual_profiles[0]
    : profile.individual_profiles;
}

function buildTrustExportPayload(
  profile: ProfileExportRow,
  counts: {
    proofsCount: number;
    acceptedVerificationsCount: number;
    attestationCount: number;
    proofPacks: TrustExportData['proofPacks'];
    verificationSummary: ReturnType<typeof summarizeVerificationPolicy>;
  },
  skills: Array<{ id: string; name: string; level: number }>,
  visibilityOverride?: ReturnType<typeof mergeVisibilityFlags>
): TrustExportData | null {
  const visibility = visibilityOverride ?? toVisibility(profile);
  const individual = toIndividual(profile);

  const signals = buildTrustSignals(
    profile as any,
    {
      proofsCount: visibility.counts ? counts.proofsCount : 0,
      acceptedVerificationsCount: visibility.counts ? counts.acceptedVerificationsCount : 0,
      attestationCount: visibility.counts ? counts.attestationCount : 0,
    },
    counts.verificationSummary
  );

  const safeHeadline =
    visibility.header && (individual?.headline || individual?.tagline)
      ? (individual?.headline || individual?.tagline || '').trim()
      : '';

  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(profile.public_portfolio_state),
    searchIndexingEnabled: Boolean(profile.search_indexing_enabled_at),
    minimumContentMet: Boolean(
      profile.handle &&
        (profile.display_name || profile.handle) &&
        (safeHeadline || counts.proofsCount > 0 || counts.acceptedVerificationsCount > 0)
    ),
    redactMode: Boolean(individual?.redact_mode),
    hasLinkOnlyContent: false,
  });

  if (!isAccessiblePublicPortfolioState(effectiveState)) {
    return null as TrustExportData | null;
  }

  return {
    profile: {
      id: profile.id,
      handle: profile.handle,
      displayName: profile.display_name || profile.handle,
      headline: safeHeadline || 'Proofound portfolio',
      bio: visibility.bio ? individual?.bio || undefined : undefined,
      contactEmail:
        visibility.contact && visibility.workEmail
          ? individual?.work_email || undefined
          : undefined,
    },
    publication: {
      requestedState: resolveRequestedPublicPortfolioState(profile.public_portfolio_state),
      effectiveState,
      searchIndexingEnabled: Boolean(profile.search_indexing_enabled_at),
    },
    signals,
    skills: visibility.skills ? skills : [],
    proofPacks: visibility.counts ? counts.proofPacks : [],
    visibility,
  };
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
        public_portfolio_state,
        search_indexing_enabled_at,
        individual_profiles (
          headline,
          bio,
          tagline,
          skills,
          redact_mode,
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

  const counts = await loadCanonicalTrustState(profile.id, 'owner_full');
  const skills = await loadTopSkills(supabase, profile.id);
  return buildTrustExportPayload(profile as ProfileExportRow, counts, skills) ?? null;
}

export async function fetchPublicTrustExportDataByHandle(
  supabase: SupabaseClient,
  handle: string
): Promise<TrustExportData | null> {
  void supabase;

  const projection = await getPublicIndividualPortfolioProjectionByHandle(handle);
  return projection?.exportData ?? null;
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
