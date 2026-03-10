import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import {
  deriveEffectivePublicPortfolioState,
  isAccessiblePublicPortfolioState,
  isVisibleOnPublicPage,
  resolveRequestedPublicPortfolioState,
  shouldUseGenericSharePreview,
} from '@/lib/portfolio/public-contract';
import { buildTrustSignals } from '@/lib/portfolio/trust-signals';
import { mergeVisibilityFlags } from '@/lib/portfolio/visibility';
import { getPublicSiteUrl } from '@/lib/seo/public-metadata';
import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';
import {
  listCanonicalProofPackAggregatesForOwner,
  type CanonicalPublicSafeProofPackProjection,
} from '@/lib/proofs/canonical-pack';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
  type VerificationPolicySummary,
} from '@/lib/verification/policy';

export type PublicTrustExportData = {
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

export type PublicOrganizationTrustExportData = {
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

type IndividualProfileRow = {
  id: string;
  handle: string;
  display_name: string | null;
  public_portfolio_state: string | null;
  search_indexing_enabled_at: string | null;
  deleted: boolean | null;
  headline: string | null;
  bio: string | null;
  tagline: string | null;
  skills: string[] | null;
  redact_mode: boolean | null;
  verification_status: string | null;
  verification_method: string | null;
  verified_at: string | null;
  work_email: string | null;
  work_email_verified: boolean | null;
  linkedin_verification_status: string | null;
  linkedin_verified_at: string | null;
  linkedin_verification_data: Record<string, unknown> | null;
  verified: boolean | null;
  field_visibility: Record<string, unknown> | null;
  display_name_visibility: string | null;
  headline_visibility: string | null;
  skills_visibility: string | null;
};

type HistoricalSlugRow = {
  redirect_target_slug?: string | null;
  is_active?: boolean | null;
};

type OrganizationRow = {
  id: string;
  slug: string;
  display_name: string;
  public_portfolio_state: string | null;
  search_indexing_enabled_at: string | null;
  trust_status: string | null;
  trust_status_updated_at: string | null;
  website_verified_at: string | null;
  operating_region: string | null;
  verified: boolean | null;
  website: string | null;
  tagline: string | null;
  mission: string | null;
  type: string | null;
};

type OrganizationVisibilityRow = {
  display_name?: string | null;
  mission?: string | null;
};

type AssignmentSummaryRow = {
  id: string;
  role?: string | null;
  business_value?: string | null;
  location_mode?: string | null;
};

type FeaturedProof = {
  id: string;
  title: string;
  role: string;
  timeframe: string;
  outcomes: string[];
  evidence: Array<{ label: string; href: string }>;
  verifiedBy: string;
  proofPackHref: string | null;
};

type PublicProofOverview = {
  featuredProofs: FeaturedProof[];
  publicProofCount: number;
  publicSkillIds: string[];
  hasLinkOnlyContent: boolean;
  hasRevealGatedContent: boolean;
};

export type PublicIndividualPortfolioProjection = {
  profileId: string;
  handle: string;
  requestedState: ReturnType<typeof resolveRequestedPublicPortfolioState>;
  effectiveState: ReturnType<typeof deriveEffectivePublicPortfolioState>;
  shareUrl: string;
  publicDisplayName: string;
  publicHeadline: string;
  publicBio: string | null;
  publicSkills: string[];
  publicProofCount: number;
  featuredProofs: FeaturedProof[];
  visibility: ReturnType<typeof mergeVisibilityFlags>;
  individual: {
    work_email: string | null;
  };
  signals: ReturnType<typeof buildTrustSignals>;
  verificationSummary: VerificationPolicySummary;
  exportData: PublicTrustExportData;
  metadata: {
    path: string;
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    useGenericPreview: boolean;
  };
  jsonLd: {
    description: string;
  };
  minimumContentMet: boolean;
  hasLinkOnlyContent: boolean;
  hasRevealGatedContent: boolean;
};

export type PublicOrganizationPortfolioProjection = {
  organizationId: string;
  slug: string;
  requestedState: ReturnType<typeof resolveRequestedPublicPortfolioState>;
  effectiveState: ReturnType<typeof deriveEffectivePublicPortfolioState>;
  shareUrl: string;
  publicDisplayName: string;
  publicSummary: string;
  visibility: OrganizationVisibilityRow | null;
  organization: OrganizationRow;
  assignment: AssignmentSummaryRow | null;
  verificationSummary: VerificationPolicySummary;
  metadata: {
    path: string;
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    useGenericPreview: boolean;
  };
  jsonLd: {
    description: string;
  };
  exportData: PublicOrganizationTrustExportData;
  minimumContentMet: boolean;
};

const SITE_URL = getPublicSiteUrl();

function toIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function normalizeStringList(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(0, limit);
}

function normalizeValueLabels(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((value) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      if (value && typeof value === 'object' && 'label' in value) {
        const label = (value as { label?: unknown }).label;
        return typeof label === 'string' ? label.trim() : '';
      }
      return '';
    })
    .filter((entry) => entry.length > 0)
    .slice(0, 8);
}

function toOutcomeLines(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(/\n|;|\.|\u2022/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 3);
}

function prettifyProofType(value: string | null | undefined): string {
  if (!value) {
    return 'Proof';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function isValidPublicUrl(value: string | null | undefined): value is string {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function resolveSafeEvidenceUrl(input: { sourceUrl?: string | null }): string | null {
  if (isValidPublicUrl(input.sourceUrl)) {
    return input.sourceUrl;
  }

  return null;
}

function resolvePublicProofBadge(input: {
  artifactKind?: string | null;
  metadata?: Record<string, unknown> | null;
  hasAttestation: boolean;
}): string {
  if (input.hasAttestation) {
    return 'Evidence attested';
  }

  const importedFrom =
    input.metadata && typeof input.metadata.imported_from === 'string'
      ? input.metadata.imported_from
      : null;

  if (importedFrom === 'onboarding') {
    return 'Public proof link';
  }

  switch (input.artifactKind) {
    case 'credential':
      return 'Public credential';
    case 'reference':
      return 'Public reference';
    default:
      return 'Public evidence';
  }
}

function resolvePublicPortfolioName(
  profile: IndividualProfileRow,
  displayNameVisible: boolean
): string {
  if (displayNameVisible && profile.display_name?.trim()) {
    return profile.display_name.trim();
  }

  if (profile.handle?.trim()) {
    return profile.handle.trim();
  }

  return 'Proofound profile';
}

function hasDurableTrustSignal(
  profile: IndividualProfileRow,
  verificationSummary: VerificationPolicySummary
) {
  return Boolean(
    verificationSummary.publicBadges.length > 0 ||
      profile.verification_status === 'verified' ||
      profile.work_email_verified ||
      profile.linkedin_verification_status === 'verified'
  );
}

async function loadIndividualProfileByHandle(handle: string): Promise<IndividualProfileRow | null> {
  const result = await db.execute(sql`
    SELECT
      p.id,
      p.handle,
      p.display_name,
      p.public_portfolio_state,
      p.search_indexing_enabled_at,
      p.deleted,
      ip.headline,
      ip.bio,
      ip.tagline,
      ip.skills,
      ip.redact_mode,
      ip.verification_status,
      ip.verification_method,
      ip.verified_at,
      ip.work_email,
      ip.work_email_verified,
      ip.linkedin_verification_status,
      ip.linkedin_verified_at,
      ip.linkedin_verification_data,
      ip.verified,
      ip.field_visibility,
      pfv.display_name AS display_name_visibility,
      pfv.headline AS headline_visibility,
      pfv.skills AS skills_visibility
    FROM profiles p
    LEFT JOIN individual_profiles ip ON ip.user_id = p.id
    LEFT JOIN profile_field_visibility pfv ON pfv.profile_id = p.id
    WHERE p.handle = ${handle}
      AND COALESCE(p.deleted, false) = false
    LIMIT 1
  `);

  return getRows<IndividualProfileRow>(result as any)[0] ?? null;
}

async function loadHistoricalHandle(handle: string): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT redirect_target_slug, is_active
    FROM profile_handle_history
    WHERE slug = ${handle}
    LIMIT 1
  `);

  const row = getRows<HistoricalSlugRow>(result as any)[0];
  if (!row || row.is_active === true) {
    return null;
  }

  return typeof row.redirect_target_slug === 'string' ? row.redirect_target_slug : null;
}

async function loadIndividualProofOverview(profileId: string): Promise<PublicProofOverview> {
  const aggregates = await listCanonicalProofPackAggregatesForOwner(
    'individual_profile',
    profileId
  );

  const publicSkillIds = new Set<string>();
  const featuredProofsByArtifactId = new Map<string, FeaturedProof & { sortKey: string }>();

  let hasLinkOnlyContent = false;
  let hasRevealGatedContent = false;

  for (const aggregate of aggregates) {
    if (aggregate.pack.primarySubjectType === 'skill' && aggregate.pack.primarySubjectId) {
      if ((aggregate.publicSafe?.items.length ?? 0) > 0) {
        publicSkillIds.add(aggregate.pack.primarySubjectId);
      }
    }

    for (const item of aggregate.items) {
      if (item.effectiveVisibility === 'link_only' && item.artifact.revealGate === 'none') {
        hasLinkOnlyContent = true;
      }
      if (item.effectiveVisibility === 'matched_org' || item.artifact.revealGate !== 'none') {
        hasRevealGatedContent = true;
      }
    }

    const publicSafePack = aggregate.publicSafe;
    if (!publicSafePack) {
      continue;
    }

    for (const item of publicSafePack.items) {
      if (featuredProofsByArtifactId.has(item.artifactId)) {
        continue;
      }

      featuredProofsByArtifactId.set(
        item.artifactId,
        buildPublicFeaturedProof({
          pack: publicSafePack,
          item,
          verificationStatus: aggregate.verificationStatus,
          latestEvidenceAt: aggregate.latestEvidenceAt?.toISOString() ?? null,
        })
      );
    }
  }

  const featuredProofs = [...featuredProofsByArtifactId.values()]
    .sort((left, right) => right.sortKey.localeCompare(left.sortKey))
    .slice(0, 6)
    .map(({ sortKey: _sortKey, ...proof }) => proof);

  return {
    featuredProofs,
    publicProofCount: featuredProofsByArtifactId.size,
    publicSkillIds: [...publicSkillIds],
    hasLinkOnlyContent,
    hasRevealGatedContent,
  };
}

function buildPublicFeaturedProof(input: {
  pack: CanonicalPublicSafeProofPackProjection;
  item: CanonicalPublicSafeProofPackProjection['items'][number];
  verificationStatus: string;
  latestEvidenceAt: string | null;
}): FeaturedProof & { sortKey: string } {
  const evidenceUrl = resolveSafeEvidenceUrl({ sourceUrl: input.item.sourceUrl });
  const timeframeSource =
    input.item.issuedAt || input.item.expiresAt || input.latestEvidenceAt || null;

  return {
    id: input.item.artifactId,
    title: input.item.title,
    role: prettifyProofType(input.item.artifactKind),
    timeframe: formatDate(timeframeSource),
    outcomes: toOutcomeLines(input.item.description || input.pack.outcomesSummary),
    evidence: evidenceUrl ? [{ label: 'Open evidence', href: evidenceUrl }] : [],
    verifiedBy:
      input.verificationStatus === 'verified' || input.verificationStatus === 'partially_verified'
        ? 'Evidence attested'
        : resolvePublicProofBadge({
            artifactKind: input.item.artifactKind,
            metadata: null,
            hasAttestation: false,
          }),
    proofPackHref: evidenceUrl,
    sortKey: timeframeSource || '',
  };
}

function buildIndividualExportData(input: {
  profile: IndividualProfileRow;
  publicDisplayName: string;
  publicHeadline: string;
  publicBio: string | null;
  visibility: ReturnType<typeof mergeVisibilityFlags>;
  effectiveState: ReturnType<typeof deriveEffectivePublicPortfolioState>;
  publicProofCount: number;
  publicSkills: string[];
  verificationSummary: VerificationPolicySummary;
  counts: {
    verifiedSkillCount: number;
    attestationCount: number;
  };
}): PublicTrustExportData {
  const profileCompat = {
    id: input.profile.id,
    handle: input.profile.handle,
    display_name: input.profile.display_name,
    individual_profiles: {
      headline: input.profile.headline,
      bio: input.profile.bio,
      tagline: input.profile.tagline,
      verification_status: input.profile.verification_status,
      verification_method: input.profile.verification_method,
      verified_at: input.profile.verified_at,
      work_email: input.profile.work_email,
      work_email_verified: input.profile.work_email_verified,
      linkedin_verification_status: input.profile.linkedin_verification_status,
      linkedin_verified_at: input.profile.linkedin_verified_at,
      linkedin_verification_data: input.profile.linkedin_verification_data,
      verified: input.profile.verified,
    },
  };

  const signals = buildTrustSignals(
    profileCompat,
    {
      proofsCount: input.visibility.counts ? input.publicProofCount : 0,
      acceptedVerificationsCount: input.visibility.counts ? input.counts.verifiedSkillCount : 0,
      attestationCount: input.visibility.counts ? input.counts.attestationCount : 0,
    },
    input.verificationSummary
  );

  return {
    profile: {
      id: input.profile.id,
      handle: input.profile.handle,
      displayName: input.publicDisplayName,
      headline: input.publicHeadline || 'Proofound portfolio',
      bio: input.visibility.bio ? input.publicBio || undefined : undefined,
      contactEmail:
        input.visibility.contact && input.visibility.workEmail
          ? input.profile.work_email || undefined
          : undefined,
    },
    publication: {
      requestedState: resolveRequestedPublicPortfolioState(input.profile.public_portfolio_state),
      effectiveState: input.effectiveState,
      searchIndexingEnabled: Boolean(input.profile.search_indexing_enabled_at),
    },
    signals,
    skills: input.visibility.skills
      ? input.publicSkills.map((skill, index) => ({
          id: `public-skill-${index}`,
          name: skill,
          level: 5,
        }))
      : [],
    proofPacks: [],
    visibility: input.visibility,
  };
}

export async function getPublicIndividualPortfolioProjectionByHandle(
  handle: string
): Promise<PublicIndividualPortfolioProjection | null> {
  const profile = await loadIndividualProfileByHandle(handle);
  if (!profile) {
    return null;
  }

  const [proofOverview, verificationRecords] = await Promise.all([
    loadIndividualProofOverview(profile.id),
    listVerificationRecordsForOwner('individual_profile', profile.id).catch(() => []),
  ]);

  const verificationSummary = summarizeVerificationPolicy({
    records: verificationRecords,
    legacyProfile: {
      verified: profile.verified,
      verificationMethod: profile.verification_method as
        | 'veriff'
        | 'work_email'
        | 'linkedin'
        | null,
      verificationStatus: profile.verification_status as
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'failed'
        | null,
      verificationTier: null,
      verificationTierSource: null,
      workEmailCurrentlyVerified: Boolean(profile.work_email_verified),
      linkedinVerificationStatus: profile.linkedin_verification_status as
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'failed'
        | null,
      linkedinHasIdentityVerification: resolveHasLinkedInIdentityVerification(
        profile.linkedin_verification_data
      ),
    },
  });

  const visibility = mergeVisibilityFlags(profile.field_visibility);
  const publicDisplayName = resolvePublicPortfolioName(
    profile,
    isVisibleOnPublicPage(profile.display_name_visibility ?? 'public')
  );
  const publicHeadline =
    visibility.header && isVisibleOnPublicPage(profile.headline_visibility ?? 'public')
      ? (profile.headline || profile.tagline || '').trim()
      : '';
  const publicBio = visibility.bio ? profile.bio?.trim() || null : null;
  const publicSkills =
    visibility.skills && isVisibleOnPublicPage(profile.skills_visibility ?? 'public')
      ? normalizeStringList(profile.skills)
      : [];

  const minimumContentMet = Boolean(
    profile.handle &&
      publicDisplayName &&
      (publicHeadline ||
        publicBio ||
        proofOverview.publicProofCount > 0 ||
        hasDurableTrustSignal(profile, verificationSummary))
  );

  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(profile.public_portfolio_state),
    searchIndexingEnabled: Boolean(profile.search_indexing_enabled_at),
    minimumContentMet,
    redactMode: Boolean(profile.redact_mode),
    hasLinkOnlyContent: proofOverview.hasLinkOnlyContent,
    hasRevealGatedContent: proofOverview.hasRevealGatedContent,
  });

  const verifiedSkillIds = new Set(
    verificationRecords
      .filter(
        (row) =>
          row.status === 'verified' &&
          row.subjectType === 'skill' &&
          typeof row.subjectId === 'string' &&
          proofOverview.publicSkillIds.includes(row.subjectId)
      )
      .map((row) => row.subjectId as string)
  );
  const attestationCount = verificationRecords.filter(
    (row) =>
      row.status === 'verified' &&
      row.subjectType === 'skill' &&
      typeof row.subjectId === 'string' &&
      proofOverview.publicSkillIds.includes(row.subjectId) &&
      (row.verificationKind === 'skill_attestation_peer' ||
        row.verificationKind === 'skill_attestation_manager')
  ).length;

  const exportData = buildIndividualExportData({
    profile,
    publicDisplayName,
    publicHeadline,
    publicBio,
    visibility,
    effectiveState,
    publicProofCount: proofOverview.publicProofCount,
    publicSkills,
    verificationSummary,
    counts: {
      verifiedSkillCount: verifiedSkillIds.size,
      attestationCount,
    },
  });

  return {
    profileId: profile.id,
    handle: profile.handle,
    requestedState: resolveRequestedPublicPortfolioState(profile.public_portfolio_state),
    effectiveState,
    shareUrl: `${SITE_URL}/portfolio/${encodeURIComponent(profile.handle)}`,
    publicDisplayName,
    publicHeadline,
    publicBio,
    publicSkills,
    publicProofCount: proofOverview.publicProofCount,
    featuredProofs: proofOverview.featuredProofs,
    visibility,
    individual: {
      work_email: profile.work_email,
    },
    signals: exportData.signals,
    verificationSummary,
    exportData,
    metadata: {
      path: `/portfolio/${encodeURIComponent(profile.handle)}`,
      title: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound public portfolio'
        : `${publicDisplayName} | Proofound`,
      description: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable by direct link on Proofound.'
        : publicHeadline || `${publicDisplayName}'s proof-first public portfolio on Proofound.`,
      ogTitle: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound public portfolio'
        : `${publicDisplayName} on Proofound`,
      ogDescription: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable by direct link on Proofound.'
        : publicHeadline
          ? `${publicHeadline} Explore proof-backed work.`
          : `Explore ${publicDisplayName}'s proof-first public portfolio.`,
      useGenericPreview: shouldUseGenericSharePreview(effectiveState),
    },
    jsonLd: {
      description: publicBio || publicHeadline || 'Proof-first public portfolio',
    },
    minimumContentMet,
    hasLinkOnlyContent: proofOverview.hasLinkOnlyContent,
    hasRevealGatedContent: proofOverview.hasRevealGatedContent,
  };
}

export async function getHistoricalPublicProfileHandleRedirect(handle: string) {
  return loadHistoricalHandle(handle);
}

async function loadOrganizationBySlug(slug: string): Promise<OrganizationRow | null> {
  const result = await db.execute(sql`
    SELECT
      id,
      slug,
      display_name,
      public_portfolio_state,
      search_indexing_enabled_at,
      trust_status,
      trust_status_updated_at,
      website_verified_at,
      operating_region,
      verified,
      website,
      tagline,
      mission,
      type
    FROM organizations
    WHERE slug = ${slug}
    LIMIT 1
  `);

  return getRows<OrganizationRow>(result as any)[0] ?? null;
}

async function loadHistoricalOrganizationSlug(slug: string): Promise<string | null> {
  const result = await db.execute(sql`
    SELECT redirect_target_slug, is_active
    FROM organization_slug_history
    WHERE slug = ${slug}
    LIMIT 1
  `);

  const row = getRows<HistoricalSlugRow>(result as any)[0];
  if (!row || row.is_active === true) {
    return null;
  }

  return typeof row.redirect_target_slug === 'string' ? row.redirect_target_slug : null;
}

function resolvePublicOrganizationName(
  organization: OrganizationRow,
  visibility: OrganizationVisibilityRow | null
) {
  if ((visibility?.display_name ?? 'public') === 'public' && organization.display_name?.trim()) {
    return organization.display_name.trim();
  }

  if (organization.slug?.trim()) {
    return organization.slug.trim();
  }

  return 'Proofound organization';
}

export async function getPublicOrganizationPortfolioProjectionBySlug(
  slug: string
): Promise<PublicOrganizationPortfolioProjection | null> {
  const organization = await loadOrganizationBySlug(slug);
  if (!organization) {
    return null;
  }

  const [visibilityResult, assignmentResult, verificationRecords, metricsResult] =
    await Promise.all([
      db.execute(sql`
      SELECT display_name, mission
      FROM organization_field_visibility
      WHERE org_id = ${organization.id}::uuid
      LIMIT 1
    `),
      db.execute(sql`
      SELECT id, role, business_value, location_mode
      FROM assignments
      WHERE org_id = ${organization.id}::uuid
        AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `),
      listVerificationRecordsForOwner('organization', organization.id).catch(() => []),
      db.execute(sql`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM assignments
          WHERE org_id = ${organization.id}::uuid
            AND status = 'active'
        ) AS active_assignments,
        (
          SELECT COUNT(*)::int
          FROM organization_members
          WHERE org_id = ${organization.id}::uuid
            AND COALESCE(state, status, 'active') IN ('active')
        ) AS team_members
    `),
    ]);

  const visibility = getRows<OrganizationVisibilityRow>(visibilityResult as any)[0] ?? null;
  const assignment = getRows<AssignmentSummaryRow>(assignmentResult as any)[0] ?? null;
  const metrics = getRows<{ active_assignments?: number; team_members?: number }>(
    metricsResult as any
  )[0] ?? { active_assignments: 0, team_members: 0 };
  const verificationSummary = summarizeVerificationPolicy({
    records: verificationRecords,
    legacyOrganization: {
      trustStatus:
        organization.trust_status === 'unverified' ||
        organization.trust_status === 'pending' ||
        organization.trust_status === 'domain_verified' ||
        organization.trust_status === 'platform_reviewed'
          ? organization.trust_status
          : 'unverified',
      verified: organization.verified,
    },
  });

  const publicDisplayName = resolvePublicOrganizationName(organization, visibility);
  const publicSummary =
    (visibility?.mission === 'public'
      ? organization.mission?.trim()
      : organization.tagline?.trim()) ||
    organization.tagline?.trim() ||
    normalizeOrganizationWebsite(organization.website).value ||
    'Public organization trust card on Proofound.';

  const minimumContentMet = Boolean(
    organization.slug &&
      publicDisplayName &&
      (publicSummary ||
        organization.verified ||
        organization.trust_status === 'domain_verified' ||
        organization.trust_status === 'platform_reviewed' ||
        organization.website_verified_at)
  );

  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    searchIndexingEnabled: Boolean(organization.search_indexing_enabled_at),
    minimumContentMet,
  });

  return {
    organizationId: organization.id,
    slug: organization.slug,
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    effectiveState,
    shareUrl: `${SITE_URL}/portfolio/org/${encodeURIComponent(organization.slug)}`,
    publicDisplayName,
    publicSummary,
    visibility,
    organization,
    assignment,
    verificationSummary,
    metadata: {
      path: `/portfolio/org/${encodeURIComponent(organization.slug)}`,
      title: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound organization portfolio'
        : `${publicDisplayName} | Proofound`,
      description: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable organization trust card on Proofound.'
        : publicSummary,
      ogTitle: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound organization portfolio'
        : `${publicDisplayName} on Proofound`,
      ogDescription: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable organization trust card on Proofound.'
        : publicSummary,
      useGenericPreview: shouldUseGenericSharePreview(effectiveState),
    },
    jsonLd: {
      description: publicSummary,
    },
    exportData: {
      organization: {
        id: organization.id,
        slug: organization.slug,
        displayName: publicDisplayName,
        tagline: organization.tagline || undefined,
        mission: visibility?.mission === 'public' ? organization.mission || undefined : undefined,
        website: normalizeOrganizationWebsite(organization.website).value || undefined,
        type: organization.type || undefined,
        verified: Boolean(organization.verified),
        values: [],
        causes: [],
      },
      metrics: {
        activeAssignments: Number(metrics.active_assignments ?? 0),
        teamMembers: Number(metrics.team_members ?? 0),
      },
    },
    minimumContentMet,
  };
}

export async function getHistoricalOrganizationPublicSlugRedirect(slug: string) {
  return loadHistoricalOrganizationSlug(slug);
}

export async function getPublicIndividualPortfolioProjectionForPublicationState(profileId: string) {
  const result = await db.execute(sql`
    SELECT handle
    FROM profiles
    WHERE id = ${profileId}::uuid
    LIMIT 1
  `);
  const row = getRows<{ handle?: string | null }>(result as any)[0];
  if (!row?.handle) {
    return null;
  }

  return getPublicIndividualPortfolioProjectionByHandle(row.handle);
}

export async function getPublicOrganizationPortfolioProjectionForPublicationState(
  organizationId: string
) {
  const result = await db.execute(sql`
    SELECT slug
    FROM organizations
    WHERE id = ${organizationId}::uuid
    LIMIT 1
  `);
  const row = getRows<{ slug?: string | null }>(result as any)[0];
  if (!row?.slug) {
    return null;
  }

  return getPublicOrganizationPortfolioProjectionBySlug(row.slug);
}

export function isAccessiblePublicProjection(
  projection:
    | PublicIndividualPortfolioProjection
    | PublicOrganizationPortfolioProjection
    | null
    | undefined
) {
  return Boolean(projection && isAccessiblePublicPortfolioState(projection.effectiveState));
}
