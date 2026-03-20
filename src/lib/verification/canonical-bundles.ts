import { randomUUID } from 'node:crypto';

import { desc, eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { verificationRecords } from '@/db/schema';
import { getRows } from '@/lib/db/rows';
import { upsertCanonicalVerificationRecord } from '@/lib/canonical/repository';
import { hashOpaqueToken } from '@/lib/contracts/canonical-domain';
import {
  CAPABILITY_BINDINGS,
  CAPABILITY_TOKEN_CLASSES,
  issueCapabilityToken,
} from '@/lib/security/capability-tokens';
import {
  CANONICAL_REQUEST_TRANSPORTS,
  isCanonicalSkillVerificationRequestRecord,
  mapCanonicalSkillVerificationRequestRecord,
  updateCanonicalSkillVerificationRequest,
} from '@/lib/verification/canonical-requests';
import {
  isCanonicalImpactVerificationRequestRecord,
  mapCanonicalImpactVerificationRequestRecord,
  updateCanonicalImpactVerificationRequest,
} from '@/lib/verification/canonical-impact-requests';
import { normalizeEmail } from '@/lib/verification/integrity';
import {
  getClaimTemplateLabel,
  getSupportLabel,
  resolveClaimTemplate,
} from '@/lib/verification/scoped-contract';

type VerificationRecordRow = typeof verificationRecords.$inferSelect;

export const CANONICAL_BUNDLE_REQUEST_TRANSPORT = 'custom_verification_bundle';

export type CanonicalBundleArtifactType =
  | 'skill'
  | 'experience'
  | 'education'
  | 'impact_story'
  | 'project'
  | 'volunteering';

export type CanonicalBundleSelection = {
  type: CanonicalBundleArtifactType;
  id: string;
  label: string;
};

type CanonicalBundleMetadata = Record<string, unknown> & {
  customRequestId?: string | null;
  verifierEmail?: string | null;
  verifierRelationship?: string | null;
  verifierSource?: 'peer' | 'manager' | 'external' | null;
  requestKind?: 'generic_verification' | 'human_observed_attestation' | null;
  attestationRequest?: Record<string, unknown> | null;
  attestationResponse?: Record<string, unknown> | null;
  message?: string | null;
  capabilityTokenId?: string | null;
  emailSent?: boolean | null;
  emailError?: string | null;
  displayLabel?: string | null;
  requesterName?: string | null;
  responseMessage?: string | null;
};

export type CanonicalBundleItem = {
  id: string;
  artifact_type: CanonicalBundleArtifactType;
  artifact_id: string;
  display_label: string;
  claim_template: string;
  claim_label: string;
  support_label: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
};

export type CanonicalBundle = {
  id: string;
  requester_profile_id: string;
  requester_name: string | null;
  verifier_email: string;
  verifier_profile_id: string | null;
  verifier_relationship: string | null;
  verifier_source: 'peer' | 'manager' | 'external';
  request_kind: 'generic_verification' | 'human_observed_attestation';
  attestation_request: Record<string, unknown> | null;
  attestation_response: Record<string, unknown> | null;
  message: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  created_at: string;
  expires_at: string | null;
  responded_at: string | null;
  response_message: string | null;
  capability_token_id: string | null;
  email_sent: boolean;
  email_error: string | null;
  items: CanonicalBundleItem[];
};

type CreateCanonicalBundleParams = {
  ownerId: string;
  requesterName: string;
  requesterEmailSnapshot?: string | null;
  verifierEmail: string;
  verifierProfileId?: string | null;
  verifierRelationship: string;
  verifierSource: 'peer' | 'manager' | 'external';
  requestKind: 'generic_verification' | 'human_observed_attestation';
  attestationRequest?: Record<string, unknown> | null;
  message?: string | null;
  artifacts: CanonicalBundleSelection[];
};

function toMetadata(record: Pick<VerificationRecordRow, 'metadata'>): CanonicalBundleMetadata {
  return record.metadata && typeof record.metadata === 'object' && !Array.isArray(record.metadata)
    ? (record.metadata as CanonicalBundleMetadata)
    : {};
}

function isUuid(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function isCanonicalBundleRecord(record: VerificationRecordRow): boolean {
  const metadata = toMetadata(record);
  return typeof metadata.customRequestId === 'string' && metadata.customRequestId.length > 0;
}

function mapCanonicalBundleRows(rows: VerificationRecordRow[]): CanonicalBundle | null {
  if (rows.length === 0) {
    return null;
  }

  const orderedRows = [...rows].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
  );
  const first = orderedRows[0]!;
  const firstMetadata = toMetadata(first);
  const bundleId =
    typeof firstMetadata.customRequestId === 'string' ? firstMetadata.customRequestId : null;

  if (!bundleId) {
    return null;
  }

  const respondedAt =
    orderedRows
      .map((row) => row.completedAt?.toISOString() || null)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  const responseMessage =
    orderedRows
      .map((row) => {
        const metadata = toMetadata(row);
        return typeof metadata.responseMessage === 'string' ? metadata.responseMessage : null;
      })
      .find((value) => Boolean(value)) ?? null;

  return {
    id: bundleId,
    requester_profile_id: first.ownerId,
    requester_name:
      typeof firstMetadata.requesterName === 'string' ? firstMetadata.requesterName : null,
    verifier_email: normalizeEmail(firstMetadata.verifierEmail || null) || '',
    verifier_profile_id: first.verifierProfileId || null,
    verifier_relationship:
      typeof firstMetadata.verifierRelationship === 'string'
        ? firstMetadata.verifierRelationship
        : null,
    verifier_source:
      (firstMetadata.verifierSource as 'peer' | 'manager' | 'external') || 'external',
    request_kind:
      firstMetadata.requestKind === 'human_observed_attestation'
        ? 'human_observed_attestation'
        : 'generic_verification',
    attestation_request:
      firstMetadata.attestationRequest &&
      typeof firstMetadata.attestationRequest === 'object' &&
      !Array.isArray(firstMetadata.attestationRequest)
        ? (firstMetadata.attestationRequest as Record<string, unknown>)
        : null,
    attestation_response:
      firstMetadata.attestationResponse &&
      typeof firstMetadata.attestationResponse === 'object' &&
      !Array.isArray(firstMetadata.attestationResponse)
        ? (firstMetadata.attestationResponse as Record<string, unknown>)
        : null,
    message: typeof firstMetadata.message === 'string' ? firstMetadata.message : null,
    status: deriveBundleStatus(orderedRows),
    created_at: first.createdAt.toISOString(),
    expires_at: first.expiresAt?.toISOString() || null,
    responded_at: respondedAt,
    response_message: responseMessage,
    capability_token_id:
      typeof firstMetadata.capabilityTokenId === 'string' ? firstMetadata.capabilityTokenId : null,
    email_sent: firstMetadata.emailSent !== false,
    email_error: typeof firstMetadata.emailError === 'string' ? firstMetadata.emailError : null,
    items: orderedRows.map((row) => {
      const metadata = toMetadata(row);
      const claimSnapshot =
        row.claimSnapshot &&
        typeof row.claimSnapshot === 'object' &&
        !Array.isArray(row.claimSnapshot)
          ? (row.claimSnapshot as Record<string, unknown>)
          : {};
      const claimTemplate = resolveClaimTemplate({
        subjectType: row.subjectType,
        verificationKind: row.verificationKind,
        claimSnapshot,
      });
      const claimLabel =
        typeof claimSnapshot.claimLabel === 'string' && claimSnapshot.claimLabel.trim().length > 0
          ? claimSnapshot.claimLabel
          : getClaimTemplateLabel(claimTemplate);
      return {
        id: row.id,
        artifact_type: row.subjectType as CanonicalBundleArtifactType,
        artifact_id: row.subjectId,
        display_label:
          typeof metadata.displayLabel === 'string' && metadata.displayLabel.trim().length > 0
            ? metadata.displayLabel
            : row.subjectId,
        claim_template: claimTemplate,
        claim_label: claimLabel,
        support_label: getSupportLabel(claimTemplate),
        status: toBundleItemStatus(row.status),
        created_at: row.createdAt.toISOString(),
        updated_at: row.updatedAt.toISOString(),
      };
    }),
  } satisfies CanonicalBundle;
}

function mapRecordStatus(
  status: VerificationRecordRow['status']
): CanonicalBundleItem['status'] | 'cancelled' {
  switch (status) {
    case 'verified':
      return 'accepted';
    case 'declined':
    case 'failed':
    case 'revoked':
      return 'declined';
    case 'expired':
      return 'expired';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function toBundleItemStatus(
  status: VerificationRecordRow['status']
): CanonicalBundleItem['status'] {
  const mapped = mapRecordStatus(status);
  return mapped === 'cancelled' ? 'expired' : mapped;
}

function deriveBundleStatus(rows: VerificationRecordRow[]): CanonicalBundle['status'] {
  const statuses = rows.map((row) => mapRecordStatus(row.status));
  if (statuses.some((status) => status === 'pending')) {
    return 'pending';
  }
  if (statuses.every((status) => status === 'cancelled')) {
    return 'cancelled';
  }
  if (statuses.every((status) => status === 'expired' || status === 'cancelled')) {
    return 'expired';
  }
  if (statuses.some((status) => status === 'accepted')) {
    return 'accepted';
  }
  return 'declined';
}

function resolveVerificationKind(
  artifact: CanonicalBundleSelection,
  verifierSource: 'peer' | 'manager' | 'external',
  requestKind: 'generic_verification' | 'human_observed_attestation'
): VerificationRecordRow['verificationKind'] {
  if (artifact.type === 'impact_story') {
    return 'impact_attestation';
  }
  if (artifact.type !== 'skill') {
    return 'platform_manual_review';
  }
  if (requestKind === 'human_observed_attestation') {
    return verifierSource === 'manager' ? 'skill_attestation_manager' : 'skill_attestation_peer';
  }
  if (verifierSource === 'manager') {
    return 'skill_attestation_manager';
  }
  if (verifierSource === 'peer') {
    return 'skill_attestation_peer';
  }
  return 'platform_manual_review';
}

function resolveVerificationSlot(
  artifact: CanonicalBundleSelection
): VerificationRecordRow['verificationSlot'] {
  if (artifact.type === 'impact_story') {
    return 'impact_story.attestation';
  }
  if (artifact.type === 'skill') {
    return 'skill.attestation';
  }
  return 'artifact.attestation';
}

function getTransportForArtifact(artifact: CanonicalBundleSelection) {
  if (artifact.type === 'skill') {
    return CANONICAL_REQUEST_TRANSPORTS.skill;
  }
  if (artifact.type === 'impact_story') {
    return CANONICAL_REQUEST_TRANSPORTS.impact;
  }
  return CANONICAL_BUNDLE_REQUEST_TRANSPORT;
}

function buildBundleScopeKey(ownerId: string, verifierEmail: string) {
  return `custom_verification:${ownerId}:${normalizeEmail(verifierEmail) ?? 'unknown'}`;
}

function buildRecordMetadata(args: {
  bundleId: string;
  tokenId: string;
  requesterName: string;
  requesterEmailSnapshot?: string | null;
  verifierEmail: string;
  verifierRelationship: string;
  verifierSource: 'peer' | 'manager' | 'external';
  requestKind: 'generic_verification' | 'human_observed_attestation';
  attestationRequest?: Record<string, unknown> | null;
  message?: string | null;
  artifact: CanonicalBundleSelection;
}) {
  return {
    customRequestId: args.bundleId,
    requestTransport: getTransportForArtifact(args.artifact),
    requesterName: args.requesterName,
    requesterEmailSnapshot: normalizeEmail(args.requesterEmailSnapshot || null),
    verifierEmail: normalizeEmail(args.verifierEmail),
    verifierRelationship: args.verifierRelationship,
    verifierSource: args.verifierSource,
    requestKind: args.requestKind,
    attestationRequest: args.attestationRequest || null,
    attestationResponse: null,
    message: args.message || null,
    capabilityTokenId: args.tokenId,
    emailSent: false,
    emailError: null,
    displayLabel: args.artifact.label,
    responseMessage: null,
  } satisfies CanonicalBundleMetadata;
}

async function createBundleRecords(
  bundleId: string,
  tokenId: string,
  params: Omit<CreateCanonicalBundleParams, 'artifacts'> & { artifacts: CanonicalBundleSelection[] }
) {
  const now = new Date();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const normalizedVerifierEmail = normalizeEmail(params.verifierEmail);
  const verifierDomain = normalizedVerifierEmail?.split('@')[1] || null;

  const records = await Promise.all(
    params.artifacts.map((artifact) =>
      upsertCanonicalVerificationRecord({
        ownerType: 'individual_profile',
        ownerId: params.ownerId,
        subjectType: artifact.type,
        subjectId: artifact.id,
        verificationSlot: resolveVerificationSlot(artifact),
        verificationKind: resolveVerificationKind(
          artifact,
          params.verifierSource,
          params.requestKind
        ),
        status: 'pending',
        verifierPrincipalType: params.verifierProfileId ? 'user_account' : 'external_email',
        verifierProfileId: params.verifierProfileId || null,
        verifierEmailHash: normalizedVerifierEmail
          ? hashOpaqueToken(normalizedVerifierEmail)
          : null,
        verifierDomainSnapshot: verifierDomain,
        integrityStatus: 'unknown',
        claimSnapshot: {
          artifactType: artifact.type,
          displayLabel: artifact.label,
          requestTransport: getTransportForArtifact(artifact),
          claimTemplate: resolveClaimTemplate({
            subjectType: artifact.type,
            verificationKind: resolveVerificationKind(
              artifact,
              params.verifierSource,
              params.requestKind
            ),
            claimSnapshot: {
              subjectType: artifact.type,
            },
          }),
          claimLabel: getClaimTemplateLabel(
            resolveClaimTemplate({
              subjectType: artifact.type,
              verificationKind: resolveVerificationKind(
                artifact,
                params.verifierSource,
                params.requestKind
              ),
              claimSnapshot: {
                subjectType: artifact.type,
              },
            })
          ),
          subjectType: artifact.type,
        },
        sourceRequestTable: 'verification_records',
        sourceRequestId: bundleId,
        requestedAt: now,
        expiresAt,
        requestExpiresAt: expiresAt,
        metadata: buildRecordMetadata({
          bundleId,
          tokenId,
          requesterName: params.requesterName,
          requesterEmailSnapshot: params.requesterEmailSnapshot,
          verifierEmail: params.verifierEmail,
          verifierRelationship: params.verifierRelationship,
          verifierSource: params.verifierSource,
          requestKind: params.requestKind,
          attestationRequest: params.attestationRequest,
          message: params.message,
          artifact,
        }),
      })
    )
  );

  return { records, expiresAt };
}

export async function createCanonicalVerificationBundle(params: CreateCanonicalBundleParams) {
  const normalizedVerifierEmail = normalizeEmail(params.verifierEmail);
  if (!normalizedVerifierEmail) {
    throw new Error('Verifier email is required');
  }
  if (!isUuid(params.ownerId)) {
    throw new Error('Canonical bundle owner id must be a UUID');
  }

  const bundleId = randomUUID();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  const issued = await issueCapabilityToken({
    tokenClass: CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
    sourceTable: 'verification_records',
    sourceId: bundleId,
    actionScope: 'custom_verification.respond',
    subjectType: 'custom_verification_bundle',
    subjectId: bundleId,
    actorBinding: params.verifierProfileId
      ? CAPABILITY_BINDINGS.EMAIL_THEN_PROFILE_LOCK
      : CAPABILITY_BINDINGS.EMAIL_HASH,
    actorEmail: normalizedVerifierEmail,
    actorProfileId: params.verifierProfileId || null,
    expiresAt,
    singleUse: true,
    maxUses: 1,
    scopeKey: buildBundleScopeKey(params.ownerId, normalizedVerifierEmail),
    revokePriorActiveTokensForScope: true,
    metadata: {
      requestTransport: CANONICAL_BUNDLE_REQUEST_TRANSPORT,
      bundleId,
      artifactCount: params.artifacts.length,
      requestKind: params.requestKind,
    },
  });

  const { records } = await createBundleRecords(bundleId, issued.token.id, params);

  return {
    bundleId,
    rawToken: issued.rawToken,
    token: issued.token,
    expiresAt,
    records,
  };
}

export async function listCanonicalBundleRecords(bundleId: string) {
  const result = await db.execute(sql`
    SELECT *
    FROM verification_records
    WHERE metadata->>'customRequestId' = ${bundleId}
    ORDER BY created_at ASC
  `);

  return getRows(result).filter((row) =>
    isCanonicalBundleRecord(row as VerificationRecordRow)
  ) as VerificationRecordRow[];
}

export async function getCanonicalBundleById(bundleId: string) {
  const rows = await listCanonicalBundleRecords(bundleId);
  return mapCanonicalBundleRows(rows);
}

export async function listCanonicalBundlesForOwner(ownerId: string) {
  if (!isUuid(ownerId)) {
    return [];
  }

  const result = await db.execute(sql`
    SELECT *
    FROM verification_records
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${ownerId}::uuid
      AND coalesce(metadata->>'customRequestId', '') <> ''
    ORDER BY created_at DESC
  `);

  const rows = getRows(result).filter((row) =>
    isCanonicalBundleRecord(row as VerificationRecordRow)
  ) as VerificationRecordRow[];

  const groupedRows = new Map<string, VerificationRecordRow[]>();
  for (const row of rows) {
    const metadata = toMetadata(row);
    if (typeof metadata.customRequestId !== 'string' || metadata.customRequestId.length === 0) {
      continue;
    }

    const existing = groupedRows.get(metadata.customRequestId) ?? [];
    existing.push(row);
    groupedRows.set(metadata.customRequestId, existing);
  }

  return [...groupedRows.values()]
    .map((bundleRows) => mapCanonicalBundleRows(bundleRows))
    .filter((bundle): bundle is CanonicalBundle => Boolean(bundle))
    .filter((bundle) => bundle.status !== 'cancelled')
    .sort(
      (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
    );
}

export async function updateCanonicalBundleDeliveryState(
  bundleId: string,
  params: {
    emailSent: boolean;
    emailError?: string | null;
  }
) {
  const rows = await listCanonicalBundleRecords(bundleId);
  await Promise.all(
    rows.map((row) => {
      if (row.subjectType === 'skill' && isCanonicalSkillVerificationRequestRecord(row)) {
        return updateCanonicalSkillVerificationRequest({
          requestId: row.id,
          status: mapCanonicalSkillVerificationRequestRecord(row).status,
          emailSent: params.emailSent,
          emailError: params.emailError || null,
        });
      }

      if (row.subjectType === 'impact_story' && isCanonicalImpactVerificationRequestRecord(row)) {
        return updateCanonicalImpactVerificationRequest({
          requestId: row.id,
          status: mapCanonicalImpactVerificationRequestRecord(row).status,
          emailSent: params.emailSent,
          emailError: params.emailError || null,
        });
      }

      const metadata = toMetadata(row);
      return upsertCanonicalVerificationRecord({
        id: row.id,
        ownerType: row.ownerType,
        ownerId: row.ownerId,
        subjectType: row.subjectType,
        subjectId: row.subjectId,
        proofArtifactId: row.proofArtifactId || null,
        verificationSlot: row.verificationSlot,
        verificationKind: row.verificationKind,
        status: row.status,
        verifierPrincipalType: row.verifierPrincipalType || 'external_email',
        verifierClass: row.verifierClass,
        verifierProfileId: row.verifierProfileId || null,
        verifierOrgId: row.verifierOrgId || null,
        verifierEmailHash: row.verifierEmailHash,
        verifierDomainSnapshot: row.verifierDomainSnapshot || null,
        integrityStatus: row.integrityStatus,
        integrityReason: row.integrityReason || null,
        disputeState: row.disputeState,
        badgeSemanticsVersion: row.badgeSemanticsVersion,
        riskSignals: (row.riskSignals as Record<string, unknown>) || {},
        claimSnapshot:
          row.claimSnapshot && typeof row.claimSnapshot === 'object'
            ? (row.claimSnapshot as Record<string, unknown>)
            : {},
        sourceRequestTable: row.sourceRequestTable || 'verification_records',
        sourceRequestId: row.sourceRequestId || row.id,
        sourceResponseTable: row.sourceResponseTable || null,
        sourceResponseId: row.sourceResponseId || null,
        requestedAt: row.requestedAt,
        expiresAt: row.expiresAt,
        requestExpiresAt: row.requestExpiresAt,
        followUpDueAt: row.followUpDueAt,
        lastFollowUpAt: row.lastFollowUpAt,
        lastRefreshedAt: row.lastRefreshedAt,
        completedAt: row.completedAt,
        expiredAt: row.expiredAt,
        verifiedAt: row.verifiedAt,
        supersededAt: row.supersededAt,
        supersededByVerificationId: row.supersededByVerificationId,
        downgradedAt: row.downgradedAt,
        contradictedAt: row.contradictedAt,
        contradictedByVerificationId: row.contradictedByVerificationId,
        disputedAt: row.disputedAt,
        revokedAt: row.revokedAt,
        cancelledAt: row.cancelledAt,
        failureCode: row.failureCode,
        metadata: {
          ...metadata,
          emailSent: params.emailSent,
          emailError: params.emailError || null,
        },
      });
    })
  );
}

export async function expireCanonicalBundle(bundleId: string) {
  const rows = await listCanonicalBundleRecords(bundleId);
  const now = new Date().toISOString();
  await Promise.all(
    rows
      .filter((row) => row.status === 'pending')
      .map((row) => {
        if (row.subjectType === 'skill' && isCanonicalSkillVerificationRequestRecord(row)) {
          return updateCanonicalSkillVerificationRequest({
            requestId: row.id,
            status: 'expired',
            respondedAt: now,
          });
        }

        if (row.subjectType === 'impact_story' && isCanonicalImpactVerificationRequestRecord(row)) {
          return updateCanonicalImpactVerificationRequest({
            requestId: row.id,
            status: 'expired',
            respondedAt: now,
          });
        }

        const metadata = toMetadata(row);
        return upsertCanonicalVerificationRecord({
          id: row.id,
          ownerType: row.ownerType,
          ownerId: row.ownerId,
          subjectType: row.subjectType,
          subjectId: row.subjectId,
          proofArtifactId: row.proofArtifactId || null,
          verificationSlot: row.verificationSlot,
          verificationKind: row.verificationKind,
          status: 'expired',
          verifierPrincipalType: row.verifierPrincipalType || 'external_email',
          verifierClass: row.verifierClass,
          verifierProfileId: row.verifierProfileId || null,
          verifierOrgId: row.verifierOrgId || null,
          verifierEmailHash: row.verifierEmailHash,
          verifierDomainSnapshot: row.verifierDomainSnapshot || null,
          integrityStatus: row.integrityStatus,
          integrityReason: row.integrityReason || null,
          disputeState: row.disputeState,
          badgeSemanticsVersion: row.badgeSemanticsVersion,
          riskSignals: (row.riskSignals as Record<string, unknown>) || {},
          claimSnapshot:
            row.claimSnapshot && typeof row.claimSnapshot === 'object'
              ? (row.claimSnapshot as Record<string, unknown>)
              : {},
          sourceRequestTable: row.sourceRequestTable || 'verification_records',
          sourceRequestId: row.sourceRequestId || row.id,
          sourceResponseTable: row.sourceResponseTable || 'verification_records',
          sourceResponseId: row.sourceResponseId || row.id,
          requestedAt: row.requestedAt,
          expiresAt: row.expiresAt,
          requestExpiresAt: row.requestExpiresAt,
          followUpDueAt: row.followUpDueAt,
          lastFollowUpAt: row.lastFollowUpAt,
          lastRefreshedAt: now,
          completedAt: now,
          expiredAt: now,
          verifiedAt: row.verifiedAt,
          supersededAt: row.supersededAt,
          supersededByVerificationId: row.supersededByVerificationId,
          downgradedAt: row.downgradedAt,
          contradictedAt: row.contradictedAt,
          contradictedByVerificationId: row.contradictedByVerificationId,
          disputedAt: row.disputedAt,
          revokedAt: row.revokedAt,
          cancelledAt: row.cancelledAt,
          failureCode: row.failureCode,
          metadata,
        });
      })
  );
}

export async function cancelCanonicalBundleItems(
  bundleId: string,
  itemIds: string[]
): Promise<{ removedSkillRequestIds: string[]; requestExpired: boolean }> {
  const rows = await listCanonicalBundleRecords(bundleId);
  const byId = new Map(rows.map((row) => [row.id, row] as const));
  const now = new Date().toISOString();
  const removedSkillRequestIds: string[] = [];

  await Promise.all(
    itemIds.map((itemId) => {
      const row = byId.get(itemId);
      if (!row || row.status !== 'pending') {
        return Promise.resolve();
      }

      if (row.subjectType === 'skill' && isCanonicalSkillVerificationRequestRecord(row)) {
        removedSkillRequestIds.push(row.id);
        return updateCanonicalSkillVerificationRequest({
          requestId: row.id,
          status: 'cancelled',
          respondedAt: now,
        });
      }

      if (row.subjectType === 'impact_story' && isCanonicalImpactVerificationRequestRecord(row)) {
        return updateCanonicalImpactVerificationRequest({
          requestId: row.id,
          status: 'cancelled',
          respondedAt: now,
        });
      }

      const metadata = toMetadata(row);
      return upsertCanonicalVerificationRecord({
        id: row.id,
        ownerType: row.ownerType,
        ownerId: row.ownerId,
        subjectType: row.subjectType,
        subjectId: row.subjectId,
        proofArtifactId: row.proofArtifactId || null,
        verificationSlot: row.verificationSlot,
        verificationKind: row.verificationKind,
        status: 'cancelled',
        verifierPrincipalType: row.verifierPrincipalType || 'external_email',
        verifierClass: row.verifierClass,
        verifierProfileId: row.verifierProfileId || null,
        verifierOrgId: row.verifierOrgId || null,
        verifierEmailHash: row.verifierEmailHash,
        verifierDomainSnapshot: row.verifierDomainSnapshot || null,
        integrityStatus: row.integrityStatus,
        integrityReason: row.integrityReason || null,
        disputeState: row.disputeState,
        badgeSemanticsVersion: row.badgeSemanticsVersion,
        riskSignals: (row.riskSignals as Record<string, unknown>) || {},
        claimSnapshot:
          row.claimSnapshot && typeof row.claimSnapshot === 'object'
            ? (row.claimSnapshot as Record<string, unknown>)
            : {},
        sourceRequestTable: row.sourceRequestTable || 'verification_records',
        sourceRequestId: row.sourceRequestId || row.id,
        sourceResponseTable: row.sourceResponseTable || 'verification_records',
        sourceResponseId: row.sourceResponseId || row.id,
        requestedAt: row.requestedAt,
        expiresAt: row.expiresAt,
        requestExpiresAt: row.requestExpiresAt,
        followUpDueAt: row.followUpDueAt,
        lastFollowUpAt: row.lastFollowUpAt,
        lastRefreshedAt: now,
        completedAt: now,
        expiredAt: row.expiredAt,
        verifiedAt: row.verifiedAt,
        supersededAt: row.supersededAt,
        supersededByVerificationId: row.supersededByVerificationId,
        downgradedAt: row.downgradedAt,
        contradictedAt: row.contradictedAt,
        contradictedByVerificationId: row.contradictedByVerificationId,
        disputedAt: row.disputedAt,
        revokedAt: row.revokedAt,
        cancelledAt: now,
        failureCode: row.failureCode,
        metadata,
      });
    })
  );

  const updated = await getCanonicalBundleById(bundleId);
  return {
    removedSkillRequestIds,
    requestExpired: Boolean(updated && updated.status !== 'pending'),
  };
}

export async function resendCanonicalBundle(bundleId: string, ownerId: string) {
  const existing = await getCanonicalBundleById(bundleId);
  if (!existing || existing.requester_profile_id !== ownerId) {
    return null;
  }

  const rows = await listCanonicalBundleRecords(bundleId);
  const nextArtifacts = existing.items
    .filter(
      (item) =>
        item.status !== 'expired' || rows.find((row) => row.id === item.id)?.status !== 'cancelled'
    )
    .filter((item) => rows.find((row) => row.id === item.id)?.status !== 'cancelled')
    .map((item) => ({
      type: item.artifact_type,
      id: item.artifact_id,
      label: item.display_label,
    })) as CanonicalBundleSelection[];

  if (nextArtifacts.length === 0) {
    return null;
  }

  await Promise.all(
    rows
      .filter((row) => row.status !== 'cancelled')
      .map((row) => {
        if (row.subjectType === 'skill' && isCanonicalSkillVerificationRequestRecord(row)) {
          return updateCanonicalSkillVerificationRequest({
            requestId: row.id,
            status: 'cancelled',
            respondedAt: new Date().toISOString(),
          });
        }

        if (row.subjectType === 'impact_story' && isCanonicalImpactVerificationRequestRecord(row)) {
          return updateCanonicalImpactVerificationRequest({
            requestId: row.id,
            status: 'cancelled',
            respondedAt: new Date().toISOString(),
          });
        }

        const metadata = toMetadata(row);
        return upsertCanonicalVerificationRecord({
          id: row.id,
          ownerType: row.ownerType,
          ownerId: row.ownerId,
          subjectType: row.subjectType,
          subjectId: row.subjectId,
          proofArtifactId: row.proofArtifactId || null,
          verificationSlot: row.verificationSlot,
          verificationKind: row.verificationKind,
          status: 'cancelled',
          verifierPrincipalType: row.verifierPrincipalType || 'external_email',
          verifierClass: row.verifierClass,
          verifierProfileId: row.verifierProfileId || null,
          verifierOrgId: row.verifierOrgId || null,
          verifierEmailHash: row.verifierEmailHash,
          verifierDomainSnapshot: row.verifierDomainSnapshot || null,
          integrityStatus: row.integrityStatus,
          integrityReason: row.integrityReason || null,
          disputeState: row.disputeState,
          badgeSemanticsVersion: row.badgeSemanticsVersion,
          riskSignals: (row.riskSignals as Record<string, unknown>) || {},
          claimSnapshot:
            row.claimSnapshot && typeof row.claimSnapshot === 'object'
              ? (row.claimSnapshot as Record<string, unknown>)
              : {},
          sourceRequestTable: row.sourceRequestTable || 'verification_records',
          sourceRequestId: row.sourceRequestId || row.id,
          sourceResponseTable: row.sourceResponseTable || 'verification_records',
          sourceResponseId: row.sourceResponseId || row.id,
          requestedAt: row.requestedAt,
          expiresAt: row.expiresAt,
          requestExpiresAt: row.requestExpiresAt,
          followUpDueAt: row.followUpDueAt,
          lastFollowUpAt: row.lastFollowUpAt,
          lastRefreshedAt: new Date(),
          completedAt: new Date(),
          expiredAt: row.expiredAt,
          verifiedAt: row.verifiedAt,
          supersededAt: row.supersededAt,
          supersededByVerificationId: row.supersededByVerificationId,
          downgradedAt: row.downgradedAt,
          contradictedAt: row.contradictedAt,
          contradictedByVerificationId: row.contradictedByVerificationId,
          disputedAt: row.disputedAt,
          revokedAt: row.revokedAt,
          cancelledAt: new Date(),
          failureCode: row.failureCode,
          metadata,
        });
      })
  );

  const requesterName =
    rows
      .map((row) => toMetadata(row).requesterName)
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0) ||
    'A Proofound user';
  const requesterEmailSnapshot =
    rows
      .map((row) => toMetadata(row).requesterEmailSnapshot)
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0) ||
    null;

  return createCanonicalVerificationBundle({
    ownerId,
    requesterName,
    requesterEmailSnapshot,
    verifierEmail: existing.verifier_email,
    verifierProfileId: existing.verifier_profile_id,
    verifierRelationship: existing.verifier_relationship || 'external',
    verifierSource: existing.verifier_source,
    requestKind: existing.request_kind,
    attestationRequest: existing.attestation_request,
    message: existing.message,
    artifacts: nextArtifacts,
  });
}

export async function respondCanonicalBundle(params: {
  bundleId: string;
  action: 'accept' | 'decline';
  responseMessage?: string | null;
  attestationResponse?: Record<string, unknown> | null;
  verifierProfileId?: string | null;
  verifierEmail?: string | null;
  verifierPrincipalType?: VerificationRecordRow['verifierPrincipalType'];
  responseAuthMethod?: 'token' | 'authenticated' | null;
  responseActorEmail?: string | null;
}) {
  const rows = await listCanonicalBundleRecords(params.bundleId);
  const now = new Date().toISOString();
  const normalizedVerifierEmail = normalizeEmail(params.verifierEmail || null);

  await Promise.all(
    rows
      .filter((row) => row.status === 'pending')
      .map((row) => {
        if (row.subjectType === 'skill' && isCanonicalSkillVerificationRequestRecord(row)) {
          return updateCanonicalSkillVerificationRequest({
            requestId: row.id,
            status: params.action === 'accept' ? 'accepted' : 'declined',
            respondedAt: now,
            responseMessage: params.responseMessage || null,
            attestationResponse: params.attestationResponse || null,
            verifierProfileId: params.verifierProfileId || row.verifierProfileId || null,
            verifierPrincipalType:
              params.verifierPrincipalType || row.verifierPrincipalType || 'external_email',
            verifierEmail: normalizedVerifierEmail || null,
            integrityStatus: 'clear',
            responseAuthMethod: params.responseAuthMethod || null,
            responseActorEmail: params.responseActorEmail || null,
          });
        }

        if (row.subjectType === 'impact_story' && isCanonicalImpactVerificationRequestRecord(row)) {
          return updateCanonicalImpactVerificationRequest({
            requestId: row.id,
            status: params.action === 'accept' ? 'accepted' : 'declined',
            respondedAt: now,
            responseMessage: params.responseMessage || null,
            verifierProfileId: params.verifierProfileId || row.verifierProfileId || null,
            verifierPrincipalType:
              params.verifierPrincipalType || row.verifierPrincipalType || 'external_email',
            verifierEmail: normalizedVerifierEmail || null,
            integrityStatus: 'clear',
            responseAuthMethod: params.responseAuthMethod || null,
            responseActorEmail: params.responseActorEmail || null,
          });
        }

        const metadata = toMetadata(row);
        return upsertCanonicalVerificationRecord({
          id: row.id,
          ownerType: row.ownerType,
          ownerId: row.ownerId,
          subjectType: row.subjectType,
          subjectId: row.subjectId,
          proofArtifactId: row.proofArtifactId || null,
          verificationSlot: row.verificationSlot,
          verificationKind: row.verificationKind,
          status: params.action === 'accept' ? 'verified' : 'declined',
          verifierPrincipalType:
            params.verifierPrincipalType || row.verifierPrincipalType || 'external_email',
          verifierClass: row.verifierClass,
          verifierProfileId: params.verifierProfileId || row.verifierProfileId || null,
          verifierOrgId: row.verifierOrgId || null,
          verifierEmailHash: normalizedVerifierEmail
            ? hashOpaqueToken(normalizedVerifierEmail)
            : row.verifierEmailHash,
          verifierDomainSnapshot:
            normalizedVerifierEmail && normalizedVerifierEmail.includes('@')
              ? normalizedVerifierEmail.split('@')[1] || null
              : row.verifierDomainSnapshot || null,
          integrityStatus: 'clear',
          integrityReason: row.integrityReason || null,
          disputeState: row.disputeState,
          badgeSemanticsVersion: row.badgeSemanticsVersion,
          riskSignals: (row.riskSignals as Record<string, unknown>) || {},
          claimSnapshot:
            row.claimSnapshot && typeof row.claimSnapshot === 'object'
              ? (row.claimSnapshot as Record<string, unknown>)
              : {},
          sourceRequestTable: row.sourceRequestTable || 'verification_records',
          sourceRequestId: row.sourceRequestId || row.id,
          sourceResponseTable: 'verification_records',
          sourceResponseId: row.id,
          requestedAt: row.requestedAt,
          expiresAt: row.expiresAt,
          requestExpiresAt: row.requestExpiresAt,
          followUpDueAt: row.followUpDueAt,
          lastFollowUpAt: row.lastFollowUpAt,
          lastRefreshedAt: now,
          completedAt: now,
          expiredAt: row.expiredAt,
          verifiedAt: params.action === 'accept' ? now : row.verifiedAt,
          supersededAt: row.supersededAt,
          supersededByVerificationId: row.supersededByVerificationId,
          downgradedAt: row.downgradedAt,
          contradictedAt: row.contradictedAt,
          contradictedByVerificationId: row.contradictedByVerificationId,
          disputedAt: row.disputedAt,
          revokedAt: row.revokedAt,
          cancelledAt: row.cancelledAt,
          failureCode: row.failureCode,
          metadata: {
            ...metadata,
            attestationResponse:
              params.attestationResponse === undefined
                ? metadata.attestationResponse || null
                : params.attestationResponse,
            responseMessage: params.responseMessage || null,
            responseAuthMethod: params.responseAuthMethod || null,
            responseActorEmail: params.responseActorEmail || null,
            verifierEmail: normalizedVerifierEmail || metadata.verifierEmail || null,
          },
        });
      })
  );

  return getCanonicalBundleById(params.bundleId);
}

export async function getCanonicalBundleRecordById(recordId: string) {
  if (!isUuid(recordId)) {
    return null;
  }

  const row = await db.query.verificationRecords.findFirst({
    where: eq(verificationRecords.id, recordId),
    orderBy: [desc(verificationRecords.createdAt)],
  });

  return row && isCanonicalBundleRecord(row) ? row : null;
}
