import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { log } from '@/lib/log';
import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/sender';
import {
  extractRequestFingerprints,
  hasSameDeviceSignal,
  mergeIntegrityWithResponseSignal,
  normalizeEmail,
  writeVerificationAuditLog,
} from '@/lib/verification/integrity';
import {
  CAPABILITY_TOKEN_CLASSES,
  beginCapabilityTokenRedeemSession,
  getCapabilityRedeemSessionCookieName,
  redeemCapabilityToken,
} from '@/lib/security/capability-tokens';
import { listCanonicalSkillProofRowsForOwnerSkill } from '@/lib/proofs/canonical-pack';
import {
  applySkillVerificationTrustLift,
  parseHumanObservedAttestationResponse,
  type HumanObservedAttestationRequestPayload,
  type HumanObservedVerdict,
} from '@/lib/verification/human-attestations';
import {
  getCanonicalSkillVerificationRequestByToken,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import {
  getCanonicalImpactVerificationRequestByToken,
  updateCanonicalImpactVerificationRequest,
} from '@/lib/verification/canonical-impact-requests';
import { getClaimTemplateLabel } from '@/lib/verification/scoped-contract';
import { ensureInternalOpsQueueItem } from '@/lib/internal-ops/queue';
import {
  buildVisualSkillVerificationResponse,
  verificationLinkVisualFixturesEnabled,
  VISUAL_VERIFY_TOKENS,
} from '@/lib/verification/visual-link-fixtures';

const VerifyResponseSchema = z.object({
  action: z.enum(['accept', 'decline']).optional(),
  message: z.string().optional(),
  confirmedClaimIds: z.array(z.string()).optional(),
  attestation: z.unknown().optional(),
});

function getHumanObservedVerdict(attestation: unknown): HumanObservedVerdict | null {
  if (!attestation || typeof attestation !== 'object') {
    return null;
  }

  const verdict = (attestation as { verdict?: unknown }).verdict;
  if (verdict === 'yes' || verdict === 'partly' || verdict === 'no') {
    return verdict;
  }

  return null;
}

function resolveVerificationAction(params: {
  requestKind: 'generic_verification' | 'human_observed_attestation';
  action?: 'accept' | 'decline';
  attestation?: unknown;
}) {
  if (params.requestKind !== 'human_observed_attestation') {
    return params.action ?? null;
  }

  const verdict = getHumanObservedVerdict(params.attestation);
  if (!verdict) {
    return params.action ?? null;
  }

  return verdict === 'no' ? 'decline' : 'accept';
}

function isCompatibleHumanObservedAction(params: {
  action: 'accept' | 'decline';
  verdict: HumanObservedVerdict;
}) {
  if (params.action === 'accept') {
    return params.verdict === 'yes' || params.verdict === 'partly';
  }

  return params.verdict === 'no';
}

function isMissingColumnError(error: unknown, column: string) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string; hint?: string };
  const errorText = `${e.message || ''} ${e.details || ''} ${e.hint || ''}`.toLowerCase();
  return (e.code === 'PGRST204' || e.code === '42703') && errorText.includes(column.toLowerCase());
}

function isNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: string };
  if (e.code === 'PGRST116') {
    return true;
  }

  const errorText = `${e.message || ''} ${e.details || ''}`.toLowerCase();
  return errorText.includes('0 rows') || errorText.includes('no rows');
}

function isSkillRelationQueryError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const e = error as { code?: string; message?: string; details?: unknown; hint?: string };
  if (e.code !== 'PGRST200' && e.code !== 'PGRST201') {
    return false;
  }

  const errorText =
    `${e.message || ''} ${JSON.stringify(e.details || '')} ${e.hint || ''}`.toLowerCase();
  return (
    errorText.includes('skills_taxonomy') ||
    errorText.includes('skills') ||
    errorText.includes('relationship')
  );
}

async function getCanonicalSkillVerificationWithSkillDetails(
  client: {
    from: (table: string) => {
      select: (query: string) => {
        eq: (
          column: string,
          value: string
        ) => {
          single: () => Promise<{ data: any; error: any }>;
        };
      };
    };
  },
  token: string
): Promise<{ data: any; error: any }> {
  const { data: canonicalData, error } = await getCanonicalSkillVerificationRequestByToken(token);
  if (error || !canonicalData) {
    return { data: null, error };
  }

  if (!canonicalData.skill_id) {
    return { data: canonicalData, error: null };
  }

  const hintedLookup = await client
    .from('skills')
    .select(
      `
      skill_id,
      skill_code,
      taxonomy:skills_taxonomy!skills_skill_code_fkey (
        name_i18n
      )
    `
    )
    .eq('id', String(canonicalData.skill_id))
    .single();

  if (hintedLookup.data || !isSkillRelationQueryError(hintedLookup.error)) {
    return {
      data: {
        ...canonicalData,
        skills: hintedLookup.data || null,
      },
      error: hintedLookup.error,
    };
  }

  const fallbackLookup = await client
    .from('skills')
    .select('skill_id, skill_code')
    .eq('id', String(canonicalData.skill_id))
    .single();

  return {
    data: {
      ...canonicalData,
      skills: fallbackLookup.data || null,
    },
    error: fallbackLookup.error,
  };
}

function normalizeBaseUrl(url?: string | null) {
  const base = (url || '').trim();
  if (!base) return 'https://proofound.io';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

type OptionalAuthIdentity = {
  isAuthenticated: boolean;
  email: string | null;
  profileId: string | null;
};

async function getOptionalAuthIdentity(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<OptionalAuthIdentity> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return {
        isAuthenticated: false,
        email: null,
        profileId: null,
      };
    }

    return {
      isAuthenticated: true,
      email: normalizeEmail(data.user.email || null),
      profileId: data.user.id || null,
    };
  } catch {
    return {
      isAuthenticated: false,
      email: null,
      profileId: null,
    };
  }
}

function getResponseAuthMethod(identity: OptionalAuthIdentity): 'token' | 'authenticated' {
  return identity.isAuthenticated ? 'authenticated' : 'token';
}

type ImpactClaim = {
  id: string;
  label: string;
  template?: string;
  detail?: string;
  outcomeId?: string;
  enabled?: boolean;
};

type ImpactClaimsPayload = {
  roleClaim: ImpactClaim;
  outcomeClaims: ImpactClaim[];
  artifactsClaim: ImpactClaim;
};

type ImpactStoryContext = {
  id?: string | null;
  title?: string | null;
  user_id?: string | null;
  outcomes?: string | null;
  role_title?: string | null;
  role_scope?: string | null;
  affiliation_details?: string | null;
  org_description?: string | null;
  measured_outcomes?: unknown;
  supporting_artifacts?: unknown;
};

type ProfileContext = {
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string | null;
};

type SkillProofContext = {
  id?: string | null;
  proof_type?: string | null;
  title?: string | null;
  description?: string | null;
  url?: string | null;
  file_path?: string | null;
  issued_date?: string | null;
  expires_date?: string | null;
};

type VerificationDataClient =
  | ReturnType<typeof createAdminClient>
  | Awaited<ReturnType<typeof createClient>>;

function isMissingAnyColumnError(error: unknown, columns: string[]) {
  return columns.some((column) => isMissingColumnError(error, column));
}

function toStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function parseSnapshotOutcomeClaims(value: unknown): ImpactClaim[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.reduce<ImpactClaim[]>((claims, row) => {
    if (!row || typeof row !== 'object') {
      return claims;
    }
    const claim = row as Record<string, unknown>;
    const id = toStringOrNull(claim.id);
    if (!id) {
      return claims;
    }
    const label = toStringOrNull(claim.label) || getClaimTemplateLabel('outcome_happened');
    const outcomeId = toStringOrNull(claim.outcomeId);
    const template = toStringOrNull(claim.template) || 'outcome_happened';
    const detail = toStringOrNull(claim.detail);
    claims.push(
      outcomeId
        ? { id, label, outcomeId, template, detail: detail || undefined }
        : { id, label, template, detail: detail || undefined }
    );
    return claims;
  }, []);
}

function parseStoryOutcomeClaims(measuredOutcomes: unknown): ImpactClaim[] {
  if (!Array.isArray(measuredOutcomes)) {
    return [];
  }

  return measuredOutcomes.reduce<ImpactClaim[]>((claims, row, index) => {
    if (!row || typeof row !== 'object') {
      return claims;
    }

    const outcome = row as Record<string, unknown>;
    const outcomeId = toStringOrNull(outcome.id);
    const label =
      toStringOrNull(outcome.change) || toStringOrNull(outcome.label) || `Outcome ${index + 1}`;
    const value = outcome.value;
    const unit = toStringOrNull(outcome.unit);
    const renderedValue =
      typeof value === 'number' || typeof value === 'string' ? String(value).trim() : null;

    const valueSuffix =
      renderedValue && unit
        ? ` (${renderedValue} ${unit})`
        : renderedValue
          ? ` (${renderedValue})`
          : '';

    const id = outcomeId ? `outcome:${outcomeId}` : `outcome:generated:${index + 1}`;
    claims.push(
      outcomeId
        ? {
            id,
            outcomeId,
            template: 'outcome_happened',
            label: getClaimTemplateLabel('outcome_happened'),
            detail: `${label}${valueSuffix}`,
          }
        : {
            id,
            template: 'outcome_happened',
            label: getClaimTemplateLabel('outcome_happened'),
            detail: `${label}${valueSuffix}`,
          }
    );
    return claims;
  }, []);
}

function parseLegacyOutcomeClaimLabel(outcomesText: unknown): string | null {
  if (typeof outcomesText !== 'string') {
    return null;
  }

  const normalized = outcomesText.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return null;
  }

  const maxLength = 140;
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function parseLegacyOutcomeClaims(outcomesText: unknown): ImpactClaim[] {
  const label = parseLegacyOutcomeClaimLabel(outcomesText);
  if (!label) {
    return [];
  }

  return [
    {
      id: 'outcome:legacy',
      template: 'outcome_happened',
      label: getClaimTemplateLabel('outcome_happened'),
      detail: `Outcome confirmation (${label})`,
    },
  ];
}

function buildFallbackRoleClaim(impactStory: ImpactStoryContext | null): ImpactClaim {
  const roleTitle = toStringOrNull(impactStory?.role_title) || 'Contributor';
  const roleScope = toStringOrNull(impactStory?.role_scope) || 'contributed';
  const claimTemplate = roleScope === 'contributed' ? 'contributed_this_part' : 'did_this_work';
  return {
    id: 'role',
    template: claimTemplate,
    label: getClaimTemplateLabel(claimTemplate),
    detail: `${roleTitle}, ${roleScope.replace(/_/g, ' ')}`,
  };
}

function buildFallbackArtifactsClaim(impactStory: ImpactStoryContext | null): ImpactClaim {
  const hasArtifacts =
    Array.isArray(impactStory?.supporting_artifacts) && impactStory.supporting_artifacts.length > 0;
  return {
    id: 'artifacts',
    label: 'Supporting artifacts authenticity',
    enabled: hasArtifacts,
  };
}

function resolveImpactClaims(
  claimSnapshot: unknown,
  impactStory: ImpactStoryContext | null
): ImpactClaimsPayload {
  const snapshot = claimSnapshot && typeof claimSnapshot === 'object' ? claimSnapshot : {};
  const snapshotRecord = snapshot as Record<string, unknown>;

  const roleClaimRaw =
    snapshotRecord.roleClaim && typeof snapshotRecord.roleClaim === 'object'
      ? (snapshotRecord.roleClaim as Record<string, unknown>)
      : null;
  const roleClaimId = toStringOrNull(roleClaimRaw?.id);
  const roleClaimLabel = toStringOrNull(roleClaimRaw?.label);
  const roleClaimTemplate = toStringOrNull(roleClaimRaw?.template);
  const roleClaimDetail = toStringOrNull(roleClaimRaw?.detail);

  const roleClaim: ImpactClaim =
    roleClaimId && roleClaimLabel
      ? {
          id: roleClaimId,
          label: roleClaimLabel,
          template: roleClaimTemplate || undefined,
          detail: roleClaimDetail || undefined,
        }
      : buildFallbackRoleClaim(impactStory);

  const outcomeClaimsFromSnapshot = parseSnapshotOutcomeClaims(snapshotRecord.outcomeClaims);
  const outcomeClaimsFromStructuredStory = parseStoryOutcomeClaims(impactStory?.measured_outcomes);
  const outcomeClaimsFromLegacyStory = parseLegacyOutcomeClaims(impactStory?.outcomes);
  const outcomeClaims =
    outcomeClaimsFromSnapshot.length > 0
      ? outcomeClaimsFromSnapshot
      : outcomeClaimsFromStructuredStory.length > 0
        ? outcomeClaimsFromStructuredStory
        : outcomeClaimsFromLegacyStory;

  const artifactsClaimRaw =
    snapshotRecord.artifactsClaim && typeof snapshotRecord.artifactsClaim === 'object'
      ? (snapshotRecord.artifactsClaim as Record<string, unknown>)
      : null;
  const artifactsClaimId = toStringOrNull(artifactsClaimRaw?.id);
  const artifactsClaimLabel = toStringOrNull(artifactsClaimRaw?.label);
  const artifactsClaimEnabled = artifactsClaimRaw?.enabled;

  const artifactsClaim: ImpactClaim =
    artifactsClaimId && artifactsClaimLabel
      ? {
          id: artifactsClaimId,
          label: artifactsClaimLabel,
          enabled: Boolean(artifactsClaimEnabled),
        }
      : buildFallbackArtifactsClaim(impactStory);

  return {
    roleClaim,
    outcomeClaims,
    artifactsClaim,
  };
}

function formatDisplayNameFromEmail(email: string | null) {
  const normalizedEmail = toStringOrNull(email);
  if (!normalizedEmail) {
    return null;
  }

  const localPart = normalizedEmail.split('@')[0]?.trim();
  if (!localPart) {
    return null;
  }

  const normalizedLocalPart = localPart.replace(/[._-]+/g, ' ').trim();
  if (!normalizedLocalPart) {
    return null;
  }

  return normalizedLocalPart.replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRequesterEmailFromClaimSnapshot(claimSnapshot: unknown): string | null {
  if (!claimSnapshot || typeof claimSnapshot !== 'object') {
    return null;
  }

  const snapshotRecord = claimSnapshot as Record<string, unknown>;
  const context =
    snapshotRecord.context && typeof snapshotRecord.context === 'object'
      ? (snapshotRecord.context as Record<string, unknown>)
      : null;

  return toStringOrNull(context?.requesterEmail ?? context?.requester_email ?? null);
}

function getRequesterNameFromClaimSnapshot(claimSnapshot: unknown): string | null {
  if (!claimSnapshot || typeof claimSnapshot !== 'object') {
    return null;
  }

  const snapshotRecord = claimSnapshot as Record<string, unknown>;
  const context =
    snapshotRecord.context && typeof snapshotRecord.context === 'object'
      ? (snapshotRecord.context as Record<string, unknown>)
      : null;

  return toStringOrNull(context?.requesterName ?? context?.requester_name ?? null);
}

function resolveImpactRequesterIdentity(args: {
  profile: ProfileContext | null;
  requesterEmailSnapshot: unknown;
  claimSnapshot: unknown;
}) {
  const profileName = toStringOrNull(args.profile?.display_name);
  const profileEmail = toStringOrNull(args.profile?.email);
  const snapshotEmail = toStringOrNull(args.requesterEmailSnapshot);
  const snapshotName = getRequesterNameFromClaimSnapshot(args.claimSnapshot);
  const claimSnapshotEmail = getRequesterEmailFromClaimSnapshot(args.claimSnapshot);
  const resolvedEmail = profileEmail || snapshotEmail || claimSnapshotEmail || '';

  const requesterName =
    profileName ||
    snapshotName ||
    formatDisplayNameFromEmail(profileEmail) ||
    formatDisplayNameFromEmail(snapshotEmail) ||
    formatDisplayNameFromEmail(claimSnapshotEmail) ||
    'Proofound member';

  return {
    requesterName,
    requesterEmail: resolvedEmail,
  };
}

function buildImpactWhyYouAreReceivingThis(args: {
  requesterName: string;
  storyTitle: string;
  verifierRelationship?: string | null;
  roleTitle?: string | null;
  organization?: string | null;
}) {
  const relationship = args.verifierRelationship?.trim() || 'a trusted collaborator';
  const roleText = args.roleTitle?.trim() || 'their contribution';
  const organization = args.organization?.trim() || 'their organization';

  return `${args.requesterName} asked you to verify "${args.storyTitle}" including ${roleText} at ${organization}. You are receiving this because they listed you as ${relationship}.`;
}

async function getImpactStoryContext(
  adminClient: ReturnType<typeof createAdminClient>,
  impactStoryId: string
) {
  const primarySelect =
    'id, title, user_id, outcomes, role_title, role_scope, affiliation_details, org_description, measured_outcomes, supporting_artifacts';
  const fallbackSelect = 'id, title, user_id, outcomes, org_description';

  const primaryLookup = await adminClient
    .from('impact_stories')
    .select(primarySelect)
    .eq('id', impactStoryId)
    .maybeSingle();

  if (
    !primaryLookup.error ||
    !isMissingAnyColumnError(primaryLookup.error, [
      'role_title',
      'role_scope',
      'affiliation_details',
      'measured_outcomes',
      'supporting_artifacts',
    ])
  ) {
    return primaryLookup as { data: ImpactStoryContext | null; error: unknown };
  }

  const fallbackLookup = await adminClient
    .from('impact_stories')
    .select(fallbackSelect)
    .eq('id', impactStoryId)
    .maybeSingle();

  if (fallbackLookup.error || !fallbackLookup.data) {
    return fallbackLookup as { data: ImpactStoryContext | null; error: unknown };
  }

  return {
    data: {
      ...fallbackLookup.data,
      outcomes: toStringOrNull((fallbackLookup.data as ImpactStoryContext).outcomes),
      role_title: null,
      role_scope: null,
      affiliation_details: null,
      measured_outcomes: [],
      supporting_artifacts: [],
    } as ImpactStoryContext,
    error: null,
  };
}

async function getRequesterProfileForImpactVerification(
  adminClient: ReturnType<typeof createAdminClient>,
  requesterProfileId: string | null,
  fallbackStoryOwnerId: string | null
) {
  const selectClause = 'display_name, avatar_url, email';
  const fallbackSelectClause = 'display_name, avatar_url';

  const getProfile = async (profileId: string) => {
    const primaryLookup = await adminClient
      .from('profiles')
      .select(selectClause)
      .eq('id', profileId)
      .maybeSingle();

    if (!isMissingColumnError(primaryLookup.error, 'email')) {
      return primaryLookup as { data: ProfileContext | null; error: unknown };
    }

    const fallbackLookup = await adminClient
      .from('profiles')
      .select(fallbackSelectClause)
      .eq('id', profileId)
      .maybeSingle();

    if (fallbackLookup.error) {
      return fallbackLookup as { data: ProfileContext | null; error: unknown };
    }

    return {
      data: fallbackLookup.data
        ? ({
            ...fallbackLookup.data,
            email: null,
          } as ProfileContext)
        : null,
      error: null,
    };
  };

  if (requesterProfileId) {
    const requesterLookup = await getProfile(requesterProfileId);

    if (requesterLookup.data || requesterLookup.error) {
      return requesterLookup;
    }
  }

  if (fallbackStoryOwnerId && fallbackStoryOwnerId !== requesterProfileId) {
    return getProfile(fallbackStoryOwnerId);
  }

  return { data: null, error: null };
}

async function getRequesterProfileForSkillVerification(
  client: VerificationDataClient,
  requesterProfileId: string | null
) {
  if (!requesterProfileId) {
    return { data: null, error: null };
  }

  const selectClause = 'display_name, avatar_url, email';
  const fallbackSelectClause = 'display_name, avatar_url';

  const primaryLookup = await client
    .from('profiles')
    .select(selectClause)
    .eq('id', requesterProfileId)
    .maybeSingle();

  if (!isMissingColumnError(primaryLookup.error, 'email')) {
    return primaryLookup as { data: ProfileContext | null; error: unknown };
  }

  const fallbackLookup = await client
    .from('profiles')
    .select(fallbackSelectClause)
    .eq('id', requesterProfileId)
    .maybeSingle();

  if (fallbackLookup.error) {
    return fallbackLookup as { data: ProfileContext | null; error: unknown };
  }

  return {
    data: fallbackLookup.data
      ? ({
          ...fallbackLookup.data,
          email: null,
        } as ProfileContext)
      : null,
    error: null,
  };
}

function normalizeSkillVerificationRecord(verification: any) {
  const integrityStatus =
    verification?.integrity_status === 'contradicted'
      ? 'contradicted'
      : verification?.integrity_status === 'flagged'
        ? 'flagged'
        : verification?.integrity_status === 'warning'
          ? 'warning'
          : verification?.integrity_status === 'clear'
            ? 'clear'
            : 'unknown';

  return {
    ...verification,
    verifier_relationship: toStringOrNull(verification?.verifier_relationship),
    request_kind:
      verification?.request_kind === 'human_observed_attestation'
        ? 'human_observed_attestation'
        : 'generic_verification',
    attestation_request:
      verification?.attestation_request && typeof verification.attestation_request === 'object'
        ? verification.attestation_request
        : null,
    attestation_response:
      verification?.attestation_response && typeof verification.attestation_response === 'object'
        ? verification.attestation_response
        : null,
    requester_email_snapshot: toStringOrNull(verification?.requester_email_snapshot),
    requires_authenticated_verifier: Boolean(verification?.requires_authenticated_verifier),
    integrity_status: integrityStatus,
    integrity_reason:
      integrityStatus === 'flagged' || integrityStatus === 'contradicted'
        ? toStringOrNull(verification?.integrity_reason)
        : null,
    dispute_state: toStringOrNull(verification?.dispute_state),
    integrity_meta:
      verification?.integrity_meta && typeof verification.integrity_meta === 'object'
        ? verification.integrity_meta
        : {},
    integrity_flagged_at: verification?.integrity_flagged_at ?? null,
    risk_signals:
      verification?.risk_signals && typeof verification.risk_signals === 'object'
        ? verification.risk_signals
        : {},
    contradicted_at: toStringOrNull(verification?.contradicted_at),
    revoked_at: toStringOrNull(verification?.revoked_at),
    requester_ip_hash: toStringOrNull(verification?.requester_ip_hash),
    requester_user_agent_hash: toStringOrNull(verification?.requester_user_agent_hash),
  };
}

function toCanonicalLookupErrorResponse(
  _reason: 'invalid' | 'expired' | 'revoked' | null | undefined
) {
  return NextResponse.json(
    { error: 'Verification request not found or invalid token' },
    { status: 404 }
  );
}

function isContradictedVerificationState(
  verification:
    | {
        integrity_status?: string | null;
        dispute_state?: string | null;
        contradicted_at?: string | null;
      }
    | null
    | undefined
) {
  if (!verification) {
    return false;
  }

  return (
    verification.integrity_status === 'contradicted' ||
    verification.dispute_state === 'resolved_revoked' ||
    Boolean(verification.contradicted_at)
  );
}

function resolveSkillRequesterIdentity(args: {
  profile: ProfileContext | null;
  requesterEmailSnapshot: unknown;
}) {
  const profileName = toStringOrNull(args.profile?.display_name);
  const profileEmail = toStringOrNull(args.profile?.email);
  const snapshotEmail = toStringOrNull(args.requesterEmailSnapshot);

  const requesterName =
    profileName ||
    formatDisplayNameFromEmail(snapshotEmail) ||
    formatDisplayNameFromEmail(profileEmail) ||
    'Unknown';
  const requesterEmail = profileEmail || snapshotEmail || '';

  return {
    requesterName,
    requesterEmail,
  };
}

function sanitizeSkillProofForResponse(proof: SkillProofContext) {
  return {
    id: toStringOrNull(proof.id) || '',
    proof_type: toStringOrNull(proof.proof_type) || 'link',
    title: toStringOrNull(proof.title) || 'Proof',
    description: toStringOrNull(proof.description),
    url: toStringOrNull(proof.url),
    file_path: toStringOrNull(proof.file_path),
    issued_date: toStringOrNull(proof.issued_date),
    expires_date: toStringOrNull(proof.expires_date),
  };
}

function toNeutralCapabilityTokenError(_reason: unknown) {
  return NextResponse.json(
    { error: 'Verification request not found or invalid token' },
    { status: 404 }
  );
}

/**
 * GET /api/verify/[token]
 *
 * Get verification request details by token (public endpoint - no auth required)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const supabase = await createClient();
    const { token } = await params;

    if (verificationLinkVisualFixturesEnabled()) {
      const visualResponse = buildVisualSkillVerificationResponse(token);
      if (visualResponse) {
        return NextResponse.json(visualResponse);
      }
    }

    const authIdentity = await getOptionalAuthIdentity(supabase);
    let skillDataClient:
      | ReturnType<typeof createAdminClient>
      | Awaited<ReturnType<typeof createClient>> = supabase;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // 1) Try impact story verification first (new flow)
    try {
      const adminClient = createAdminClient();
      const impactPreview = await beginCapabilityTokenRedeemSession(token, {
        tokenClass: CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE,
        actor: {
          email: authIdentity.email,
          profileId: authIdentity.profileId,
          principalType: authIdentity.isAuthenticated ? 'user_account' : 'external_email',
          ip: request.headers.get('x-forwarded-for'),
          userAgent: request.headers.get('user-agent'),
        },
        metadata: { surface: 'verify_impact_preview' },
      });
      const { data: impactVerification, error: impactVerificationError } =
        await getCanonicalImpactVerificationRequestByToken(token);

      if (impactVerificationError) {
        if (impactVerificationError === 'expired' || impactVerificationError === 'revoked') {
          return toCanonicalLookupErrorResponse(impactVerificationError);
        }

        log.error('verify_token.impact.lookup_failed', { error: impactVerificationError });
      }

      if (impactVerification) {
        if (isContradictedVerificationState(impactVerification)) {
          return toCanonicalLookupErrorResponse('revoked');
        }

        if (
          impactVerification.expires_at &&
          new Date(impactVerification.expires_at) < new Date() &&
          impactVerification.status === 'pending'
        ) {
          await updateCanonicalImpactVerificationRequest({
            requestId: impactVerification.id,
            status: 'expired',
            respondedAt: new Date().toISOString(),
          });

          impactVerification.status = 'expired';
        }

        const { data: impactStory, error: impactStoryError } = await getImpactStoryContext(
          adminClient,
          impactVerification.impact_story_id
        );
        if (impactStoryError) {
          log.error('verify_token.impact.story_context_failed', {
            error: impactStoryError,
            requestId: impactVerification.id,
          });
        }

        const { data: requesterProfile, error: requesterProfileError } =
          await getRequesterProfileForImpactVerification(
            adminClient,
            toStringOrNull(impactVerification.requester_profile_id),
            toStringOrNull(impactStory?.user_id)
          );
        if (requesterProfileError) {
          log.error('verify_token.impact.requester_profile_failed', {
            error: requesterProfileError,
            requestId: impactVerification.id,
          });
        }

        const claims = resolveImpactClaims(impactVerification.claim_snapshot, impactStory || null);
        const requesterIdentity = resolveImpactRequesterIdentity({
          profile: requesterProfile || null,
          requesterEmailSnapshot: impactVerification.requester_email_snapshot,
          claimSnapshot: impactVerification.claim_snapshot,
        });
        const requesterName = requesterIdentity.requesterName;
        const storyTitle = impactStory?.title || 'Impact story';
        const organization =
          toStringOrNull(impactStory?.affiliation_details) ||
          toStringOrNull(impactStory?.org_description);

        const response = NextResponse.json({
          verification: {
            id: impactVerification.id,
            verification_type: 'impact_story',
            story_id: impactStory?.id || impactVerification.impact_story_id || null,
            story_title: storyTitle,
            requester_name: requesterName,
            requester_email: requesterIdentity.requesterEmail,
            requester_avatar: requesterProfile?.avatar_url || null,
            verifier_email: impactVerification.verifier_email,
            verifier_name: impactVerification.verifier_name,
            verifier_relationship: impactVerification.verifier_relationship,
            message: impactVerification.message,
            status: impactVerification.status,
            requires_authenticated_verifier:
              impactVerification.requires_authenticated_verifier || false,
            integrity_status: impactVerification.integrity_status || 'clear',
            integrity_reason:
              (impactVerification.integrity_status || 'clear') !== 'clear'
                ? impactVerification.integrity_reason || null
                : null,
            claims,
            why_you_are_receiving_this: buildImpactWhyYouAreReceivingThis({
              requesterName,
              storyTitle,
              verifierRelationship: toStringOrNull(impactVerification.verifier_relationship),
              roleTitle: toStringOrNull(impactStory?.role_title),
              organization,
            }),
            created_at: impactVerification.created_at,
            expires_at: impactVerification.expires_at,
          },
        });

        if (impactPreview.ok) {
          response.cookies.set(
            getCapabilityRedeemSessionCookieName(
              CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE
            ),
            impactPreview.redeemSessionNonce,
            {
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
              maxAge: impactPreview.maxAgeSeconds,
              path: '/',
            }
          );
        }

        return response;
      }
    } catch (impactError) {
      log.warn('verify_token.impact.lookup_fallback_failed', { error: impactError });
    }

    try {
      skillDataClient = createAdminClient();
    } catch (adminClientError) {
      log.warn('verify_token.skill.admin_client_unavailable', { error: adminClientError });
    }

    // 2) Fallback to existing skill verification flow
    const skillPreview = await beginCapabilityTokenRedeemSession(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE,
      actor: {
        email: authIdentity.email,
        profileId: authIdentity.profileId,
        principalType: authIdentity.isAuthenticated ? 'user_account' : 'external_email',
        ip: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent'),
      },
      metadata: { surface: 'verify_skill_preview' },
    });
    const { data: verification, error: verificationError } =
      await getCanonicalSkillVerificationWithSkillDetails(skillDataClient, token);

    if (verificationError) {
      if (
        verificationError === 'invalid' ||
        verificationError === 'expired' ||
        verificationError === 'revoked' ||
        isNotFoundError(verificationError)
      ) {
        return toCanonicalLookupErrorResponse(
          verificationError === 'invalid' || isNotFoundError(verificationError)
            ? 'invalid'
            : verificationError
        );
      }

      log.error('verify_token.skill.lookup_failed', { error: verificationError });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    const normalizedVerification = normalizeSkillVerificationRecord(verification);
    if (isContradictedVerificationState(normalizedVerification)) {
      return toCanonicalLookupErrorResponse('revoked');
    }

    if (
      normalizedVerification.expires_at &&
      new Date(normalizedVerification.expires_at) < new Date()
    ) {
      if (normalizedVerification.status === 'pending') {
        await updateCanonicalSkillVerificationRequest({
          requestId: normalizedVerification.id,
          status: 'expired',
          respondedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        verification: {
          ...formatVerificationResponse(normalizedVerification),
          verification_type: 'skill',
          status: 'expired',
        },
      });
    }

    const { data: requesterProfile, error: requesterProfileError } =
      await getRequesterProfileForSkillVerification(
        skillDataClient,
        normalizedVerification.requester_profile_id
      );
    if (requesterProfileError) {
      log.error('verify_token.skill.requester_profile_failed', {
        error: requesterProfileError,
        requestId: normalizedVerification.id,
      });
    }

    let skillProofs: SkillProofContext[] = [];
    try {
      skillProofs = await listCanonicalSkillProofRowsForOwnerSkill(
        normalizedVerification.requester_profile_id,
        normalizedVerification.skill_id
      );
    } catch (skillProofsError) {
      log.error('verify_token.skill.proofs_lookup_failed', {
        error: skillProofsError,
        requestId: normalizedVerification.id,
      });
    }

    const requesterIdentity = resolveSkillRequesterIdentity({
      profile: requesterProfile || null,
      requesterEmailSnapshot: normalizedVerification.requester_email_snapshot,
    });

    const skill = normalizedVerification.skills as any;
    let skillName = 'Unknown Skill';

    if (skill?.taxonomy?.name_i18n?.en) {
      skillName = skill.taxonomy.name_i18n.en;
    } else if (skill?.skill_id?.startsWith('custom-')) {
      const parts = skill.skill_id.split('-');
      if (parts.length > 4) {
        skillName = parts
          .slice(4)
          .join(' ')
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      }
    }

    const response = NextResponse.json({
      verification: {
        id: normalizedVerification.id,
        verification_type: 'skill',
        skill_name: skillName,
        skill_code: skill?.skill_code || null,
        requester_name: requesterIdentity.requesterName,
        requester_email: requesterIdentity.requesterEmail,
        requester_avatar: requesterProfile?.avatar_url || null,
        verifier_source: normalizedVerification.verifier_source,
        verifier_relationship: normalizedVerification.verifier_relationship,
        request_kind: normalizedVerification.request_kind,
        attestation_request: normalizedVerification.attestation_request,
        message: normalizedVerification.message,
        status: normalizedVerification.status,
        requires_authenticated_verifier:
          normalizedVerification.requires_authenticated_verifier || false,
        integrity_status: normalizedVerification.integrity_status || 'clear',
        integrity_reason:
          (normalizedVerification.integrity_status || 'clear') === 'flagged'
            ? normalizedVerification.integrity_reason || null
            : null,
        created_at: normalizedVerification.created_at,
        expires_at: normalizedVerification.expires_at,
        proofs: skillProofs.map((proof) => sanitizeSkillProofForResponse(proof)),
      },
    });

    if (skillPreview.ok) {
      response.cookies.set(
        getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE),
        skillPreview.redeemSessionNonce,
        {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: skillPreview.maxAgeSeconds,
          path: '/',
        }
      );
    }

    return response;
  } catch (error) {
    log.error('verify_token.get_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/verify/[token]
 *
 * Accept or decline a verification request (public endpoint - no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const supabase = await createClient();
    let skillDataClient:
      | ReturnType<typeof createAdminClient>
      | Awaited<ReturnType<typeof createClient>> = supabase;

    const validated = VerifyResponseSchema.parse(body);

    if (verificationLinkVisualFixturesEnabled() && token === VISUAL_VERIFY_TOKENS.skillObserved) {
      return NextResponse.json({
        success: true,
        status: validated.action === 'decline' ? 'declined' : 'accepted',
      });
    }

    const explicitAction = validated.action ?? null;
    const impactRedeemSessionNonce =
      request.cookies.get(
        getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE)
      )?.value ?? null;
    const skillRedeemSessionNonce =
      request.cookies.get(
        getCapabilityRedeemSessionCookieName(CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE)
      )?.value ?? null;

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    const authIdentity = await getOptionalAuthIdentity(supabase);
    const responderFingerprints = extractRequestFingerprints(request.headers);

    // 1) Try new impact-story verification flow first
    try {
      const adminClient = createAdminClient();
      const { data: impactVerification, error: impactVerificationError } =
        await getCanonicalImpactVerificationRequestByToken(token);

      if (impactVerificationError) {
        if (impactVerificationError === 'expired' || impactVerificationError === 'revoked') {
          return toCanonicalLookupErrorResponse(impactVerificationError);
        }

        log.error('verify_token.impact.lookup_failed', { error: impactVerificationError });
      }

      if (impactVerification) {
        if (!explicitAction) {
          return NextResponse.json(
            { error: 'Impact verification responses must include an explicit action.' },
            { status: 400 }
          );
        }

        if (isContradictedVerificationState(impactVerification)) {
          return toCanonicalLookupErrorResponse('revoked');
        }

        if (impactVerification.status !== 'pending') {
          return NextResponse.json(
            { error: `This request has already been ${impactVerification.status}` },
            { status: 400 }
          );
        }

        if (impactVerification.expires_at && new Date(impactVerification.expires_at) < new Date()) {
          await updateCanonicalImpactVerificationRequest({
            requestId: impactVerification.id,
            status: 'expired',
            respondedAt: new Date().toISOString(),
          });

          return NextResponse.json(
            { error: 'This verification request has expired' },
            { status: 400 }
          );
        }

        const normalizedVerifierEmail = normalizeEmail(impactVerification.verifier_email);
        if (impactVerification.requires_authenticated_verifier) {
          if (!authIdentity.isAuthenticated || !authIdentity.email) {
            return NextResponse.json(
              {
                error: 'Authentication is required to respond to this verification request.',
                code: 'AUTH_REQUIRED',
              },
              { status: 401 }
            );
          }

          if (!normalizedVerifierEmail || authIdentity.email !== normalizedVerifierEmail) {
            return NextResponse.json(
              { error: 'Verification request not found or invalid token' },
              { status: 404 }
            );
          }
        }

        const redeemedImpactToken = await redeemCapabilityToken(token, {
          tokenClass: CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE,
          actor: {
            email: authIdentity.email,
            profileId: authIdentity.profileId,
            principalType: authIdentity.isAuthenticated ? 'user_account' : 'external_email',
            ip: request.headers.get('x-forwarded-for'),
            userAgent: request.headers.get('user-agent'),
          },
          consume: true,
          requireRedeemSessionNonce: true,
          redeemSessionNonce: impactRedeemSessionNonce,
          metadata: {
            requestId: impactVerification.id,
            action: explicitAction,
          },
        });

        if (!redeemedImpactToken.ok) {
          return toNeutralCapabilityTokenError(redeemedImpactToken.reason);
        }

        const { data: impactStory, error: impactStoryError } = await getImpactStoryContext(
          adminClient,
          impactVerification.impact_story_id
        );
        if (impactStoryError) {
          log.error('verify_token.impact.story_context_failed', {
            error: impactStoryError,
            requestId: impactVerification.id,
            method: 'POST',
          });
        }

        const claims = resolveImpactClaims(impactVerification.claim_snapshot, impactStory || null);
        const confirmedClaimIds = new Set(validated.confirmedClaimIds || []);
        const outcomeClaims = claims.outcomeClaims;
        const roleClaimId = claims.roleClaim.id;
        const artifactsClaimId = claims.artifactsClaim.id;

        const confirmedOutcomeIds =
          explicitAction === 'accept'
            ? outcomeClaims
                .filter((claim) => claim.id && confirmedClaimIds.has(claim.id))
                .map((claim) => claim.outcomeId)
                .filter((outcomeId): outcomeId is string => Boolean(outcomeId))
            : [];

        const confirmedRole = explicitAction === 'accept' && confirmedClaimIds.has(roleClaimId);
        const confirmedArtifacts =
          explicitAction === 'accept' &&
          Boolean(claims.artifactsClaim.enabled) &&
          confirmedClaimIds.has(artifactsClaimId);

        const respondedAt = new Date().toISOString();
        const sameDeviceSignal = hasSameDeviceSignal({
          requesterIpHash: impactVerification.requester_ip_hash,
          requesterUserAgentHash: impactVerification.requester_user_agent_hash,
          responderIpHash: responderFingerprints.ipHash,
          responderUserAgentHash: responderFingerprints.userAgentHash,
        });

        const mergedIntegrity = mergeIntegrityWithResponseSignal({
          currentStatus: impactVerification.integrity_status,
          currentReason: impactVerification.integrity_reason,
          currentSignals: impactVerification.risk_signals,
          sameDeviceSignal,
        });

        const existingIntegrityMeta =
          impactVerification.integrity_meta && typeof impactVerification.integrity_meta === 'object'
            ? (impactVerification.integrity_meta as Record<string, unknown>)
            : {};

        const integrityMeta = {
          ...existingIntegrityMeta,
          response: {
            same_device_signal: sameDeviceSignal,
            response_auth_method: getResponseAuthMethod(authIdentity),
            response_actor_email: authIdentity.email,
            responded_at: respondedAt,
          },
        };

        const nextStatus = explicitAction === 'accept' ? 'accepted' : 'declined';
        const updatedCanonicalImpact = await updateCanonicalImpactVerificationRequest({
          requestId: impactVerification.id,
          status: nextStatus,
          respondedAt,
          responseMessage: validated.message || null,
          verifierProfileId:
            authIdentity.profileId || impactVerification.verifier_profile_id || null,
          verifierPrincipalType: authIdentity.isAuthenticated ? 'user_account' : 'external_email',
          verifierEmail:
            authIdentity.email || normalizedVerifierEmail || impactVerification.verifier_email,
          verifierName: impactVerification.verifier_name || null,
          verifierRelationship: impactVerification.verifier_relationship || null,
          integrityStatus: mergedIntegrity.integrityStatus === 'clear' ? 'clear' : 'warning',
          integrityReason: mergedIntegrity.integrityReason,
          riskSignals: mergedIntegrity.riskSignals,
          integrityMeta,
          integrityFlaggedAt:
            mergedIntegrity.integrityStatus === 'flagged'
              ? impactVerification.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
              : null,
          responseAuthMethod: getResponseAuthMethod(authIdentity),
          responseActorEmail: authIdentity.email,
        }).catch((error) => {
          log.error('verify_token.impact.update_failed', {
            error,
            requestId: impactVerification.id,
          });
          return null;
        });

        if (!updatedCanonicalImpact) {
          return NextResponse.json(
            { error: 'Failed to update verification request' },
            { status: 500 }
          );
        }

        if (
          explicitAction === 'accept' &&
          mergedIntegrity.integrityStatus === 'clear' &&
          (confirmedRole || confirmedOutcomeIds.length > 0)
        ) {
          const { error: impactStoryUpdateError } = await adminClient
            .from('impact_stories')
            .update({
              verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', impactVerification.impact_story_id);

          if (impactStoryUpdateError) {
            log.error('verify_token.impact.story_verified_update_failed', {
              error: impactStoryUpdateError,
              requestId: impactVerification.id,
              impactStoryId: impactVerification.impact_story_id,
            });
          }
        }

        try {
          const { data: requesterProfile } = await adminClient
            .from('profiles')
            .select('email, display_name')
            .eq('id', impactVerification.requester_profile_id)
            .maybeSingle();

          const { data: impactStory } = await adminClient
            .from('impact_stories')
            .select('title')
            .eq('id', impactVerification.impact_story_id)
            .maybeSingle();

          if (requesterProfile?.email) {
            const actionLabel = explicitAction === 'accept' ? 'accepted' : 'declined';
            const storyTitle = impactStory?.title || 'impact story';
            const confirmedCount = (confirmedRole ? 1 : 0) + confirmedOutcomeIds.length;

            await sendEmail({
              to: requesterProfile.email,
              subject: `Impact story verification ${actionLabel}`,
              html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="margin-bottom: 16px; color: #1a1a1a;">Impact verification update</h2>
                  <p style="color: #4a4a4a; line-height: 1.6;">
                    ${impactVerification.verifier_email} has <strong>${actionLabel}</strong> your verification request for <strong>${storyTitle}</strong>.
                  </p>
                  ${
                    explicitAction === 'accept'
                      ? `<p style="color: #4a4a4a; line-height: 1.6;">Confirmed claims: <strong>${confirmedCount}</strong>.</p>`
                      : ''
                  }
                  ${
                    validated.message
                      ? `<p style="color: #4a4a4a; line-height: 1.6;"><em>"${validated.message}"</em></p>`
                      : ''
                  }
                </div>
              `,
              text: `${impactVerification.verifier_email} has ${actionLabel} your verification request for ${storyTitle}.`,
            });
          }
        } catch (impactEmailError) {
          log.warn('verify_token.impact.notification_email_failed', {
            error: impactEmailError,
            requestId: impactVerification.id,
          });
        }

        await writeVerificationAuditLog({
          actorId: authIdentity.profileId,
          action: 'verification.response.recorded',
          targetType: 'impact_story_verification_request',
          targetId: impactVerification.id,
          meta: {
            response_status: nextStatus,
            response_action: explicitAction,
            requires_authenticated_verifier:
              impactVerification.requires_authenticated_verifier || false,
            response_auth_method: getResponseAuthMethod(authIdentity),
            response_actor_email: authIdentity.email,
            integrity_status: mergedIntegrity.integrityStatus,
            integrity_reason: mergedIntegrity.integrityReason,
            same_device_signal: sameDeviceSignal,
          },
        });

        return NextResponse.json({
          success: true,
          verification_type: 'impact_story',
          status: nextStatus,
          integrity_status: mergedIntegrity.integrityStatus,
          integrity_reason:
            mergedIntegrity.integrityStatus === 'flagged' ? mergedIntegrity.integrityReason : null,
          confirmed_claims: {
            role: confirmedRole,
            artifacts: confirmedArtifacts,
            outcomes: confirmedOutcomeIds,
          },
          message:
            explicitAction === 'accept'
              ? 'Impact story claims verified successfully.'
              : 'Your response has been recorded.',
        });
      }
    } catch (impactError) {
      log.warn('verify_token.impact.submit_fallback_failed', { error: impactError });
    }

    try {
      skillDataClient = createAdminClient();
    } catch (adminClientError) {
      log.warn('verify_token.skill.admin_client_unavailable', { error: adminClientError });
    }

    // 2) Fallback to existing skill verification flow
    const { data: verification, error: verificationError } =
      await getCanonicalSkillVerificationWithSkillDetails(skillDataClient, token);

    if (verificationError) {
      if (
        verificationError === 'invalid' ||
        verificationError === 'expired' ||
        verificationError === 'revoked' ||
        isNotFoundError(verificationError)
      ) {
        return toCanonicalLookupErrorResponse(
          verificationError === 'invalid' || isNotFoundError(verificationError)
            ? 'invalid'
            : verificationError
        );
      }

      log.error('verify_token.skill.submit_lookup_failed', { error: verificationError });
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    const normalizedVerification = normalizeSkillVerificationRecord(verification);
    if (isContradictedVerificationState(normalizedVerification)) {
      return toCanonicalLookupErrorResponse('revoked');
    }

    const normalizedSkillVerifierEmail = normalizeEmail(normalizedVerification.verifier_email);
    if (normalizedVerification.requires_authenticated_verifier) {
      if (!authIdentity.isAuthenticated || !authIdentity.email) {
        return NextResponse.json(
          {
            error: 'Authentication is required to respond to this verification request.',
            code: 'AUTH_REQUIRED',
          },
          { status: 401 }
        );
      }

      if (!normalizedSkillVerifierEmail || authIdentity.email !== normalizedSkillVerifierEmail) {
        return NextResponse.json(
          { error: 'Verification request not found or invalid token' },
          { status: 404 }
        );
      }
    }
    const isAuthenticatedVerifier =
      authIdentity.isAuthenticated &&
      Boolean(authIdentity.email) &&
      Boolean(normalizedSkillVerifierEmail) &&
      authIdentity.email === normalizedSkillVerifierEmail;
    const responseAuthMethod = isAuthenticatedVerifier
      ? getResponseAuthMethod(authIdentity)
      : 'token';
    const responseActorEmail = isAuthenticatedVerifier
      ? authIdentity.email
      : normalizedSkillVerifierEmail || null;
    const responseProfileId = isAuthenticatedVerifier
      ? authIdentity.profileId || normalizedVerification.verifier_profile_id || null
      : normalizedVerification.verifier_profile_id || null;
    const responsePrincipalType = isAuthenticatedVerifier ? 'user_account' : 'external_email';

    if (normalizedVerification.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${normalizedVerification.status}` },
        { status: 400 }
      );
    }

    if (
      normalizedVerification.expires_at &&
      new Date(normalizedVerification.expires_at) < new Date()
    ) {
      await updateCanonicalSkillVerificationRequest({
        requestId: normalizedVerification.id,
        status: 'expired',
        respondedAt: new Date().toISOString(),
      });

      return NextResponse.json({ error: 'This verification request has expired' }, { status: 400 });
    }

    const requestKind = normalizedVerification.request_kind;
    const resolvedAction = resolveVerificationAction({
      requestKind,
      action: explicitAction ?? undefined,
      attestation: validated.attestation,
    });
    const attestationRequest =
      requestKind === 'human_observed_attestation' &&
      normalizedVerification.attestation_request &&
      typeof normalizedVerification.attestation_request === 'object'
        ? (normalizedVerification.attestation_request as HumanObservedAttestationRequestPayload)
        : null;

    let attestationResponse: Record<string, unknown> | null = null;
    if (requestKind === 'human_observed_attestation') {
      if (!attestationRequest) {
        return NextResponse.json(
          { error: 'This confirmation request is missing its bounded skill scope.' },
          { status: 400 }
        );
      }

      const parsedAttestation = parseHumanObservedAttestationResponse(
        validated.attestation,
        attestationRequest
      );
      if (!parsedAttestation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsedAttestation.error.issues },
          { status: 400 }
        );
      }

      attestationResponse = parsedAttestation.data;

      if (
        explicitAction &&
        !isCompatibleHumanObservedAction({
          action: explicitAction,
          verdict: attestationResponse.verdict as HumanObservedVerdict,
        })
      ) {
        return NextResponse.json(
          {
            error:
              explicitAction === 'accept'
                ? 'Structured confirmations marked accept must use verdict yes or partly.'
                : 'Structured confirmations marked decline must use verdict no.',
          },
          { status: 400 }
        );
      }
    }

    if (!resolvedAction) {
      return NextResponse.json(
        { error: 'Verification responses must include an explicit action or structured verdict.' },
        { status: 400 }
      );
    }

    const skillRedeemActor = {
      email: authIdentity.email,
      profileId: authIdentity.profileId,
      principalType: authIdentity.isAuthenticated
        ? ('user_account' as const)
        : ('external_email' as const),
      ip: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent'),
    };
    const skillRedeemMetadata = {
      requestId: normalizedVerification.id,
      action: resolvedAction,
    };
    const redeemedSkillToken = await redeemCapabilityToken(token, {
      tokenClass: CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE,
      actor: skillRedeemActor,
      consume: true,
      requireRedeemSessionNonce: true,
      redeemSessionNonce: skillRedeemSessionNonce,
      metadata: skillRedeemMetadata,
    });

    if (!redeemedSkillToken.ok) {
      return toNeutralCapabilityTokenError(redeemedSkillToken.reason);
    }

    const newStatus = resolvedAction === 'accept' ? 'accepted' : 'declined';
    const respondedAt = new Date().toISOString();
    const sameDeviceSignal = hasSameDeviceSignal({
      requesterIpHash: normalizedVerification.requester_ip_hash,
      requesterUserAgentHash: normalizedVerification.requester_user_agent_hash,
      responderIpHash: responderFingerprints.ipHash,
      responderUserAgentHash: responderFingerprints.userAgentHash,
    });
    const mergedIntegrity = mergeIntegrityWithResponseSignal({
      currentStatus: normalizedVerification.integrity_status,
      currentReason: normalizedVerification.integrity_reason,
      currentSignals: normalizedVerification.risk_signals,
      sameDeviceSignal,
    });

    const existingSkillIntegrityMeta =
      normalizedVerification.integrity_meta &&
      typeof normalizedVerification.integrity_meta === 'object'
        ? (normalizedVerification.integrity_meta as Record<string, unknown>)
        : {};

    const skillIntegrityMeta = {
      ...existingSkillIntegrityMeta,
      response: {
        same_device_signal: sameDeviceSignal,
        response_auth_method: responseAuthMethod,
        response_actor_email: responseActorEmail,
        responded_at: respondedAt,
      },
    };

    const updatedCanonicalRecord = await updateCanonicalSkillVerificationRequest({
      requestId: normalizedVerification.id,
      status: resolvedAction === 'accept' ? 'accepted' : 'declined',
      respondedAt,
      responseMessage: validated.message || null,
      attestationResponse,
      verifierProfileId: responseProfileId,
      verifierPrincipalType: responsePrincipalType,
      verifierEmail: responseActorEmail,
      integrityStatus: mergedIntegrity.integrityStatus === 'clear' ? 'clear' : 'warning',
      integrityReason: mergedIntegrity.integrityReason,
      riskSignals: mergedIntegrity.riskSignals,
      integrityMeta: skillIntegrityMeta,
      integrityFlaggedAt:
        mergedIntegrity.integrityStatus === 'flagged'
          ? normalizedVerification.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
          : null,
      responseAuthMethod,
      responseActorEmail,
    }).catch((error) => {
      log.error('verify_token.skill.update_failed', {
        error,
        requestId: normalizedVerification.id,
      });
      return null;
    });

    if (!updatedCanonicalRecord) {
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    if (resolvedAction === 'accept' && mergedIntegrity.integrityStatus === 'clear') {
      const { data: skill } = await skillDataClient
        .from('skills')
        .select('evidence_strength')
        .eq('id', normalizedVerification.skill_id)
        .single();

      const currentStrength = parseFloat(skill?.evidence_strength || '0');
      const newStrength = applySkillVerificationTrustLift({
        currentStrength,
        requestKind,
        integrityStatus: mergedIntegrity.integrityStatus,
        status: newStatus,
        attestationResponse,
      });

      if (newStrength !== currentStrength) {
        await skillDataClient
          .from('skills')
          .update({
            evidence_strength: newStrength.toString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', normalizedVerification.skill_id);
      }
    }

    const attestationVerdict = getHumanObservedVerdict(attestationResponse);
    if (requestKind === 'human_observed_attestation') {
      if (attestationVerdict === 'partly') {
        await ensureInternalOpsQueueItem({
          queueType: 'verification',
          linkedEntityType: 'verification_request',
          linkedEntityId: normalizedVerification.id,
          summary:
            'A verifier responded partly. Manual trust review is needed before this confirmation can count.',
          priority: 'normal',
          actorType: isAuthenticatedVerifier ? 'candidate' : 'service_account',
          actorId: responseProfileId,
          metadata: {
            verdict: attestationVerdict,
            requestKind,
            verifierEmail: responseActorEmail,
          },
        });
      } else if (attestationVerdict === 'no') {
        await ensureInternalOpsQueueItem({
          queueType: 'correction_revocation',
          linkedEntityType: 'verification_request',
          linkedEntityId: normalizedVerification.id,
          summary:
            'A verifier responded no. Review whether trust needs correction, contradiction handling, or revocation.',
          priority: 'high',
          actorType: isAuthenticatedVerifier ? 'candidate' : 'service_account',
          actorId: responseProfileId,
          metadata: {
            verdict: attestationVerdict,
            requestKind,
            verifierEmail: responseActorEmail,
          },
        });
      }
    }

    const canonicalRecordId = normalizedVerification.id;

    try {
      const { emitVerificationProvided } = await import('@/lib/analytics/events');
      await emitVerificationProvided(
        normalizedVerification.requester_profile_id,
        normalizedVerification.id,
        {
          skill_id: normalizedVerification.skill_id,
          requester_id: normalizedVerification.requester_profile_id,
          action: resolvedAction === 'accept' ? 'accepted' : 'declined',
        }
      );
    } catch (analyticsError) {
      log.warn('verify_token.skill.analytics_emit_failed', {
        error: analyticsError,
        requestId: normalizedVerification.id,
      });
    }

    try {
      const { data: requesterProfile, error: requesterProfileError } =
        await getRequesterProfileForSkillVerification(
          skillDataClient,
          normalizedVerification.requester_profile_id
        );
      if (requesterProfileError) {
        log.error('verify_token.skill.requester_profile_failed', {
          error: requesterProfileError,
          requestId: normalizedVerification.id,
          method: 'POST',
        });
      }

      if (requesterProfile?.email) {
        const skill = normalizedVerification.skills as any;
        let skillName = 'your skill';
        if (skill?.taxonomy?.name_i18n?.en) {
          skillName = skill.taxonomy.name_i18n.en;
        } else if (skill?.custom_skill_name) {
          skillName = skill.custom_skill_name;
        }

        const actionText =
          resolvedAction === 'accept'
            ? requestKind === 'human_observed_attestation'
              ? attestationVerdict === 'partly'
                ? 'recorded a partial observed-in-practice confirmation for'
                : 'recorded an observed-in-practice confirmation for'
              : 'verified'
            : requestKind === 'human_observed_attestation'
              ? attestationVerdict === 'no'
                ? 'recorded a negative observed-in-practice confirmation for'
                : 'recorded a partial observed-in-practice confirmation for'
              : 'declined to verify';
        const actionEmoji = resolvedAction === 'accept' ? '✅' : '❌';
        const relationshipText =
          normalizedVerification.verifier_relationship ||
          normalizedVerification.verifier_source ||
          'your contact';

        const baseUrl = normalizeBaseUrl(
          process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
        );
        const expertiseUrl = `${baseUrl}/app/i/verifications`;

        await sendEmail({
          to: requesterProfile.email,
          subject: `${actionEmoji} Your skill verification request was ${resolvedAction === 'accept' ? 'accepted' : attestationVerdict === 'partly' ? 'partly confirmed' : 'declined'}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 16px;">
                Skill Verification Update
              </h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi${requesterProfile.display_name ? ` ${requesterProfile.display_name}` : ''},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${relationshipText}</strong> (${normalizedVerification.verifier_email}) has ${actionText} your 
                <strong>"${skillName}"</strong> skill.
              </p>
              ${
                validated.message
                  ? `
                <div style="background: #f5f5f5; border-left: 4px solid ${resolvedAction === 'accept' ? '#22c55e' : '#ef4444'}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #6b6b6b; font-size: 14px; margin: 0 0 8px 0;">Their message:</p>
                  <p style="color: #4a4a4a; font-size: 15px; margin: 0; font-style: italic;">"${validated.message}"</p>
                </div>
              `
                  : ''
              }
              <div style="margin-top: 24px;">
                <a href="${expertiseUrl}" 
                   style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  View Your Proof Skills
                </a>
              </div>
            </div>
          `,
          text: `Your skill verification request was ${resolvedAction === 'accept' ? 'accepted' : attestationVerdict === 'partly' ? 'partly confirmed' : 'declined'}.\n\n${relationshipText} (${normalizedVerification.verifier_email}) has ${actionText} your "${skillName}" skill.${validated.message ? `\n\nTheir message: "${validated.message}"` : ''}\n\nView your proof skills: ${expertiseUrl}`,
        });
      }
    } catch (emailError) {
      log.warn('verify_token.skill.notification_email_failed', {
        error: emailError,
        requestId: normalizedVerification.id,
      });
    }

    await writeVerificationAuditLog({
      actorId: authIdentity.profileId,
      action: 'verification.response.recorded',
      targetType: 'skill_verification_request',
      targetId: normalizedVerification.id,
      meta: {
        response_status: newStatus,
        response_action: resolvedAction,
        requires_authenticated_verifier:
          normalizedVerification.requires_authenticated_verifier || false,
        response_auth_method: getResponseAuthMethod(authIdentity),
        response_actor_email: authIdentity.email,
        request_kind: requestKind,
        verifier_relationship: normalizedVerification.verifier_relationship,
        integrity_status: mergedIntegrity.integrityStatus,
        integrity_reason: mergedIntegrity.integrityReason,
        same_device_signal: sameDeviceSignal,
        canonical_record_id: canonicalRecordId,
      },
    });

    return NextResponse.json({
      success: true,
      verification_type: 'skill',
      status: newStatus,
      integrity_status: mergedIntegrity.integrityStatus,
      integrity_reason:
        mergedIntegrity.integrityStatus === 'flagged' ? mergedIntegrity.integrityReason : null,
      canonical_record_id: canonicalRecordId,
      message:
        resolvedAction === 'accept'
          ? requestKind === 'human_observed_attestation'
            ? 'Thank you for recording this structured observed-in-practice confirmation.'
            : 'Thank you for verifying this skill!'
          : 'Your response has been recorded.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    log.error('verify_token.post_failed', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Format verification response for frontend
 */
function formatVerificationResponse(verification: any) {
  const skill = verification.skills;
  let skillName = 'Unknown Skill';

  if (skill?.taxonomy?.name_i18n?.en) {
    skillName = skill.taxonomy.name_i18n.en;
  } else if (skill?.skill_id?.startsWith('custom-')) {
    const parts = skill.skill_id.split('-');
    if (parts.length > 4) {
      skillName = parts
        .slice(4)
        .join(' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
    }
  }

  return {
    id: verification.id,
    skill_name: skillName,
    skill_code: skill?.skill_code || null,
    verifier_source: verification.verifier_source,
    verifier_relationship: verification.verifier_relationship || null,
    request_kind: verification.request_kind || 'generic_verification',
    attestation_request: verification.attestation_request || null,
    attestation_response: verification.attestation_response || null,
    message: verification.message,
    status: verification.status,
    requires_authenticated_verifier: verification.requires_authenticated_verifier || false,
    integrity_status: verification.integrity_status || 'clear',
    integrity_reason:
      (verification.integrity_status || 'clear') === 'flagged'
        ? verification.integrity_reason || null
        : null,
    created_at: verification.created_at,
    expires_at: verification.expires_at,
  };
}
