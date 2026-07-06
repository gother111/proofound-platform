import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { isMockSupabaseEnabled, visualFixturesRuntimeAllowed } from '@/lib/env';
import { normalizeOrganizationWebsite } from '@/lib/organizations/normalizeWebsite';
import { getVerifiedOrganizationDomainPath } from '@/lib/organizations/trust-profile';
import {
  PORTFOLIO_EXPORT_SCHEMA_VERSION,
  type IndividualPortfolioExportData,
  type OrganizationPortfolioExportData,
  type PortfolioAssignmentSnapshot,
} from '@/lib/portfolio/export-contract';
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
import { sanitizePrivacyPreflightTextForPublic } from '@/lib/privacy/preflight-rules';
import {
  hasPrimaryAnchorContext,
  listCanonicalProofPackAggregatesForOwner,
  type CanonicalProofPackAggregate,
  type CanonicalPublicSafeProofPackProjection,
} from '@/lib/proofs/canonical-pack';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
  type VerificationPolicySummary,
} from '@/lib/verification/policy';

export type PublicTrustExportData = IndividualPortfolioExportData;
export type PublicOrganizationTrustExportData = OrganizationPortfolioExportData;

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
  working_context: string | null;
  type: string | null;
};

type OrganizationAssignmentRow = {
  id: string;
  role: string | null;
  engagement_type: string | null;
  business_value: string | null;
  description: string | null;
  expected_impact: string | null;
  updated_at: string | null;
};

type OrganizationAssignmentOutcomeRow = {
  title: string | null;
  description: string | null;
};

type OrganizationVisibilityRow = {
  display_name?: string | null;
  mission?: string | null;
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
  publicProofPacks: PublicTrustExportData['proofPacks'];
  publicProofCount: number;
  verifiedPublicProofPackCount: number;
  publicSkillIds: string[];
  traceableSummaryBuckets: Record<TraceableProfileSummarySegment['key'], SummaryTokenBucket[]>;
  hasLinkOnlyContent: boolean;
  hasRevealGatedContent: boolean;
  hasPrivateContent: boolean;
};

export type TraceableProfileSummarySource = {
  id: string;
  label: string;
  detail: string | null;
};

export type TraceableProfileSummarySegment = {
  key: 'scale' | 'focus' | 'context';
  label: 'Scale' | 'Focus' | 'Context';
  value: string;
  state: 'ready' | 'fallback';
  sources: TraceableProfileSummarySource[];
};

export type TraceableProfileSummary = {
  provenanceLabel: string;
  segments: TraceableProfileSummarySegment[];
  hasEnoughData: boolean;
};

const MOCK_ORG_ID = '99999999-9999-4999-9999-999999999999';
const MOCK_ORG_SLUG = 'test-org';
const MOCK_LONG_ORG_ID = '99999999-9999-4999-9999-999999999998';
const MOCK_LONG_ORG_SLUG = 'long-org';
const MOCK_PROFILE_ID = '77777777-7777-4777-8777-777777777777';
const MOCK_PROFILE_HANDLE = 'demo-proofound';
const MOCK_PROFILE_HANDLE_ALIASES = ['mock-individual'] as const;

function isMockPublicIndividualHandle(handle: string) {
  return (
    handle === MOCK_PROFILE_HANDLE ||
    MOCK_PROFILE_HANDLE_ALIASES.includes(handle as (typeof MOCK_PROFILE_HANDLE_ALIASES)[number])
  );
}

function visualPublicProjectionFixturesEnabled() {
  return (
    isMockSupabaseEnabled() &&
    process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
    visualFixturesRuntimeAllowed()
  );
}

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
  verifiedPublicProofPackCount: number;
  featuredProofs: FeaturedProof[];
  traceableSummary: TraceableProfileSummary;
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

export type PublicIndividualPortfolioAccessResult =
  | {
      status: 'missing';
      projection: null;
    }
  | {
      status: 'unavailable' | 'accessible';
      projection: PublicIndividualPortfolioProjection;
    };

export type PublicOrganizationPortfolioProjection = {
  organizationId: string;
  slug: string;
  requestedState: ReturnType<typeof resolveRequestedPublicPortfolioState>;
  effectiveState: ReturnType<typeof deriveEffectivePublicPortfolioState>;
  shareUrl: string;
  publicDisplayName: string;
  publicSummary: string;
  verifiedDomainPath: string | null;
  visibility: OrganizationVisibilityRow | null;
  organization: OrganizationRow;
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
  assignmentSnapshot: PortfolioAssignmentSnapshot | null;
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

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function titleCase(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
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
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const search = parsed.search.toLowerCase();

    const hostLooksPrivate =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.includes('supabase') ||
      hostname.includes('amazonaws.com') ||
      hostname.includes('storage.googleapis.com') ||
      hostname.includes('blob.core.windows.net');
    const pathLooksPrivate =
      pathname.includes('/storage/v1/object/sign/') ||
      pathname.includes('/storage/v1/object/authenticated/') ||
      pathname.includes('/private/') ||
      pathname.includes('/user-uploads-private/') ||
      pathname.includes('/user-uploads-quarantine/');
    const searchLooksSigned =
      search.includes('x-amz-signature=') ||
      search.includes('x-goog-signature=') ||
      search.includes('signature=') ||
      search.includes('token=') ||
      search.includes('expires=') ||
      search.includes('sig=');

    return !hostLooksPrivate && !pathLooksPrivate && !searchLooksSigned;
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

function resolvePublicProofPackContextLabel(input: {
  pack: {
    primarySubjectType?: string | null;
    contextJson?: unknown;
    metadata?: unknown;
  };
  hiddenContextTerms?: string[];
}): string | null {
  const contextJson = toRecord(input.pack.contextJson);
  const metadata = toRecord(input.pack.metadata);
  const fallbackLabel =
    typeof input.pack.primarySubjectType === 'string' && input.pack.primarySubjectType.trim()
      ? titleCase(input.pack.primarySubjectType)
      : null;
  const explicitLabel =
    (typeof metadata.topic_label === 'string' && metadata.topic_label.trim()) ||
    (typeof contextJson.topicLabel === 'string' && contextJson.topicLabel.trim()) ||
    (typeof contextJson.primaryAnchorLabel === 'string' && contextJson.primaryAnchorLabel.trim()) ||
    null;

  if (explicitLabel) {
    const sanitized = sanitizePublicText(explicitLabel, input.hiddenContextTerms ?? []);
    return sanitized && !sanitized.includes('[redacted') ? sanitized : fallbackLabel;
  }

  return fallbackLabel;
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

function resolvePublicEvidenceTitle(input: { title: string; artifactDisplayName?: string | null }) {
  const safeDisplayName = sanitizePublicEvidenceLabel(input.artifactDisplayName) || null;
  const title = sanitizePublicEvidenceLabel(input.title) || '';

  if (!safeDisplayName) {
    return title;
  }

  if (!title) {
    return safeDisplayName;
  }

  if (title.toLowerCase().startsWith('uploaded ')) {
    return safeDisplayName;
  }

  return title;
}

function fallbackPublicEvidenceLabel(value: string) {
  if (/\.pdf\b/i.test(value)) {
    return 'Uploaded PDF document';
  }

  if (/\.(png|jpe?g|webp)\b/i.test(value)) {
    return 'Uploaded image';
  }

  if (/\.(docx?|txt|md)\b/i.test(value)) {
    return 'Uploaded document';
  }

  return 'Uploaded document';
}

function sanitizePublicEvidenceLabel(value: string | null | undefined) {
  const label = value?.trim() ?? '';
  if (!label) {
    return '';
  }

  if (
    /[\\/]/.test(label) ||
    /^https?:\/\//i.test(label) ||
    /\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(label) ||
    /\b\S+\.(pdf|docx?|txt|md|png|jpe?g|webp|csv|xlsx?)\b/i.test(label)
  ) {
    return fallbackPublicEvidenceLabel(label);
  }

  return label;
}

function collectHiddenContextTerms(value: unknown): string[] {
  const record = toRecord(value);
  const terms: string[] = [];

  for (const key of [
    'exactLocation',
    'exact_location',
    'clientName',
    'client_name',
    'employerName',
    'employer_name',
  ]) {
    const entry = record[key];
    if (typeof entry === 'string' && entry.trim()) {
      terms.push(entry.trim());
    }
  }

  for (const key of [
    'employerNames',
    'employer_names',
    'clientNames',
    'client_names',
    'schoolNames',
    'school_names',
  ]) {
    const entry = record[key];
    if (Array.isArray(entry)) {
      for (const term of entry) {
        if (typeof term === 'string' && term.trim()) {
          terms.push(term.trim());
        }
      }
    }
  }

  return terms;
}

type SummaryTokenField = {
  label: string;
  keys: string[];
};

type SummaryTokenBucket = {
  source: TraceableProfileSummarySource;
  values: string[];
};

const TRACEABLE_SUMMARY_FIELDS: Record<TraceableProfileSummarySegment['key'], SummaryTokenField[]> =
  {
    scale: [
      {
        label: 'Team size',
        keys: ['teamSize', 'team_size', 'contextTeamSize', 'context_team_size'],
      },
      {
        label: 'Budget scope',
        keys: ['budgetScope', 'budget_scope', 'contextBudgetScope', 'context_budget_scope'],
      },
      {
        label: 'Customer volume',
        keys: [
          'customerVolume',
          'customer_volume',
          'contextCustomerVolume',
          'context_customer_volume',
        ],
      },
      {
        label: 'Company size',
        keys: ['companySize', 'company_size', 'contextCompanySize', 'context_company_size'],
      },
      {
        label: 'Project scope',
        keys: ['projectScope', 'project_scope', 'contextProjectScope', 'context_project_scope'],
      },
    ],
    focus: [
      {
        label: 'Work area',
        keys: ['focusArea', 'focus_area', 'contextFocusArea', 'context_focus_area'],
      },
      {
        label: 'Capability pattern',
        keys: [
          'capabilityPattern',
          'capability_pattern',
          'capabilityPatterns',
          'capability_patterns',
        ],
      },
      {
        label: 'Work area',
        keys: ['workArea', 'work_area', 'workAreas', 'work_areas'],
      },
      {
        label: 'Role context',
        keys: ['roleContext', 'role_context'],
      },
    ],
    context: [
      {
        label: 'Industry',
        keys: [
          'industry',
          'industryDomain',
          'industry_domain',
          'contextIndustryDomain',
          'context_industry_domain',
        ],
      },
      {
        label: 'Operating environment',
        keys: [
          'operatingEnvironment',
          'operating_environment',
          'contextOperatingEnvironment',
          'context_operating_environment',
        ],
      },
      {
        label: 'Scope',
        keys: ['scope', 'contextScope', 'context_scope', 'localGlobalScope', 'local_global_scope'],
      },
      {
        label: 'Company stage',
        keys: ['companyStage', 'company_stage', 'contextCompanyStage', 'context_company_stage'],
      },
      {
        label: 'Market type',
        keys: ['marketType', 'market_type', 'marketModel', 'market_model', 'b2bB2c', 'b2b_b2c'],
      },
      {
        label: 'Regulatory context',
        keys: [
          'regulatedContext',
          'regulated_context',
          'regulatedNonRegulated',
          'regulated_non_regulated',
          'regulation',
        ],
      },
    ],
  };

const TRACEABLE_SUMMARY_FALLBACKS: Record<TraceableProfileSummarySegment['key'], string> = {
  scale:
    'Add public-safe scale tokens such as team size, customer volume, budget scope, company size, or project scope.',
  focus: 'Add work-area, capability-pattern, or proof-supported skill tokens.',
  context:
    'Add public-safe context tokens such as industry, operating environment, stage, scope, market type, or regulated context.',
};

const TRACEABLE_SUMMARY_LABELS: Record<
  TraceableProfileSummarySegment['key'],
  TraceableProfileSummarySegment['label']
> = {
  scale: 'Scale',
  focus: 'Focus',
  context: 'Context',
};

function normalizeSummaryTokenValue(value: unknown): string[] {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return [String(value)];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeSummaryTokenValue(entry));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return normalizeSummaryTokenValue(record.label ?? record.name ?? record.value);
  }

  return [];
}

function collectSummaryFieldTokens(input: {
  record: Record<string, unknown>;
  fields: SummaryTokenField[];
  hiddenContextTerms: string[];
}): string[] {
  const tokens: string[] = [];

  for (const field of input.fields) {
    for (const key of field.keys) {
      const values = normalizeSummaryTokenValue(input.record[key]);
      for (const value of values) {
        const sanitized = sanitizePublicText(value, input.hiddenContextTerms);
        if (!sanitized || sanitized.includes('[redacted')) {
          continue;
        }
        tokens.push(`${field.label}: ${sanitized}`);
      }
    }
  }

  return dedupeStrings(tokens);
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}

function buildTraceableProfileSummary(input: {
  bucketsBySegment: Record<TraceableProfileSummarySegment['key'], SummaryTokenBucket[]>;
  publicSkills: string[];
}): TraceableProfileSummary {
  const skillsFallback = input.publicSkills.slice(0, 4);
  const segments: TraceableProfileSummarySegment[] = (['scale', 'focus', 'context'] as const).map(
    (key) => {
      const buckets = input.bucketsBySegment[key] ?? [];
      let values = dedupeStrings(buckets.flatMap((bucket) => bucket.values)).slice(0, 4);
      let sources = buckets
        .filter((bucket) => bucket.values.length > 0)
        .map((bucket) => bucket.source)
        .slice(0, 3);

      if (key === 'focus' && values.length === 0 && skillsFallback.length > 0) {
        values = [`Proof-supported skills: ${skillsFallback.join(', ')}`];
        sources = [
          {
            id: 'public-proof-supported-skills',
            label: 'Public proof records',
            detail: 'Proof-supported skill links',
          },
        ];
      }

      const state: TraceableProfileSummarySegment['state'] =
        values.length > 0 ? 'ready' : 'fallback';

      return {
        key,
        label: TRACEABLE_SUMMARY_LABELS[key],
        value: values.length > 0 ? values.join(' · ') : TRACEABLE_SUMMARY_FALLBACKS[key],
        state,
        sources,
      };
    }
  );

  return {
    provenanceLabel: 'Generated from public-safe proof records and context tokens',
    segments,
    hasEnoughData: segments.some((segment) => segment.state === 'ready'),
  };
}

function sanitizePublicText(value: string | null | undefined, hiddenTerms: string[] = []) {
  return sanitizePrivacyPreflightTextForPublic(value, hiddenTerms);
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

function collectPublicSafeSkillIds(aggregate: {
  items: Array<{ artifact: { subjectType: string; subjectId: string | null } }>;
  verificationReferences: Array<{ subjectType: string; subjectId: string }>;
}) {
  const skillIds = new Set<string>();

  for (const item of aggregate.items) {
    if (item.artifact.subjectType === 'skill' && typeof item.artifact.subjectId === 'string') {
      skillIds.add(item.artifact.subjectId);
    }
  }

  for (const record of aggregate.verificationReferences) {
    if (record.subjectType === 'skill' && typeof record.subjectId === 'string') {
      skillIds.add(record.subjectId);
    }
  }

  return skillIds;
}

const PUBLIC_READY_VERIFICATION_KINDS = new Set([
  'skill_attestation_peer',
  'skill_attestation_manager',
  'impact_attestation',
  'org_domain',
  'org_registry_manual',
  'platform_manual_review',
]);

function hasAcceptedPublicReadyVerification(aggregate: CanonicalProofPackAggregate) {
  return aggregate.verificationReferences.some((record) => {
    if (!PUBLIC_READY_VERIFICATION_KINDS.has(record.verificationKind)) {
      return false;
    }

    if (record.status !== 'verified' || record.integrityStatus !== 'clear') {
      return false;
    }

    if (record.disputeState === 'open' || record.disputeState === 'under_review') {
      return false;
    }

    if (record.proofArtifactId) {
      return aggregate.items.some((item) => item.artifact.id === record.proofArtifactId);
    }

    const verifiesLinkedItemSubject = aggregate.items.some(
      (item) =>
        item.artifact.subjectType === record.subjectType &&
        item.artifact.subjectId === record.subjectId
    );
    if (verifiesLinkedItemSubject) {
      return true;
    }

    return (
      record.subjectType === aggregate.pack.primarySubjectType &&
      record.subjectId === aggregate.pack.primarySubjectId
    );
  });
}

async function loadPublicSkillLabels(profileId: string, skillIds: string[]): Promise<string[]> {
  if (skillIds.length === 0) {
    return [];
  }

  const result = await db.execute(sql`
    SELECT
      s.id,
      COALESCE(st.name_i18n ->> 'en', st.name_i18n ->> 'default', s.skill_code, s.skill_id) AS name
    FROM skills s
    LEFT JOIN skills_taxonomy st ON st.code = s.skill_code
    WHERE s.profile_id = ${profileId}
      AND s.id IN (${sql.join(
        skillIds.map((skillId) => sql`${skillId}::uuid`),
        sql`, `
      )})
    ORDER BY s.level DESC NULLS LAST, s.created_at DESC
  `);

  return getRows<{ name: string | null }>(result as any)
    .map((row) => (typeof row.name === 'string' ? row.name.trim() : ''))
    .filter((name) => name.length > 0);
}

async function loadIndividualProofOverview(profileId: string): Promise<PublicProofOverview> {
  const aggregates = await listCanonicalProofPackAggregatesForOwner(
    'individual_profile',
    profileId
  );

  const publicSkillIds = new Set<string>();
  const featuredProofsByArtifactId = new Map<string, FeaturedProof & { sortKey: string }>();
  const publicProofPacks: PublicTrustExportData['proofPacks'] = [];
  const traceableSummaryBuckets: Record<
    TraceableProfileSummarySegment['key'],
    SummaryTokenBucket[]
  > = {
    scale: [],
    focus: [],
    context: [],
  };
  let verifiedPublicProofPackCount = 0;

  let hasLinkOnlyContent = false;
  let hasRevealGatedContent = false;
  let hasPrivateContent = false;

  for (const aggregate of aggregates) {
    if (aggregate.pack.packKind !== 'verification_bundle') {
      continue;
    }

    if (!hasPrimaryAnchorContext(aggregate.pack)) {
      continue;
    }

    if ((aggregate.publicSafe?.items.length ?? 0) > 0) {
      for (const skillId of collectPublicSafeSkillIds(aggregate)) {
        publicSkillIds.add(skillId);
      }
    }

    for (const item of aggregate.items) {
      if (item.effectiveVisibility === 'link_only' && item.artifact.revealGate === 'none') {
        hasLinkOnlyContent = true;
      }
      if (item.effectiveVisibility === 'matched_org' || item.artifact.revealGate !== 'none') {
        hasRevealGatedContent = true;
      }
      if (
        item.effectiveVisibility === 'owner_only' ||
        item.effectiveVisibility === 'internal_only'
      ) {
        hasPrivateContent = true;
      }
    }

    const publicSafePack = aggregate.publicSafe;
    if (!publicSafePack) {
      continue;
    }
    const hiddenContextTerms = [
      ...collectHiddenContextTerms(aggregate.pack.contextJson),
      ...collectHiddenContextTerms(aggregate.pack.metadata),
    ];
    const publicPackTitle =
      sanitizePublicText(publicSafePack.contract.title, hiddenContextTerms) ||
      sanitizePublicText(publicSafePack.title, hiddenContextTerms) ||
      sanitizePublicText(aggregate.pack.title, hiddenContextTerms) ||
      'Proof record';
    const publicPackContextLabel = resolvePublicProofPackContextLabel({
      pack: aggregate.pack,
      hiddenContextTerms,
    });
    const source = {
      id: aggregate.pack.id,
      label: publicPackTitle,
      detail: publicPackContextLabel,
    };
    const summaryTokenRecord = {
      ...toRecord(aggregate.pack.contextJson),
      ...toRecord(aggregate.pack.metadata),
      roleContext: publicSafePack.contract.roleContext ?? aggregate.pack.roleContext ?? null,
      role_context: publicSafePack.contract.roleContext ?? aggregate.pack.roleContext ?? null,
    };

    for (const key of ['scale', 'focus', 'context'] as const) {
      const values = collectSummaryFieldTokens({
        record: summaryTokenRecord,
        fields: TRACEABLE_SUMMARY_FIELDS[key],
        hiddenContextTerms,
      });
      if (values.length > 0) {
        traceableSummaryBuckets[key].push({ source, values });
      }
    }

    if (hasAcceptedPublicReadyVerification(aggregate)) {
      verifiedPublicProofPackCount += 1;
    }

    publicProofPacks.push({
      id: aggregate.pack.id,
      scope: 'public_safe',
      status: publicSafePack.contract.status,
      title: publicPackTitle,
      summary:
        sanitizePublicText(publicSafePack.contract.primaryClaim.statement, hiddenContextTerms) ||
        '',
      ownershipStatement:
        sanitizePublicText(publicSafePack.contract.ownershipStatement, hiddenContextTerms) || '',
      evidenceSummary: sanitizePublicText(
        publicSafePack.evidenceSummary ?? aggregate.pack.evidenceSummary ?? null,
        hiddenContextTerms
      ),
      outcomesSummary: sanitizePublicText(
        publicSafePack.outcomesSummary ?? aggregate.pack.outcomesSummary ?? null,
        hiddenContextTerms
      ),
      verificationStatus: aggregate.verificationStatus,
      verificationSummary:
        sanitizePublicText(
          publicSafePack.contract.verificationSummary.summary,
          hiddenContextTerms
        ) || '',
      freshnessState: aggregate.freshnessState,
      schemaVersion: publicSafePack.contract.schemaVersion,
      artifactCount: publicSafePack.items.length,
      contextLabel: publicPackContextLabel,
      selectedEvidence: publicSafePack.items.slice(0, 3).map((item) => ({
        title: resolvePublicEvidenceTitle({
          title: item.title,
          artifactDisplayName: item.artifactDisplayName ?? null,
        }),
        artifactDisplayName: sanitizePublicEvidenceLabel(item.artifactDisplayName) || null,
        href: resolveSafeEvidenceUrl({ sourceUrl: item.sourceUrl }),
        artifactKind: item.artifactKind ?? null,
        issuedAt: item.issuedAt ?? null,
        description: sanitizePublicText(item.description, hiddenContextTerms),
        semanticsNote: sanitizePublicText(item.semanticsNote, hiddenContextTerms) || '',
      })),
    });

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
          hiddenContextTerms,
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
    publicProofPacks,
    publicProofCount: featuredProofsByArtifactId.size,
    verifiedPublicProofPackCount,
    publicSkillIds: [...publicSkillIds],
    traceableSummaryBuckets,
    hasLinkOnlyContent,
    hasRevealGatedContent,
    hasPrivateContent,
  };
}

function buildPublicFeaturedProof(input: {
  pack: CanonicalPublicSafeProofPackProjection;
  item: CanonicalPublicSafeProofPackProjection['items'][number];
  verificationStatus: string;
  latestEvidenceAt: string | null;
  hiddenContextTerms?: string[];
}): FeaturedProof & { sortKey: string } {
  const evidenceUrl = resolveSafeEvidenceUrl({ sourceUrl: input.item.sourceUrl });
  const timeframeSource =
    input.item.issuedAt || input.item.expiresAt || input.latestEvidenceAt || null;
  const proofTitle = resolvePublicEvidenceTitle({
    title: input.item.title,
    artifactDisplayName: input.item.artifactDisplayName ?? null,
  });

  return {
    id: input.item.artifactId,
    title: proofTitle,
    role: prettifyProofType(input.item.artifactKind),
    timeframe: formatDate(timeframeSource),
    outcomes: toOutcomeLines(
      sanitizePublicText(
        input.item.description || input.pack.outcomesSummary,
        input.hiddenContextTerms ?? []
      )
    ),
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
  };
  proofPacks: PublicTrustExportData['proofPacks'];
  shareUrl: string;
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
    },
    input.verificationSummary
  );

  return {
    schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
    surface: 'individual_public',
    exportedAt: new Date().toISOString(),
    shareUrl: input.shareUrl,
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
      searchIndexingEnabled:
        Boolean(input.profile.search_indexing_enabled_at) &&
        input.effectiveState === 'public_indexable',
    },
    signals,
    skills: input.visibility.skills
      ? input.publicSkills.map((skill, index) => ({
          id: `public-skill-${index}`,
          name: skill,
          level: 5,
        }))
      : [],
    proofPacks: input.proofPacks,
    visibility: input.visibility,
  };
}

function buildProofFirstDescription(input: {
  publicDisplayName: string;
  publicHeadline: string;
  publicBio: string | null;
  proofPacks: PublicTrustExportData['proofPacks'];
}): string {
  const leadPack = input.proofPacks[0];
  if (leadPack) {
    const leadDetail =
      leadPack.outcomesSummary?.trim() ||
      leadPack.summary?.trim() ||
      leadPack.evidenceSummary?.trim() ||
      null;

    if (leadDetail) {
      return `${input.publicDisplayName}: ${leadDetail}`;
    }

    if (leadPack.contextLabel) {
      return `${input.publicDisplayName}: Proof-backed work in ${leadPack.contextLabel}.`;
    }
  }

  return (
    input.publicBio ||
    input.publicHeadline ||
    `${input.publicDisplayName}'s proof-first Public Page on Proofound.`
  );
}

function buildMockPublicIndividualPortfolioProjection(): PublicIndividualPortfolioProjection {
  const handle = MOCK_PROFILE_HANDLE;
  const shareUrl = `${SITE_URL}/portfolio/${encodeURIComponent(handle)}`;
  const requestedState = resolveRequestedPublicPortfolioState('public_link_only');
  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState,
    searchIndexingEnabled: false,
    minimumContentMet: true,
  });
  const publicDisplayName = 'Mika Andersson';
  const publicHeadline = 'Evidence-led operations and service design lead';
  const publicBio =
    'I help teams turn messy operational signals into calmer workflows, clearer proof, and decisions that can be explained without exposing private context.';
  const publicSkills = [
    'Service design',
    'Operations research',
    'Evidence synthesis',
    'Stakeholder facilitation',
    'Privacy-safe reporting',
    'Product discovery',
  ];
  const verificationSummary = summarizeVerificationPolicy({
    records: [],
    legacyProfile: {
      verified: true,
      verificationMethod: 'veriff',
      verificationStatus: 'verified',
      verificationTier: null,
      verificationTierSource: null,
      workEmailCurrentlyVerified: true,
      linkedinVerificationStatus: 'verified',
      linkedinHasIdentityVerification: true,
    },
  });
  const signals = buildTrustSignals(
    {
      id: MOCK_PROFILE_ID,
      handle,
      display_name: publicDisplayName,
      individual_profiles: {
        headline: publicHeadline,
        bio: publicBio,
        verification_status: 'verified',
        verification_method: 'veriff',
        verified_at: '2026-03-11T00:00:00.000Z',
        work_email: 'mika@demo-proofound.example',
        work_email_verified: true,
        linkedin_verification_status: 'verified',
        linkedin_verified_at: '2026-03-11T00:00:00.000Z',
        linkedin_verification_data: { identity_verified: true },
        verified: true,
      },
    },
    { proofsCount: 2, acceptedVerificationsCount: 2 },
    verificationSummary
  );
  const proofPacks: PublicTrustExportData['proofPacks'] = [
    {
      id: 'visual-public-pack-operations',
      scope: 'public_safe',
      status: 'published',
      title: 'Reduced handoff ambiguity across a partner operations workflow',
      summary:
        'Mapped repeated service handoff failures into a concise proof trail that reviewers could inspect without seeing private customer data.',
      ownershipStatement:
        'Led discovery, synthesized evidence, and facilitated the operating rhythm with design, support, and delivery partners.',
      evidenceSummary:
        'Public-safe artifacts include a decision memo, anonymized journey map, and rollout checklist.',
      outcomesSummary:
        'Cut review back-and-forth by 38% and made the next operational decision clear in every weekly review.',
      verificationStatus: 'verified',
      verificationSummary: 'Evidence attested by a former manager and a cross-functional peer.',
      freshnessState: 'current',
      schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
      artifactCount: 3,
      contextLabel: 'Operations workflow redesign',
      selectedEvidence: [
        {
          title: 'Public-safe decision memo',
          artifactDisplayName: 'Decision memo',
          href: 'https://example.com/proofound/demo/decision-memo',
          artifactKind: 'link',
          issuedAt: '2026-02-04T00:00:00.000Z',
          description:
            'Summarizes the choices, constraints, and measurable result without exposing internal records.',
          semanticsNote: 'Supporting evidence only, not a full background check.',
        },
        {
          title: 'Anonymized workflow map',
          artifactDisplayName: 'Workflow map',
          href: null,
          artifactKind: 'document',
          issuedAt: '2026-02-12T00:00:00.000Z',
          description:
            'Shows the before/after handoff structure and the proof points used during review.',
          semanticsNote: 'Public-safe extract; source workspace remains private.',
        },
      ],
    },
    {
      id: 'visual-public-pack-research',
      scope: 'public_safe',
      status: 'published',
      title: 'Built a lightweight research evidence system for assignment reviews',
      summary:
        'Created a repeatable way to compare claims, artifacts, and reviewer notes without asking participants to overshare.',
      ownershipStatement:
        'Designed the evidence taxonomy, drafted reviewer language, and tested the flow with a small review panel.',
      evidenceSummary:
        'Public-safe artifacts include a rubric extract and participant-facing explanation copy.',
      outcomesSummary:
        'Reviewers reported clearer tradeoffs and fewer generic participant-fit notes.',
      verificationStatus: 'partially_verified',
      verificationSummary: 'Peer-attested with public artifacts available.',
      freshnessState: 'recent',
      schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
      artifactCount: 2,
      contextLabel: 'Proof-first assignment-review research',
      selectedEvidence: [
        {
          title: 'Rubric extract',
          artifactDisplayName: 'Review rubric',
          href: 'https://example.com/proofound/demo/rubric',
          artifactKind: 'link',
          issuedAt: '2026-01-18T00:00:00.000Z',
          description: 'A short public extract of the rubric used to separate claims from proof.',
          semanticsNote: 'Supports the claim; does not reveal private reviewer notes.',
        },
      ],
    },
  ];
  const traceableSummary: TraceableProfileSummary = {
    provenanceLabel: 'Generated from public-safe Proof Packs and context tokens',
    hasEnoughData: true,
    segments: [
      {
        key: 'scale',
        label: 'Scale',
        value: 'Cross-functional workflows with 8-30 reviewers and operators',
        state: 'ready',
        sources: [
          {
            id: 'visual-public-pack-operations',
            label: 'Proof Pack: Operations workflow redesign',
            detail: 'Review rhythm and handoff clarity',
          },
        ],
      },
      {
        key: 'focus',
        label: 'Focus',
        value: 'Turning ambiguous work evidence into calmer decisions',
        state: 'ready',
        sources: [
          {
            id: 'visual-public-pack-research',
            label: 'Proof Pack: Proof-first assignment-review research',
            detail: 'Evidence taxonomy and reviewer language',
          },
        ],
      },
      {
        key: 'context',
        label: 'Context',
        value: 'Privacy-aware teams that need trust without oversharing',
        state: 'ready',
        sources: [
          {
            id: 'visual-public-pack-operations',
            label: 'Proof Pack: Operations workflow redesign',
            detail: 'Public-safe decision memo',
          },
        ],
      },
    ],
  };
  const visibility = mergeVisibilityFlags({
    bio: true,
    contact: false,
    workEmail: false,
    skills: true,
    counts: true,
    proofBar: true,
    header: true,
    identity: true,
    linkedin: true,
  });
  const exportData: PublicTrustExportData = {
    schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
    surface: 'individual_public',
    exportedAt: '2026-03-11T00:00:00.000Z',
    shareUrl,
    profile: {
      id: MOCK_PROFILE_ID,
      handle,
      displayName: publicDisplayName,
      headline: publicHeadline,
      bio: publicBio,
    },
    publication: {
      requestedState,
      effectiveState,
      searchIndexingEnabled: false,
    },
    signals,
    skills: publicSkills.map((skill, index) => ({
      id: `visual-public-skill-${index + 1}`,
      name: skill,
      level: 5,
    })),
    proofPacks,
    visibility,
  };
  const proofFirstDescription = buildProofFirstDescription({
    publicDisplayName,
    publicHeadline,
    publicBio,
    proofPacks,
  });

  return {
    profileId: MOCK_PROFILE_ID,
    handle,
    requestedState,
    effectiveState,
    shareUrl,
    publicDisplayName,
    publicHeadline,
    publicBio,
    publicSkills,
    publicProofCount: 2,
    verifiedPublicProofPackCount: 1,
    featuredProofs: [],
    traceableSummary,
    visibility,
    individual: {
      work_email: null,
    },
    signals,
    verificationSummary,
    exportData,
    metadata: {
      path: `/portfolio/${encodeURIComponent(handle)}`,
      title: `${publicDisplayName} | Proofound`,
      description: proofFirstDescription,
      ogTitle: `${publicDisplayName} on Proofound`,
      ogDescription: proofFirstDescription,
      useGenericPreview: shouldUseGenericSharePreview(effectiveState),
    },
    jsonLd: {
      description: proofFirstDescription,
    },
    minimumContentMet: true,
    hasLinkOnlyContent: true,
    hasRevealGatedContent: false,
  };
}

export async function getPublicIndividualPortfolioProjectionByHandle(
  handle: string
): Promise<PublicIndividualPortfolioProjection | null> {
  if (visualPublicProjectionFixturesEnabled() && isMockPublicIndividualHandle(handle)) {
    return buildMockPublicIndividualPortfolioProjection();
  }

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
      ? await loadPublicSkillLabels(profile.id, proofOverview.publicSkillIds)
      : [];
  const traceableSummary = buildTraceableProfileSummary({
    bucketsBySegment: proofOverview.traceableSummaryBuckets,
    publicSkills,
  });

  const minimumContentMet = Boolean(
    profile.handle && publicDisplayName && proofOverview.publicProofCount > 0
  );

  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(profile.public_portfolio_state),
    searchIndexingEnabled: Boolean(profile.search_indexing_enabled_at),
    allowSearchIndexing: false,
    minimumContentMet,
    redactMode: Boolean(profile.redact_mode),
    hasLinkOnlyContent: proofOverview.hasLinkOnlyContent,
    hasRevealGatedContent: proofOverview.hasRevealGatedContent,
    hasPrivateContent: proofOverview.hasPrivateContent,
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
    },
    proofPacks: proofOverview.publicProofPacks,
    shareUrl: `${SITE_URL}/portfolio/${encodeURIComponent(profile.handle)}`,
  });
  const proofFirstDescription = buildProofFirstDescription({
    publicDisplayName,
    publicHeadline,
    publicBio,
    proofPacks: proofOverview.publicProofPacks,
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
    verifiedPublicProofPackCount: proofOverview.verifiedPublicProofPackCount,
    featuredProofs: proofOverview.featuredProofs,
    traceableSummary,
    visibility,
    individual: {
      work_email: visibility.contact && visibility.workEmail ? profile.work_email : null,
    },
    signals: exportData.signals,
    verificationSummary,
    exportData,
    metadata: {
      path: `/portfolio/${encodeURIComponent(profile.handle)}`,
      title: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound Public Page'
        : `${publicDisplayName} | Proofound`,
      description: shouldUseGenericSharePreview(effectiveState)
        ? 'A proof snapshot shared by direct link on Proofound.'
        : proofFirstDescription,
      ogTitle: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound Public Page'
        : `${publicDisplayName} on Proofound`,
      ogDescription: shouldUseGenericSharePreview(effectiveState)
        ? 'A proof snapshot shared by direct link on Proofound.'
        : proofFirstDescription,
      useGenericPreview: shouldUseGenericSharePreview(effectiveState),
    },
    jsonLd: {
      description: proofFirstDescription,
    },
    minimumContentMet,
    hasLinkOnlyContent: proofOverview.hasLinkOnlyContent,
    hasRevealGatedContent: proofOverview.hasRevealGatedContent,
  };
}

export async function getHistoricalPublicProfileHandleRedirect(handle: string) {
  return loadHistoricalHandle(handle);
}

export async function resolvePublicIndividualPortfolioAccessByHandle(
  handle: string
): Promise<PublicIndividualPortfolioAccessResult> {
  const projection = await getPublicIndividualPortfolioProjectionByHandle(handle);

  if (!projection) {
    return {
      status: 'missing',
      projection: null,
    };
  }

  return {
    status: isAccessiblePublicPortfolioState(projection.effectiveState)
      ? 'accessible'
      : 'unavailable',
    projection,
  };
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
      working_context,
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

function buildMockPublicOrganizationPortfolioProjection(): PublicOrganizationPortfolioProjection {
  const organization: OrganizationRow = {
    id: MOCK_ORG_ID,
    slug: MOCK_ORG_SLUG,
    display_name: 'Test Organization',
    public_portfolio_state: 'public_link_only',
    search_indexing_enabled_at: null,
    trust_status: 'domain_verified',
    trust_status_updated_at: '2026-03-11T00:00:00.000Z',
    website_verified_at: '2026-03-11T00:00:00.000Z',
    operating_region: 'EU',
    verified: true,
    website: 'https://test-org.example',
    tagline: 'Proof-first assignment review practice for focused launch review.',
    mission:
      'Help teams review submissions through concrete work evidence instead of polished claims.',
    working_context:
      'A launch-safe mock organization used for local hiring-flow and public trust-page testing.',
    type: 'company',
  };
  const visibility: OrganizationVisibilityRow = {
    display_name: 'public',
    mission: 'public',
  };
  const verifiedDomainPath = getVerifiedOrganizationDomainPath({
    website: organization.website,
    websiteVerifiedAt: organization.website_verified_at,
    trustStatus: organization.trust_status,
    verified: organization.verified,
  });
  const publicSummary = organization.mission ?? organization.tagline ?? '';
  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    searchIndexingEnabled: false,
    minimumContentMet: true,
  });
  const shareUrl = `${SITE_URL}/portfolio/org/${encodeURIComponent(organization.slug)}`;
  const assignmentSnapshot: PortfolioAssignmentSnapshot = {
    role: 'Proof-first product reviewer',
    engagementType: 'full_time',
    businessValue: 'Improve review quality through clearer proof expectations.',
    description: 'Review proof submissions through structured evidence and launch-safe summaries.',
    expectedImpact: 'Shortlists become more explainable, privacy-safe, and grounded in real work.',
    outcomes: ['Clarify proof expectations', 'Reduce vague review decisions'],
  };
  const verificationSummary = summarizeVerificationPolicy({
    records: [],
    legacyOrganization: {
      trustStatus: 'domain_verified',
      verified: true,
    },
  });

  return {
    organizationId: organization.id,
    slug: organization.slug,
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    effectiveState,
    shareUrl,
    publicDisplayName: organization.display_name,
    publicSummary,
    verifiedDomainPath,
    visibility,
    organization,
    verificationSummary,
    metadata: {
      path: `/portfolio/org/${encodeURIComponent(organization.slug)}`,
      title: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound organization portfolio'
        : `${organization.display_name} | Proofound`,
      description: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable organization trust page on Proofound.'
        : publicSummary,
      ogTitle: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound organization portfolio'
        : `${organization.display_name} on Proofound`,
      ogDescription: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable organization trust page on Proofound.'
        : publicSummary,
      useGenericPreview: shouldUseGenericSharePreview(effectiveState),
    },
    jsonLd: {
      description: publicSummary,
    },
    exportData: {
      schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
      surface: 'organization_public',
      exportedAt: new Date().toISOString(),
      shareUrl,
      organization: {
        id: organization.id,
        slug: organization.slug,
        displayName: organization.display_name,
        verifiedDomainPath: verifiedDomainPath || undefined,
        mission: organization.mission || undefined,
        whyWorkMatters: organization.tagline || undefined,
        operatingContext: organization.working_context || undefined,
        website: normalizeOrganizationWebsite(organization.website).value || undefined,
        verified: true,
      },
      assignmentSnapshot,
    },
    assignmentSnapshot,
    minimumContentMet: true,
  };
}

function buildMockLongPublicOrganizationPortfolioProjection(): PublicOrganizationPortfolioProjection {
  const organization: OrganizationRow = {
    id: MOCK_LONG_ORG_ID,
    slug: MOCK_LONG_ORG_SLUG,
    display_name:
      'Nordic Distributed Proof Operations Research Collective For Very Long Public Names',
    public_portfolio_state: 'public_link_only',
    search_indexing_enabled_at: null,
    trust_status: 'domain_verified',
    trust_status_updated_at: '2026-05-18T00:00:00.000Z',
    website_verified_at: '2026-05-18T00:00:00.000Z',
    operating_region: null,
    verified: true,
    website:
      'https://proof-operations-research-collective.example.com/teams/very-long-public-profile-path',
    tagline: null,
    mission: null,
    working_context: null,
    type: 'company',
  };
  const visibility: OrganizationVisibilityRow = {
    display_name: 'public',
    mission: 'public',
  };
  const verifiedDomainPath =
    'proof-operations-research-collective.example.com/verified/organization/domain/path';
  const publicSummary = '';
  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    searchIndexingEnabled: false,
    minimumContentMet: true,
  });
  const shareUrl = `${SITE_URL}/portfolio/org/${encodeURIComponent(organization.slug)}`;
  const verificationSummary = summarizeVerificationPolicy({
    records: [],
    legacyOrganization: {
      trustStatus: 'domain_verified',
      verified: true,
    },
  });

  return {
    organizationId: organization.id,
    slug: organization.slug,
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    effectiveState,
    shareUrl,
    publicDisplayName: organization.display_name,
    publicSummary,
    verifiedDomainPath,
    visibility,
    organization,
    verificationSummary,
    metadata: {
      path: `/portfolio/org/${encodeURIComponent(organization.slug)}`,
      title: 'Proofound organization portfolio',
      description: 'Shareable organization trust page on Proofound.',
      ogTitle: 'Proofound organization portfolio',
      ogDescription: 'Shareable organization trust page on Proofound.',
      useGenericPreview: true,
    },
    jsonLd: {
      description: 'Shareable organization trust page on Proofound.',
    },
    exportData: {
      schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
      surface: 'organization_public',
      exportedAt: new Date().toISOString(),
      shareUrl,
      organization: {
        id: organization.id,
        slug: organization.slug,
        displayName: organization.display_name,
        verifiedDomainPath,
        website: normalizeOrganizationWebsite(organization.website).value || undefined,
        verified: true,
      },
    },
    assignmentSnapshot: null,
    minimumContentMet: true,
  };
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

async function loadPublicOrganizationAssignmentSnapshot(
  organizationId: string
): Promise<PortfolioAssignmentSnapshot | null> {
  const assignmentResult = await db.execute(sql`
    SELECT
      id,
      role,
      engagement_type,
      business_value,
      description,
      expected_impact,
      updated_at
    FROM assignments
    WHERE org_id = ${organizationId}::uuid
      AND status = 'active'
      AND creation_status = 'review_ready'
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 1
  `);

  const assignment = getRows<OrganizationAssignmentRow>(assignmentResult as any)[0] ?? null;
  if (!assignment || !assignment.role?.trim()) {
    return null;
  }

  const outcomeResult = await db.execute(sql`
    SELECT
      title,
      description
    FROM assignment_outcomes
    WHERE assignment_id = ${assignment.id}::uuid
    ORDER BY created_at ASC
    LIMIT 12
  `);

  const seenOutcomes = new Set<string>();
  const outcomes = getRows<OrganizationAssignmentOutcomeRow>(outcomeResult as any)
    .map((row) => row.title?.trim() || row.description?.trim() || '')
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seenOutcomes.has(key)) {
        return false;
      }

      seenOutcomes.add(key);
      return true;
    })
    .slice(0, 3);

  return {
    role: assignment.role.trim(),
    engagementType: assignment.engagement_type,
    businessValue: assignment.business_value?.trim() || null,
    description: assignment.description?.trim() || null,
    expectedImpact: assignment.expected_impact?.trim() || null,
    outcomes,
  };
}

export async function getPublicOrganizationPortfolioProjectionBySlug(
  slug: string
): Promise<PublicOrganizationPortfolioProjection | null> {
  if (visualPublicProjectionFixturesEnabled() && slug === MOCK_ORG_SLUG) {
    return buildMockPublicOrganizationPortfolioProjection();
  }
  if (visualPublicProjectionFixturesEnabled() && slug === MOCK_LONG_ORG_SLUG) {
    return buildMockLongPublicOrganizationPortfolioProjection();
  }

  const organization = await loadOrganizationBySlug(slug);
  if (!organization) {
    return null;
  }

  const [visibilityResult, verificationRecords, assignmentSnapshot] = await Promise.all([
    db.execute(sql`
      SELECT display_name, mission
      FROM organization_field_visibility
      WHERE org_id = ${organization.id}::uuid
      LIMIT 1
    `),
    listVerificationRecordsForOwner('organization', organization.id).catch(() => []),
    loadPublicOrganizationAssignmentSnapshot(organization.id),
  ]);

  const visibility = getRows<OrganizationVisibilityRow>(visibilityResult as any)[0] ?? null;
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
  const verifiedDomainPath = getVerifiedOrganizationDomainPath({
    website: organization.website,
    websiteVerifiedAt: organization.website_verified_at,
    trustStatus: organization.trust_status,
    verified: organization.verified,
  });
  const explicitPublicSummary =
    (visibility?.mission === 'public'
      ? organization.mission?.trim()
      : organization.tagline?.trim()) || organization.tagline?.trim();
  const publicSummary =
    explicitPublicSummary || verifiedDomainPath || 'Public organization trust page on Proofound.';
  const hasVerifiedTrustSignal = Boolean(
    organization.verified ||
      organization.trust_status === 'domain_verified' ||
      organization.trust_status === 'platform_reviewed' ||
      organization.website_verified_at ||
      verificationSummary.publicBadges.length > 0
  );

  const minimumContentMet = Boolean(
    organization.slug &&
      publicDisplayName &&
      (explicitPublicSummary || verifiedDomainPath || hasVerifiedTrustSignal || assignmentSnapshot)
  );

  const effectiveState = deriveEffectivePublicPortfolioState({
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    searchIndexingEnabled: Boolean(organization.search_indexing_enabled_at),
    minimumContentMet,
  });

  const shareUrl = `${SITE_URL}/portfolio/org/${encodeURIComponent(organization.slug)}`;

  return {
    organizationId: organization.id,
    slug: organization.slug,
    requestedState: resolveRequestedPublicPortfolioState(organization.public_portfolio_state),
    effectiveState,
    shareUrl,
    publicDisplayName,
    publicSummary,
    verifiedDomainPath,
    visibility,
    organization,
    verificationSummary,
    metadata: {
      path: `/portfolio/org/${encodeURIComponent(organization.slug)}`,
      title: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound organization portfolio'
        : `${publicDisplayName} | Proofound`,
      description: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable organization trust page on Proofound.'
        : publicSummary,
      ogTitle: shouldUseGenericSharePreview(effectiveState)
        ? 'Proofound organization portfolio'
        : `${publicDisplayName} on Proofound`,
      ogDescription: shouldUseGenericSharePreview(effectiveState)
        ? 'Shareable organization trust page on Proofound.'
        : publicSummary,
      useGenericPreview: shouldUseGenericSharePreview(effectiveState),
    },
    jsonLd: {
      description: publicSummary,
    },
    exportData: {
      schemaVersion: PORTFOLIO_EXPORT_SCHEMA_VERSION,
      surface: 'organization_public',
      exportedAt: new Date().toISOString(),
      shareUrl,
      organization: {
        id: organization.id,
        slug: organization.slug,
        displayName: publicDisplayName,
        verifiedDomainPath: verifiedDomainPath || undefined,
        mission: visibility?.mission === 'public' ? organization.mission || undefined : undefined,
        whyWorkMatters: organization.tagline || undefined,
        operatingContext: organization.working_context || undefined,
        website: normalizeOrganizationWebsite(organization.website).value || undefined,
        verified: Boolean(organization.verified),
      },
      assignmentSnapshot: assignmentSnapshot ?? undefined,
    },
    assignmentSnapshot,
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
