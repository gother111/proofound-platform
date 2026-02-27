import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

const VerifyResponseSchema = z.object({
  action: z.enum(['accept', 'decline']),
  message: z.string().optional(),
  confirmedClaimIds: z.array(z.string()).optional(),
});

function isRelationMissingError(error: unknown) {
  return Boolean(
    error && typeof error === 'object' && (error as { code?: string }).code === '42P01'
  );
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function shouldFallbackToLegacyRequestIdLookup(token: string, tokenLookupError: unknown): boolean {
  if (!isUuid(token)) {
    return false;
  }

  return (
    isMissingColumnError(tokenLookupError, 'verification_token') ||
    isNotFoundError(tokenLookupError)
  );
}

async function getSkillVerificationByTokenOrLegacyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string,
  selectClause: string
): Promise<{ data: any; error: any }> {
  const tokenLookup = await supabase
    .from('skill_verification_requests')
    .select(selectClause)
    .eq('verification_token', token)
    .single();

  if (tokenLookup.data) {
    return { data: tokenLookup.data as any, error: null };
  }

  if (!shouldFallbackToLegacyRequestIdLookup(token, tokenLookup.error)) {
    return { data: null, error: tokenLookup.error };
  }

  const idLookup = await supabase
    .from('skill_verification_requests')
    .select(selectClause)
    .eq('id', token)
    .single();

  if (idLookup.data) {
    return { data: idLookup.data as any, error: null };
  }

  return { data: null, error: idLookup.error || tokenLookup.error };
}

function normalizeBaseUrl(url?: string | null) {
  const base = (url || '').trim();
  if (!base) return 'https://proofound.com';
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

  return value
    .map((row) => {
      if (!row || typeof row !== 'object') {
        return null;
      }
      const claim = row as Record<string, unknown>;
      const id = toStringOrNull(claim.id);
      if (!id) {
        return null;
      }
      const label = toStringOrNull(claim.label) || 'Outcome confirmation';
      const outcomeId = toStringOrNull(claim.outcomeId);
      return outcomeId ? { id, label, outcomeId } : { id, label };
    })
    .filter((row): row is ImpactClaim => Boolean(row));
}

function parseStoryOutcomeClaims(measuredOutcomes: unknown): ImpactClaim[] {
  if (!Array.isArray(measuredOutcomes)) {
    return [];
  }

  return measuredOutcomes
    .map((row, index) => {
      if (!row || typeof row !== 'object') {
        return null;
      }

      const outcome = row as Record<string, unknown>;
      const outcomeId = toStringOrNull(outcome.id);
      const label = toStringOrNull(outcome.label) || `Outcome ${index + 1}`;
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
      return outcomeId
        ? { id, outcomeId, label: `${label}${valueSuffix}` }
        : { id, label: `${label}${valueSuffix}` };
    })
    .filter((row): row is ImpactClaim => Boolean(row));
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
      label: `Outcome confirmation (${label})`,
    },
  ];
}

function buildFallbackRoleClaim(impactStory: ImpactStoryContext | null): ImpactClaim {
  const roleTitle = toStringOrNull(impactStory?.role_title) || 'Contributor';
  const roleScope = (toStringOrNull(impactStory?.role_scope) || 'contributed').replace(/_/g, ' ');
  return {
    id: 'role',
    label: `Role participation (${roleTitle}, ${roleScope})`,
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

  const roleClaim: ImpactClaim =
    roleClaimId && roleClaimLabel
      ? { id: roleClaimId, label: roleClaimLabel }
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

function resolveImpactRequesterIdentity(args: {
  profile: ProfileContext | null;
  requesterEmailSnapshot: unknown;
  claimSnapshot: unknown;
}) {
  const profileName = toStringOrNull(args.profile?.display_name);
  const profileEmail = toStringOrNull(args.profile?.email);
  const snapshotEmail = toStringOrNull(args.requesterEmailSnapshot);
  const claimSnapshotEmail = getRequesterEmailFromClaimSnapshot(args.claimSnapshot);
  const resolvedEmail = profileEmail || snapshotEmail || claimSnapshotEmail || '';

  const requesterName =
    profileName ||
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

  if (requesterProfileId) {
    const requesterLookup = await adminClient
      .from('profiles')
      .select(selectClause)
      .eq('id', requesterProfileId)
      .maybeSingle();

    if (requesterLookup.data || requesterLookup.error) {
      return requesterLookup as { data: ProfileContext | null; error: unknown };
    }
  }

  if (fallbackStoryOwnerId && fallbackStoryOwnerId !== requesterProfileId) {
    return (await adminClient
      .from('profiles')
      .select(selectClause)
      .eq('id', fallbackStoryOwnerId)
      .maybeSingle()) as { data: ProfileContext | null; error: unknown };
  }

  return { data: null, error: null };
}

async function getImpactVerificationRequestByToken(
  adminClient: ReturnType<typeof createAdminClient>,
  token: string
) {
  const { data, error } = await adminClient
    .from('impact_story_verification_requests')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error && isRelationMissingError(error)) {
    return { data: null, error: null };
  }

  return { data, error };
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

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    // 1) Try impact story verification first (new flow)
    try {
      const adminClient = createAdminClient();
      const { data: impactVerification, error: impactVerificationError } =
        await getImpactVerificationRequestByToken(adminClient, token);

      if (impactVerificationError) {
        console.error('Impact verification lookup error:', impactVerificationError);
      }

      if (impactVerification) {
        if (
          impactVerification.expires_at &&
          new Date(impactVerification.expires_at) < new Date() &&
          impactVerification.status === 'pending'
        ) {
          await adminClient
            .from('impact_story_verification_requests')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', impactVerification.id);

          impactVerification.status = 'expired';
        }

        const { data: impactStory, error: impactStoryError } = await getImpactStoryContext(
          adminClient,
          impactVerification.impact_story_id
        );
        if (impactStoryError) {
          console.error('Impact story context lookup error:', impactStoryError);
        }

        const { data: requesterProfile, error: requesterProfileError } =
          await getRequesterProfileForImpactVerification(
            adminClient,
            toStringOrNull(impactVerification.requester_profile_id),
            toStringOrNull(impactStory?.user_id)
          );
        if (requesterProfileError) {
          console.error('Impact requester profile lookup error:', requesterProfileError);
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

        return NextResponse.json({
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
              (impactVerification.integrity_status || 'clear') === 'flagged'
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
      }
    } catch (impactError) {
      console.error('Impact verification lookup failed, continuing to skill lookup:', impactError);
    }

    // 2) Fallback to existing skill verification flow
    const { data: verification, error: verificationError } =
      await getSkillVerificationByTokenOrLegacyId(
        supabase,
        token,
        `
        id,
        skill_id,
        requester_profile_id,
        verifier_email,
        verifier_source,
        message,
        status,
        requires_authenticated_verifier,
        integrity_status,
        integrity_reason,
        created_at,
        expires_at,
        skills (
          skill_id,
          skill_code,
          taxonomy:skill_code (
            name_i18n
          )
        )
      `
      );

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      if (verification.status === 'pending') {
        await supabase
          .from('skill_verification_requests')
          .update({ status: 'expired' })
          .eq('id', verification.id);
      }

      return NextResponse.json({
        verification: {
          ...formatVerificationResponse(verification),
          verification_type: 'skill',
          status: 'expired',
        },
      });
    }

    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, email')
      .eq('id', verification.requester_profile_id)
      .single();

    const skill = verification.skills as any;
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

    return NextResponse.json({
      verification: {
        id: verification.id,
        verification_type: 'skill',
        skill_name: skillName,
        skill_code: skill?.skill_code || null,
        requester_name:
          requesterProfile?.display_name || requesterProfile?.email?.split('@')[0] || 'Unknown',
        requester_email: requesterProfile?.email || '',
        requester_avatar: requesterProfile?.avatar_url || null,
        verifier_source: verification.verifier_source,
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
      },
    });
  } catch (error) {
    console.error('Verify GET error:', error);
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
    const supabase = await createClient();
    const { token } = await params;
    const body = await request.json();

    const validated = VerifyResponseSchema.parse(body);

    if (!token || token.length < 32) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    const authIdentity = await getOptionalAuthIdentity(supabase);
    const responderFingerprints = extractRequestFingerprints(request.headers);

    // 1) Try new impact-story verification flow first
    try {
      const adminClient = createAdminClient();
      const { data: impactVerification, error: impactVerificationError } =
        await getImpactVerificationRequestByToken(adminClient, token);

      if (impactVerificationError) {
        console.error('Impact verification lookup error:', impactVerificationError);
      }

      if (impactVerification) {
        if (impactVerification.status !== 'pending') {
          return NextResponse.json(
            { error: `This request has already been ${impactVerification.status}` },
            { status: 400 }
          );
        }

        if (impactVerification.expires_at && new Date(impactVerification.expires_at) < new Date()) {
          await adminClient
            .from('impact_story_verification_requests')
            .update({ status: 'expired', updated_at: new Date().toISOString() })
            .eq('id', impactVerification.id);

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
              {
                error: 'Signed-in account does not match the intended verifier.',
                code: 'VERIFIER_IDENTITY_MISMATCH',
              },
              { status: 403 }
            );
          }
        }

        const { data: impactStory, error: impactStoryError } = await getImpactStoryContext(
          adminClient,
          impactVerification.impact_story_id
        );
        if (impactStoryError) {
          console.error('Impact story context lookup error (POST):', impactStoryError);
        }

        const claims = resolveImpactClaims(impactVerification.claim_snapshot, impactStory || null);
        const confirmedClaimIds = new Set(validated.confirmedClaimIds || []);
        const outcomeClaims = claims.outcomeClaims;
        const roleClaimId = claims.roleClaim.id;
        const artifactsClaimId = claims.artifactsClaim.id;

        const confirmedOutcomeIds =
          validated.action === 'accept'
            ? outcomeClaims
                .filter((claim) => claim.id && confirmedClaimIds.has(claim.id))
                .map((claim) => claim.outcomeId)
                .filter((outcomeId): outcomeId is string => Boolean(outcomeId))
            : [];

        const confirmedRole = validated.action === 'accept' && confirmedClaimIds.has(roleClaimId);
        const confirmedArtifacts =
          validated.action === 'accept' &&
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

        const { error: responseInsertError } = await adminClient
          .from('impact_story_verification_responses')
          .insert({
            request_id: impactVerification.id,
            responder_email:
              authIdentity.email || normalizedVerifierEmail || impactVerification.verifier_email,
            action: validated.action,
            confirmed_role: confirmedRole,
            confirmed_artifacts: confirmedArtifacts,
            confirmed_outcome_ids: confirmedOutcomeIds,
            response_note: validated.message || null,
          });

        if (responseInsertError) {
          console.error('Failed to insert impact verification response:', responseInsertError);
          return NextResponse.json(
            { error: 'Failed to record verification response' },
            { status: 500 }
          );
        }

        const nextStatus = validated.action === 'accept' ? 'accepted' : 'declined';

        const { error: requestUpdateError } = await adminClient
          .from('impact_story_verification_requests')
          .update({
            status: nextStatus,
            responded_at: respondedAt,
            response_message: validated.message || null,
            responder_ip_hash: responderFingerprints.ipHash,
            responder_user_agent_hash: responderFingerprints.userAgentHash,
            response_auth_method: getResponseAuthMethod(authIdentity),
            response_actor_email: authIdentity.email,
            verifier_profile_id:
              authIdentity.profileId || impactVerification.verifier_profile_id || null,
            risk_signals: mergedIntegrity.riskSignals,
            integrity_status: mergedIntegrity.integrityStatus,
            integrity_reason: mergedIntegrity.integrityReason,
            integrity_meta: integrityMeta,
            integrity_flagged_at:
              mergedIntegrity.integrityStatus === 'flagged'
                ? impactVerification.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
                : null,
            updated_at: respondedAt,
          })
          .eq('id', impactVerification.id);

        if (requestUpdateError) {
          console.error('Failed to update impact verification request:', requestUpdateError);
          return NextResponse.json(
            { error: 'Failed to update verification request' },
            { status: 500 }
          );
        }

        if (
          validated.action === 'accept' &&
          mergedIntegrity.integrityStatus === 'clear' &&
          (confirmedRole || confirmedArtifacts || confirmedOutcomeIds.length > 0)
        ) {
          const { error: impactStoryUpdateError } = await adminClient
            .from('impact_stories')
            .update({
              verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', impactVerification.impact_story_id);

          if (impactStoryUpdateError) {
            console.error('Failed to mark impact story verified:', impactStoryUpdateError);
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
            const actionLabel = validated.action === 'accept' ? 'accepted' : 'declined';
            const storyTitle = impactStory?.title || 'impact story';
            const confirmedCount =
              (confirmedRole ? 1 : 0) + (confirmedArtifacts ? 1 : 0) + confirmedOutcomeIds.length;

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
                    validated.action === 'accept'
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
          console.error('Failed to send impact verification notification email:', impactEmailError);
        }

        await writeVerificationAuditLog({
          actorId: authIdentity.profileId,
          action: 'verification.response.recorded',
          targetType: 'impact_story_verification_request',
          targetId: impactVerification.id,
          meta: {
            response_status: nextStatus,
            response_action: validated.action,
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
            validated.action === 'accept'
              ? 'Impact story claims verified successfully.'
              : 'Your response has been recorded.',
        });
      }
    } catch (impactError) {
      console.error('Impact verification submit failed, continuing to skill flow:', impactError);
    }

    // 2) Fallback to existing skill verification flow
    const { data: verification, error: verificationError } =
      await getSkillVerificationByTokenOrLegacyId(
        supabase,
        token,
        `
        id, 
        skill_id, 
        status, 
        expires_at, 
        requester_profile_id,
        verifier_email,
        verifier_source,
        verifier_profile_id,
        requires_authenticated_verifier,
        integrity_status,
        integrity_reason,
        integrity_meta,
        integrity_flagged_at,
        risk_signals,
        requester_ip_hash,
        requester_user_agent_hash,
        skills (
          skill_code,
          custom_skill_name,
          taxonomy:skill_code (
            name_i18n
          )
        )
      `
      );

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Verification request not found or invalid token' },
        { status: 404 }
      );
    }

    const normalizedSkillVerifierEmail = normalizeEmail(verification.verifier_email);
    if (verification.requires_authenticated_verifier) {
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
          {
            error: 'Signed-in account does not match the intended verifier.',
            code: 'VERIFIER_IDENTITY_MISMATCH',
          },
          { status: 403 }
        );
      }
    }

    if (verification.status !== 'pending') {
      return NextResponse.json(
        { error: `This request has already been ${verification.status}` },
        { status: 400 }
      );
    }

    if (verification.expires_at && new Date(verification.expires_at) < new Date()) {
      await supabase
        .from('skill_verification_requests')
        .update({ status: 'expired' })
        .eq('id', verification.id);

      return NextResponse.json({ error: 'This verification request has expired' }, { status: 400 });
    }

    const newStatus = validated.action === 'accept' ? 'accepted' : 'declined';
    const respondedAt = new Date().toISOString();
    const sameDeviceSignal = hasSameDeviceSignal({
      requesterIpHash: verification.requester_ip_hash,
      requesterUserAgentHash: verification.requester_user_agent_hash,
      responderIpHash: responderFingerprints.ipHash,
      responderUserAgentHash: responderFingerprints.userAgentHash,
    });
    const mergedIntegrity = mergeIntegrityWithResponseSignal({
      currentStatus: verification.integrity_status,
      currentReason: verification.integrity_reason,
      currentSignals: verification.risk_signals,
      sameDeviceSignal,
    });

    const existingSkillIntegrityMeta =
      verification.integrity_meta && typeof verification.integrity_meta === 'object'
        ? (verification.integrity_meta as Record<string, unknown>)
        : {};

    const skillIntegrityMeta = {
      ...existingSkillIntegrityMeta,
      response: {
        same_device_signal: sameDeviceSignal,
        response_auth_method: getResponseAuthMethod(authIdentity),
        response_actor_email: authIdentity.email,
        responded_at: respondedAt,
      },
    };

    const { error: updateError } = await supabase
      .from('skill_verification_requests')
      .update({
        status: newStatus,
        responded_at: respondedAt,
        response_message: validated.message || null,
        responder_ip_hash: responderFingerprints.ipHash,
        responder_user_agent_hash: responderFingerprints.userAgentHash,
        response_auth_method: getResponseAuthMethod(authIdentity),
        response_actor_email: authIdentity.email,
        verifier_profile_id: authIdentity.profileId || verification.verifier_profile_id || null,
        risk_signals: mergedIntegrity.riskSignals,
        integrity_status: mergedIntegrity.integrityStatus,
        integrity_reason: mergedIntegrity.integrityReason,
        integrity_meta: skillIntegrityMeta,
        integrity_flagged_at:
          mergedIntegrity.integrityStatus === 'flagged'
            ? verification.integrity_flagged_at || mergedIntegrity.integrityFlaggedAt
            : null,
      })
      .eq('id', verification.id);

    if (updateError) {
      console.error('Error updating verification:', updateError);
      return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
    }

    if (validated.action === 'accept' && mergedIntegrity.integrityStatus === 'clear') {
      const { data: skill } = await supabase
        .from('skills')
        .select('evidence_strength')
        .eq('id', verification.skill_id)
        .single();

      const currentStrength = parseFloat(skill?.evidence_strength || '0');
      const newStrength = Math.min(currentStrength + 0.2, 1.0);

      await supabase
        .from('skills')
        .update({
          evidence_strength: newStrength.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', verification.skill_id);
    }

    try {
      const { emitVerificationProvided } = await import('@/lib/analytics/events');
      await emitVerificationProvided(verification.requester_profile_id, verification.id, {
        skill_id: verification.skill_id,
        requester_id: verification.requester_profile_id,
        action: validated.action === 'accept' ? 'accepted' : 'declined',
      });
    } catch (analyticsError) {
      console.error('Failed to emit attestation_provided event:', analyticsError);
    }

    try {
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('email, display_name')
        .eq('id', verification.requester_profile_id)
        .single();

      if (requesterProfile?.email) {
        const skill = verification.skills as any;
        let skillName = 'your skill';
        if (skill?.taxonomy?.name_i18n?.en) {
          skillName = skill.taxonomy.name_i18n.en;
        } else if (skill?.custom_skill_name) {
          skillName = skill.custom_skill_name;
        }

        const actionText = validated.action === 'accept' ? 'verified' : 'declined to verify';
        const actionEmoji = validated.action === 'accept' ? '✅' : '❌';
        const relationshipText = verification.verifier_source || 'your contact';

        const baseUrl = normalizeBaseUrl(
          process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
        );
        const expertiseUrl = `${baseUrl}/app/i/expertise`;

        await sendEmail({
          to: requesterProfile.email,
          subject: `${actionEmoji} Your skill verification request was ${validated.action === 'accept' ? 'accepted' : 'declined'}`,
          html: `
            <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a1a; margin-bottom: 16px;">
                Skill Verification Update
              </h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                Hi${requesterProfile.display_name ? ` ${requesterProfile.display_name}` : ''},
              </p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                <strong>${relationshipText}</strong> (${verification.verifier_email}) has ${actionText} your 
                <strong>"${skillName}"</strong> skill.
              </p>
              ${
                validated.message
                  ? `
                <div style="background: #f5f5f5; border-left: 4px solid ${validated.action === 'accept' ? '#22c55e' : '#ef4444'}; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="color: #6b6b6b; font-size: 14px; margin: 0 0 8px 0;">Their message:</p>
                  <p style="color: #4a4a4a; font-size: 15px; margin: 0; font-style: italic;">"${validated.message}"</p>
                </div>
              `
                  : ''
              }
              <div style="margin-top: 24px;">
                <a href="${expertiseUrl}" 
                   style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500;">
                  View Your Expertise Atlas
                </a>
              </div>
            </div>
          `,
          text: `Your skill verification request was ${validated.action === 'accept' ? 'accepted' : 'declined'}.\n\n${relationshipText} (${verification.verifier_email}) has ${actionText} your "${skillName}" skill.${validated.message ? `\n\nTheir message: "${validated.message}"` : ''}\n\nView your Expertise Atlas: ${expertiseUrl}`,
        });
      }
    } catch (emailError) {
      console.error('Failed to send verification notification email:', emailError);
    }

    await writeVerificationAuditLog({
      actorId: authIdentity.profileId,
      action: 'verification.response.recorded',
      targetType: 'skill_verification_request',
      targetId: verification.id,
      meta: {
        response_status: newStatus,
        response_action: validated.action,
        requires_authenticated_verifier: verification.requires_authenticated_verifier || false,
        response_auth_method: getResponseAuthMethod(authIdentity),
        response_actor_email: authIdentity.email,
        integrity_status: mergedIntegrity.integrityStatus,
        integrity_reason: mergedIntegrity.integrityReason,
        same_device_signal: sameDeviceSignal,
      },
    });

    return NextResponse.json({
      success: true,
      verification_type: 'skill',
      status: newStatus,
      integrity_status: mergedIntegrity.integrityStatus,
      integrity_reason:
        mergedIntegrity.integrityStatus === 'flagged' ? mergedIntegrity.integrityReason : null,
      message:
        validated.action === 'accept'
          ? 'Thank you for verifying this skill!'
          : 'Your response has been recorded.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Verify POST error:', error);
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
