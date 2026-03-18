import { randomUUID } from 'node:crypto';

import { and, desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { verificationRecords } from '@/db/schema';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';
import { upsertCanonicalVerificationRecord } from '@/lib/canonical/repository';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  inspectCapabilityToken,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import { getRows } from '@/lib/db/rows';
import { normalizeEmail } from '@/lib/verification/integrity';
import { CANONICAL_REQUEST_TRANSPORTS } from '@/lib/verification/canonical-requests';

type VerificationRecordRow = typeof verificationRecords.$inferSelect;

type CanonicalImpactRequestStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'failed'
  | 'cancelled'
  | 'revoked';

type CanonicalImpactRequestMetadata = {
  requestTransport?: string;
  requesterEmailSnapshot?: string | null;
  verifierEmail?: string | null;
  verifierName?: string | null;
  verifierRelationship?: string | null;
  message?: string | null;
  claimSnapshot?: Record<string, unknown> | null;
  capabilityTokenId?: string | null;
  emailSent?: boolean | null;
  emailError?: string | null;
  requiresAuthenticatedVerifier?: boolean | null;
  integrityMeta?: Record<string, unknown> | null;
  integrityFlaggedAt?: string | null;
  responseAuthMethod?: 'token' | 'authenticated' | null;
  responseActorEmail?: string | null;
  responseMessage?: string | null;
} & Record<string, unknown>;

export type CanonicalImpactVerificationRequestRecord = {
  id: string;
  impact_story_id: string;
  custom_request_id: string | null;
  requester_profile_id: string;
  requester_email_snapshot: string | null;
  verifier_email: string;
  verifier_name: string | null;
  verifier_relationship: string | null;
  message: string | null;
  claim_snapshot: Record<string, unknown>;
  status: CanonicalImpactRequestStatus;
  created_at: string;
  responded_at: string | null;
  response_message: string | null;
  expires_at: string | null;
  capability_token_id: string | null;
  email_sent: boolean;
  email_error: string | null;
  requires_authenticated_verifier: boolean;
  verification_kind: VerificationRecordRow['verificationKind'];
  integrity_status: VerificationRecordRow['integrityStatus'];
  integrity_reason: string | null;
  dispute_state: VerificationRecordRow['disputeState'];
  integrity_meta: Record<string, unknown>;
  integrity_flagged_at: string | null;
  risk_signals: Record<string, unknown>;
  contradicted_at: string | null;
  revoked_at: string | null;
  verifier_profile_id: string | null;
  response_auth_method: 'token' | 'authenticated' | null;
  response_actor_email: string | null;
};

export type CanonicalImpactVerificationRequestTokenLookupResult =
  | {
      data: CanonicalImpactVerificationRequestRecord & {
        source_request_table: 'verification_records';
        source_request_id: string;
        requester_ip_hash: null;
        requester_user_agent_hash: null;
      };
      error: null;
    }
  | {
      data: null;
      error: 'invalid' | 'expired' | 'revoked' | null;
    };

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function toMetadata(
  record: Pick<VerificationRecordRow, 'metadata'>
): CanonicalImpactRequestMetadata {
  return record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
    ? (record.metadata as CanonicalImpactRequestMetadata)
    : {};
}

function normalizeCanonicalStatus(
  status: VerificationRecordRow['status']
): CanonicalImpactRequestStatus {
  switch (status) {
    case 'verified':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'expired':
      return 'expired';
    case 'failed':
      return 'failed';
    case 'cancelled':
      return 'cancelled';
    case 'revoked':
      return 'revoked';
    default:
      return 'pending';
  }
}

export function isCanonicalImpactVerificationRequestRecord(
  record: Pick<VerificationRecordRow, 'metadata' | 'subjectType'>
): boolean {
  const metadata = toMetadata(record);
  return (
    record.subjectType === 'impact_story' &&
    metadata.requestTransport === CANONICAL_REQUEST_TRANSPORTS.impact
  );
}

export function mapCanonicalImpactVerificationRequestRecord(
  record: VerificationRecordRow
): CanonicalImpactVerificationRequestRecord {
  const metadata = toMetadata(record);
  const verifierEmail = normalizeEmail(metadata.verifierEmail || null) || '';

  return {
    id: record.id,
    impact_story_id: record.subjectId,
    custom_request_id:
      typeof metadata.customRequestId === 'string' ? metadata.customRequestId : null,
    requester_profile_id: record.ownerId,
    requester_email_snapshot:
      typeof metadata.requesterEmailSnapshot === 'string' ? metadata.requesterEmailSnapshot : null,
    verifier_email: verifierEmail,
    verifier_name: typeof metadata.verifierName === 'string' ? metadata.verifierName : null,
    verifier_relationship:
      typeof metadata.verifierRelationship === 'string' ? metadata.verifierRelationship : null,
    message: typeof metadata.message === 'string' ? metadata.message : null,
    claim_snapshot:
      metadata.claimSnapshot &&
      typeof metadata.claimSnapshot === 'object' &&
      !Array.isArray(metadata.claimSnapshot)
        ? (metadata.claimSnapshot as Record<string, unknown>)
        : {},
    status: normalizeCanonicalStatus(record.status),
    created_at: record.createdAt.toISOString(),
    responded_at: record.completedAt?.toISOString() || null,
    response_message:
      typeof metadata.responseMessage === 'string' ? metadata.responseMessage : null,
    expires_at: record.expiresAt?.toISOString() || null,
    capability_token_id:
      typeof metadata.capabilityTokenId === 'string' ? metadata.capabilityTokenId : null,
    email_sent: metadata.emailSent !== false,
    email_error: typeof metadata.emailError === 'string' ? metadata.emailError : null,
    requires_authenticated_verifier: Boolean(metadata.requiresAuthenticatedVerifier),
    verification_kind: record.verificationKind,
    integrity_status: record.integrityStatus,
    integrity_reason: record.integrityReason || null,
    dispute_state: record.disputeState,
    integrity_meta:
      metadata.integrityMeta &&
      typeof metadata.integrityMeta === 'object' &&
      !Array.isArray(metadata.integrityMeta)
        ? (metadata.integrityMeta as Record<string, unknown>)
        : {},
    integrity_flagged_at:
      typeof metadata.integrityFlaggedAt === 'string' ? metadata.integrityFlaggedAt : null,
    risk_signals:
      record.riskSignals &&
      typeof record.riskSignals === 'object' &&
      !Array.isArray(record.riskSignals)
        ? (record.riskSignals as Record<string, unknown>)
        : {},
    contradicted_at: record.contradictedAt?.toISOString() || null,
    revoked_at: record.revokedAt?.toISOString() || null,
    verifier_profile_id: record.verifierProfileId || null,
    response_auth_method:
      metadata.responseAuthMethod === 'authenticated' || metadata.responseAuthMethod === 'token'
        ? metadata.responseAuthMethod
        : null,
    response_actor_email:
      typeof metadata.responseActorEmail === 'string' ? metadata.responseActorEmail : null,
  };
}

export async function findExistingCanonicalImpactVerificationRequest(params: {
  ownerId: string;
  impactStoryId: string;
  verifierEmail: string;
}) {
  const normalizedVerifierEmail = normalizeEmail(params.verifierEmail);
  if (!normalizedVerifierEmail || !isUuid(params.ownerId) || !isUuid(params.impactStoryId)) {
    return null;
  }

  const result = await db.execute(sql`
    SELECT *
    FROM verification_records
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${params.ownerId}::uuid
      AND subject_type = 'impact_story'
      AND subject_id = ${params.impactStoryId}::uuid
      AND status = 'pending'
      AND metadata->>'requestTransport' = ${CANONICAL_REQUEST_TRANSPORTS.impact}
      AND lower(coalesce(metadata->>'verifierEmail', '')) = ${normalizedVerifierEmail}
    ORDER BY created_at DESC
    LIMIT 1
  `);

  const row = (getRows(result)[0] ?? null) as VerificationRecordRow | null;
  return row && isCanonicalImpactVerificationRequestRecord(row) ? row : null;
}

export async function createCanonicalImpactVerificationRequest(params: {
  ownerId: string;
  impactStoryId: string;
  storyTitle: string;
  requesterName: string;
  requesterEmailSnapshot?: string | null;
  verifierEmail: string;
  verifierName?: string | null;
  verifierRelationship?: string | null;
  verifierProfileId?: string | null;
  message?: string | null;
  claimSnapshot: Record<string, unknown>;
  integrityStatus?: VerificationRecordRow['integrityStatus'];
  integrityReason?: string | null;
  riskSignals?: Record<string, unknown>;
  requiresAuthenticatedVerifier?: boolean;
}) {
  const normalizedVerifierEmail = normalizeEmail(params.verifierEmail);
  if (!normalizedVerifierEmail) {
    throw new Error('Verifier email is required');
  }
  if (!isUuid(params.ownerId) || !isUuid(params.impactStoryId)) {
    throw new Error('Canonical impact verification requests require UUID owner and subject ids');
  }

  const requestId = randomUUID();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const issued = await issueCapabilityToken({
    tokenClass: CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE,
    sourceTable: 'verification_records',
    sourceId: requestId,
    actionScope: 'impact_verification.respond',
    subjectType: 'impact_verification_request',
    subjectId: requestId,
    actorBinding: params.verifierProfileId
      ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
      : CAPABILITY_BINDINGS.EMAIL_HASH,
    actorEmail: normalizedVerifierEmail,
    actorProfileId: params.verifierProfileId || null,
    expiresAt,
    singleUse: true,
    maxUses: 1,
    scopeKey: `impact_verification:${params.impactStoryId}:${normalizedVerifierEmail}`,
    revokePriorActiveTokensForScope: true,
    metadata: {
      impactStoryId: params.impactStoryId,
      requestTransport: CANONICAL_REQUEST_TRANSPORTS.impact,
    },
  });

  const record = await upsertCanonicalVerificationRecord({
    id: requestId,
    ownerType: 'individual_profile',
    ownerId: params.ownerId,
    subjectType: 'impact_story',
    subjectId: params.impactStoryId,
    verificationSlot: 'impact_story.attestation',
    verificationKind: 'impact_attestation',
    status: 'pending',
    verifierPrincipalType: params.verifierProfileId ? 'user_account' : 'external_email',
    verifierClass: 'authenticated_external',
    verifierProfileId: params.verifierProfileId || null,
    verifierEmailHash: hashOpaqueToken(normalizedVerifierEmail),
    verifierDomainSnapshot: normalizedVerifierEmail.split('@')[1] || null,
    integrityStatus: params.integrityStatus || 'unknown',
    integrityReason: params.integrityReason || null,
    riskSignals: params.riskSignals || {},
    claimSnapshot: {
      ...params.claimSnapshot,
      requestTransport: CANONICAL_REQUEST_TRANSPORTS.impact,
      impactStoryId: params.impactStoryId,
      storyTitle: params.storyTitle,
    },
    sourceRequestTable: 'verification_records',
    sourceRequestId: requestId,
    requestedAt: new Date(),
    expiresAt,
    metadata: {
      requestTransport: CANONICAL_REQUEST_TRANSPORTS.impact,
      requesterEmailSnapshot: normalizeEmail(params.requesterEmailSnapshot || null),
      verifierEmail: normalizedVerifierEmail,
      verifierName: params.verifierName || null,
      verifierRelationship: params.verifierRelationship || null,
      message: params.message || null,
      claimSnapshot: params.claimSnapshot,
      storyTitle: params.storyTitle,
      requesterName: params.requesterName,
      capabilityTokenId: issued.token.id,
      emailSent: false,
      emailError: null,
      requiresAuthenticatedVerifier: Boolean(params.requiresAuthenticatedVerifier),
      integrityMeta: {},
      integrityFlaggedAt: null,
    },
  });

  return {
    record,
    rawToken: issued.rawToken,
    expiresAt,
  };
}

export async function getCanonicalImpactVerificationRequestById(requestId: string) {
  if (!isUuid(requestId)) {
    return null;
  }

  const row = await db.query.verificationRecords.findFirst({
    where: eq(verificationRecords.id, requestId),
    orderBy: [desc(verificationRecords.createdAt)],
  });

  return row && isCanonicalImpactVerificationRequestRecord(row) ? row : null;
}

export async function getCanonicalImpactVerificationRequestByToken(
  token: string
): Promise<CanonicalImpactVerificationRequestTokenLookupResult> {
  const capabilityLookup = await inspectCapabilityToken(token, {
    tokenClass: CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE,
    metadata: { surface: 'verify_impact_lookup' },
  });

  if (!capabilityLookup.ok) {
    return { data: null, error: capabilityLookup.reason };
  }

  if (!capabilityLookup.token.source_id) {
    return { data: null, error: null };
  }

  const canonicalVerification = await getCanonicalImpactVerificationRequestById(
    capabilityLookup.token.source_id
  ).catch(() => null);

  if (!canonicalVerification) {
    return { data: null, error: null };
  }

  return {
    data: {
      ...mapCanonicalImpactVerificationRequestRecord(canonicalVerification),
      source_request_table: 'verification_records',
      source_request_id: canonicalVerification.id,
      requester_ip_hash: null,
      requester_user_agent_hash: null,
    },
    error: null,
  };
}

export async function listCanonicalImpactVerificationRequestsForOwner(ownerId: string) {
  if (!isUuid(ownerId)) {
    return [];
  }

  const rows = await db.query.verificationRecords.findMany({
    where: and(
      eq(verificationRecords.ownerType, 'individual_profile'),
      eq(verificationRecords.ownerId, ownerId),
      eq(verificationRecords.subjectType, 'impact_story')
    ),
    orderBy: [desc(verificationRecords.createdAt)],
  });

  return rows.filter(
    (row) => isCanonicalImpactVerificationRequestRecord(row) && row.status !== 'cancelled'
  );
}

export async function listCanonicalImpactVerificationRequestsForVerifierEmail(
  verifierEmail: string
) {
  const normalizedVerifierEmail = normalizeEmail(verifierEmail);
  if (!normalizedVerifierEmail) {
    return [];
  }

  const result = await db.execute(sql`
    SELECT *
    FROM verification_records
    WHERE subject_type = 'impact_story'
      AND status <> 'cancelled'
      AND metadata->>'requestTransport' = ${CANONICAL_REQUEST_TRANSPORTS.impact}
      AND lower(coalesce(metadata->>'verifierEmail', '')) = ${normalizedVerifierEmail}
    ORDER BY created_at DESC
  `);

  return getRows(result).filter((row) =>
    isCanonicalImpactVerificationRequestRecord(row as VerificationRecordRow)
  ) as VerificationRecordRow[];
}

export async function updateCanonicalImpactVerificationRequest(params: {
  requestId: string;
  status: CanonicalImpactRequestStatus;
  respondedAt?: string | Date | null;
  responseMessage?: string | null;
  verifierProfileId?: string | null;
  verifierPrincipalType?: VerificationRecordRow['verifierPrincipalType'];
  verifierEmail?: string | null;
  verifierName?: string | null;
  verifierRelationship?: string | null;
  integrityStatus?: VerificationRecordRow['integrityStatus'];
  integrityReason?: string | null;
  riskSignals?: Record<string, unknown>;
  integrityMeta?: Record<string, unknown>;
  integrityFlaggedAt?: string | null;
  responseAuthMethod?: 'token' | 'authenticated' | null;
  responseActorEmail?: string | null;
  emailSent?: boolean;
  emailError?: string | null;
  capabilityTokenId?: string | null;
  expiresAt?: string | Date | null;
  requestedAt?: string | Date | null;
}) {
  const existing = await getCanonicalImpactVerificationRequestById(params.requestId);
  if (!existing) {
    return null;
  }

  const existingMetadata = toMetadata(existing);
  const respondedAt =
    params.respondedAt != null ? new Date(params.respondedAt) : existing.completedAt || null;
  const normalizedVerifierEmail = normalizeEmail(
    params.verifierEmail || existingMetadata.verifierEmail || null
  );
  const nextMetadata: CanonicalImpactRequestMetadata = {
    ...existingMetadata,
    responseMessage:
      params.responseMessage === undefined
        ? typeof existingMetadata.responseMessage === 'string'
          ? existingMetadata.responseMessage
          : null
        : params.responseMessage,
    responseAuthMethod:
      params.responseAuthMethod === undefined
        ? existingMetadata.responseAuthMethod || null
        : params.responseAuthMethod,
    responseActorEmail:
      params.responseActorEmail === undefined
        ? typeof existingMetadata.responseActorEmail === 'string'
          ? existingMetadata.responseActorEmail
          : null
        : params.responseActorEmail,
    verifierEmail: normalizedVerifierEmail || null,
    verifierName:
      params.verifierName === undefined
        ? typeof existingMetadata.verifierName === 'string'
          ? existingMetadata.verifierName
          : null
        : params.verifierName,
    verifierRelationship:
      params.verifierRelationship === undefined
        ? typeof existingMetadata.verifierRelationship === 'string'
          ? existingMetadata.verifierRelationship
          : null
        : params.verifierRelationship,
    emailSent: params.emailSent === undefined ? existingMetadata.emailSent : params.emailSent,
    emailError:
      params.emailError === undefined
        ? typeof existingMetadata.emailError === 'string'
          ? existingMetadata.emailError
          : null
        : params.emailError,
    capabilityTokenId:
      params.capabilityTokenId === undefined
        ? typeof existingMetadata.capabilityTokenId === 'string'
          ? existingMetadata.capabilityTokenId
          : null
        : params.capabilityTokenId,
    integrityMeta:
      params.integrityMeta === undefined
        ? existingMetadata.integrityMeta || {}
        : params.integrityMeta,
    integrityFlaggedAt:
      params.integrityFlaggedAt === undefined
        ? typeof existingMetadata.integrityFlaggedAt === 'string'
          ? existingMetadata.integrityFlaggedAt
          : null
        : params.integrityFlaggedAt,
  };

  const nextStatus =
    params.status === 'accepted'
      ? 'verified'
      : params.status === 'declined'
        ? 'declined'
        : params.status === 'expired'
          ? 'expired'
          : params.status === 'failed'
            ? 'failed'
            : params.status === 'cancelled'
              ? 'cancelled'
              : params.status === 'revoked'
                ? 'revoked'
                : 'pending';

  const requestedAt =
    params.requestedAt !== undefined
      ? params.requestedAt
        ? new Date(params.requestedAt)
        : null
      : existing.requestedAt;
  const expiresAt =
    params.expiresAt !== undefined
      ? params.expiresAt
        ? new Date(params.expiresAt)
        : null
      : existing.expiresAt;

  return upsertCanonicalVerificationRecord({
    id: existing.id,
    ownerType: existing.ownerType,
    ownerId: existing.ownerId,
    subjectType: existing.subjectType,
    subjectId: existing.subjectId,
    proofArtifactId: existing.proofArtifactId || null,
    verificationSlot: existing.verificationSlot,
    verificationKind: existing.verificationKind,
    status: nextStatus,
    verifierPrincipalType:
      params.verifierPrincipalType || existing.verifierPrincipalType || 'external_email',
    verifierClass: existing.verifierClass,
    verifierProfileId: params.verifierProfileId ?? existing.verifierProfileId ?? null,
    verifierOrgId: existing.verifierOrgId || null,
    verifierEmailHash: normalizedVerifierEmail
      ? hashOpaqueToken(normalizedVerifierEmail)
      : existing.verifierEmailHash,
    verifierDomainSnapshot:
      normalizedVerifierEmail && normalizedVerifierEmail.includes('@')
        ? normalizedVerifierEmail.split('@')[1] || null
        : existing.verifierDomainSnapshot || null,
    integrityStatus: params.integrityStatus || existing.integrityStatus,
    integrityReason: params.integrityReason ?? existing.integrityReason ?? null,
    disputeState: existing.disputeState,
    badgeSemanticsVersion: existing.badgeSemanticsVersion,
    riskSignals: params.riskSignals || (existing.riskSignals as Record<string, unknown>) || {},
    claimSnapshot:
      existing.claimSnapshot && typeof existing.claimSnapshot === 'object'
        ? (existing.claimSnapshot as Record<string, unknown>)
        : {},
    sourceRequestTable: existing.sourceRequestTable || 'verification_records',
    sourceRequestId: existing.sourceRequestId || existing.id,
    sourceResponseTable: existing.sourceResponseTable || 'verification_records',
    sourceResponseId: existing.sourceResponseId || existing.id,
    requestedAt,
    expiresAt,
    requestExpiresAt: expiresAt,
    followUpDueAt: existing.followUpDueAt,
    lastFollowUpAt: existing.lastFollowUpAt,
    lastRefreshedAt: respondedAt || existing.lastRefreshedAt,
    completedAt:
      params.status === 'pending' || params.status === 'expired' || params.status === 'cancelled'
        ? existing.completedAt
        : respondedAt,
    expiredAt: params.status === 'expired' ? respondedAt || existing.expiredAt : existing.expiredAt,
    revokedAt: params.status === 'revoked' ? respondedAt || existing.revokedAt : existing.revokedAt,
    cancelledAt:
      params.status === 'cancelled' ? respondedAt || existing.cancelledAt : existing.cancelledAt,
    failureCode: existing.failureCode,
    verifiedAt: params.status === 'accepted' ? respondedAt : existing.verifiedAt,
    metadata: nextMetadata,
  });
}
