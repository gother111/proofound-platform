import { db } from '@/db';
import { proofArtifacts, proofPacks, verificationRecords, proofPackItems } from '@/db/schema';
import { emitLifecycleEvent } from '@/lib/analytics/lifecycle-events';
import { getRows } from '@/lib/db/rows';
import type { ProofSubjectType } from '@/lib/contracts/canonical-domain';
import {
  MATCH_REASON_CODE_VALUES,
  type MatchReasonCode,
  hashOpaqueToken,
  mapLegacyProofVisibility,
  stableHashPayload,
} from '@/lib/contracts/canonical-domain';
import { computeProofTrustSnapshot, getProofFreshnessState } from '@/lib/proof-trust/snapshots';
import { and, eq, sql } from 'drizzle-orm';

type SkillProofInput = {
  id: string;
  skillId: string;
  profileId: string;
  proofType: 'project' | 'certification' | 'media' | 'reference' | 'link' | 'document';
  title: string;
  description?: string | null;
  url?: string | null;
  filePath?: string | null;
  issuedDate?: string | null;
  expiresDate?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

type SnippetPackInput = {
  snippetId: string;
  userId: string;
  shareToken: string;
  profileType: 'individual' | 'organization';
  orgId?: string | null;
  fields: Record<string, unknown>;
  theme: 'light' | 'dark' | 'auto';
  format: 'card' | 'mini' | 'full';
  expiresAt?: string | null;
};

type VerificationRecordUpsertInput = {
  ownerType: 'individual_profile' | 'organization';
  ownerId: string;
  subjectType: ProofSubjectType;
  subjectId: string;
  proofArtifactId?: string | null;
  verificationKind:
    | 'veriff_identity'
    | 'linkedin_identity'
    | 'linkedin_workplace'
    | 'work_email'
    | 'skill_attestation_peer'
    | 'skill_attestation_manager'
    | 'impact_attestation'
    | 'org_domain'
    | 'org_registry_manual'
    | 'platform_manual_review';
  verificationSlot?:
    | 'individual.identity'
    | 'individual.workplace'
    | 'skill.attestation'
    | 'impact_story.attestation'
    | 'artifact.attestation'
    | 'organization.domain'
    | 'organization.platform_review'
    | null;
  status:
    | 'pending'
    | 'verified'
    | 'expired'
    | 'superseded'
    | 'downgraded'
    | 'contradicted'
    | 'disputed'
    | 'revoked'
    | 'declined'
    | 'cancelled'
    | 'failed';
  verifierPrincipalType:
    | 'user_account'
    | 'organization'
    | 'external_email'
    | 'platform_admin'
    | 'system';
  verifierClass?:
    | 'system_provider'
    | 'system_signal'
    | 'authenticated_manager'
    | 'authenticated_peer'
    | 'authenticated_external'
    | 'manual_platform_reviewer'
    | null;
  verifierProfileId?: string | null;
  verifierOrgId?: string | null;
  verifierEmailHash?: string | null;
  verifierDomainSnapshot?: string | null;
  integrityStatus?: 'unknown' | 'clear' | 'warning' | 'contradicted';
  integrityReason?: string | null;
  disputeState?:
    | 'none'
    | 'open'
    | 'under_review'
    | 'resolved_upheld'
    | 'resolved_downgraded'
    | 'resolved_revoked';
  badgeSemanticsVersion?: number;
  riskSignals?: Record<string, unknown>;
  claimSnapshot?: Record<string, unknown>;
  sourceRequestTable?: string | null;
  sourceRequestId?: string | null;
  sourceResponseTable?: string | null;
  sourceResponseId?: string | null;
  requestedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  lastRefreshedAt?: string | Date | null;
  verifiedAt?: string | Date | null;
  supersededAt?: string | Date | null;
  supersededByVerificationId?: string | null;
  downgradedAt?: string | Date | null;
  contradictedAt?: string | Date | null;
  contradictedByVerificationId?: string | null;
  disputedAt?: string | Date | null;
  revokedAt?: string | Date | null;
  metadata?: Record<string, unknown>;
};

type MatchAuditInput = {
  scoreVersion: string;
  assignmentId: string;
  profileId: string;
  weights: Record<string, number>;
  subscores: Record<string, number>;
  missing?: string[];
  gaps?: Array<{ id: string; required: number; have: number }>;
  focusBoost?: {
    matched?: {
      role?: boolean;
      industry?: boolean;
      orgType?: boolean;
    };
  };
  verificationGates?: string[] | null;
};

export const CANONICAL_PROOFS_WRITE_ENABLED = process.env.CANONICAL_PROOFS_WRITE !== 'false';
export const CANONICAL_PROOFS_READ_ENABLED = process.env.CANONICAL_PROOFS_READ === 'true';
export const CANONICAL_VERIFICATIONS_READ_ENABLED =
  process.env.CANONICAL_VERIFICATIONS_READ === 'true';
export const CANONICAL_MATCH_AUDIT_FIELDS_ENABLED =
  process.env.CANONICAL_MATCH_AUDIT_FIELDS !== 'false';
export const CANONICAL_MATCH_SCORE_VERSION = 'core-match/v2';

async function refreshIndividualProofTrustSnapshots(profileId: string) {
  await Promise.all([
    computeProofTrustSnapshot('individual_profile', profileId, 'portfolio'),
    computeProofTrustSnapshot('individual_profile', profileId, 'matching'),
  ]);
}

function getArtifactChangedFields(
  previous: typeof proofArtifacts.$inferSelect | null,
  next: typeof proofArtifacts.$inferSelect
) {
  if (!previous) {
    return [];
  }

  const changedFields: string[] = [];

  if (previous.title !== next.title) changedFields.push('title');
  if (previous.description !== next.description) changedFields.push('description');
  if (previous.sourceUrl !== next.sourceUrl) changedFields.push('source_url');
  if (previous.storagePath !== next.storagePath) changedFields.push('storage_path');
  if (previous.issuedAt?.toISOString() !== next.issuedAt?.toISOString())
    changedFields.push('issued_at');
  if (previous.expiresAt?.toISOString() !== next.expiresAt?.toISOString())
    changedFields.push('expires_at');
  if (previous.visibility !== next.visibility) changedFields.push('visibility');
  if (previous.revealGate !== next.revealGate) changedFields.push('reveal_gate');

  return changedFields;
}

function getFreshnessAgeBucket(
  state: ReturnType<typeof getProofFreshnessState>,
  dateValue?: Date | null
) {
  if (state === 'expired') {
    return 'expired' as const;
  }

  if (!dateValue) {
    return '366_plus' as const;
  }

  const ageDays = Math.floor((Date.now() - dateValue.getTime()) / (24 * 60 * 60 * 1000));
  if (ageDays <= 90) return '0_90' as const;
  if (ageDays <= 180) return '91_180' as const;
  if (ageDays <= 365) return '181_365' as const;
  return '366_plus' as const;
}

function getExpiryState(expiresAt?: Date | null) {
  if (!expiresAt) return 'unknown' as const;

  const diffMs = expiresAt.getTime() - Date.now();
  if (diffMs <= 0) return 'expired' as const;
  if (diffMs <= 30 * 24 * 60 * 60 * 1000) return 'expiring' as const;
  return 'active' as const;
}

function mapSkillProofTypeToArtifactKind(
  proofType: SkillProofInput['proofType']
): 'link' | 'document' | 'image' | 'credential' | 'reference' | 'other' {
  switch (proofType) {
    case 'certification':
      return 'credential';
    case 'document':
      return 'document';
    case 'media':
      return 'image';
    case 'reference':
      return 'reference';
    case 'link':
      return 'link';
    case 'project':
    default:
      return 'other';
  }
}

function mapArtifactKindToLegacyProofType(
  artifactKind: (typeof proofArtifacts.$inferSelect)['artifactKind']
): 'project' | 'certification' | 'media' | 'reference' | 'link' | 'document' {
  switch (artifactKind) {
    case 'credential':
      return 'certification';
    case 'document':
      return 'document';
    case 'image':
    case 'video':
      return 'media';
    case 'reference':
      return 'reference';
    case 'link':
      return 'link';
    case 'assessment':
    case 'other':
    default:
      return 'project';
  }
}

function toLegacyDateString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export async function upsertCanonicalProofArtifactFromSkillProof(input: SkillProofInput) {
  const existing = await db.query.proofArtifacts.findFirst({
    where: and(
      eq(proofArtifacts.legacySourceTable, 'skill_proofs'),
      eq(proofArtifacts.legacySourceId, input.id)
    ),
  });
  const visibility = mapLegacyProofVisibility(
    typeof input.metadata?.visibility === 'string' ? input.metadata.visibility : null
  );

  const [row] = await db
    .insert(proofArtifacts)
    .values({
      ownerType: 'individual_profile',
      ownerId: input.profileId,
      subjectType: 'skill',
      subjectId: input.skillId,
      artifactKind: mapSkillProofTypeToArtifactKind(input.proofType),
      title: input.title,
      description: input.description || null,
      sourceUrl: input.url || null,
      storagePath: input.filePath || null,
      issuedAt: input.issuedDate ? new Date(input.issuedDate) : null,
      expiresAt: input.expiresDate ? new Date(input.expiresDate) : null,
      visibility: visibility.visibility,
      revealGate: visibility.revealGate,
      metadata: input.metadata || {},
      legacySourceTable: 'skill_proofs',
      legacySourceId: input.id,
      legacySourcePath: null,
      createdAt: input.createdAt ? new Date(input.createdAt) : new Date(),
      updatedAt: input.updatedAt ? new Date(input.updatedAt) : new Date(),
    })
    .onConflictDoUpdate({
      target: [
        proofArtifacts.legacySourceTable,
        proofArtifacts.legacySourceId,
        proofArtifacts.legacySourcePath,
      ],
      set: {
        ownerType: sql`excluded.owner_type`,
        ownerId: sql`excluded.owner_id`,
        subjectType: sql`excluded.subject_type`,
        subjectId: sql`excluded.subject_id`,
        artifactKind: sql`excluded.artifact_kind`,
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        sourceUrl: sql`excluded.source_url`,
        storagePath: sql`excluded.storage_path`,
        issuedAt: sql`excluded.issued_at`,
        expiresAt: sql`excluded.expires_at`,
        visibility: sql`excluded.visibility`,
        revealGate: sql`excluded.reveal_gate`,
        metadata: sql`excluded.metadata`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning();

  const eventName = existing ? 'proof_artifact_updated' : 'proof_artifact_created';
  const changedFields = getArtifactChangedFields(existing ?? null, row);

  await emitLifecycleEvent(
    eventName,
    existing
      ? {
          proof_artifact_id: row.id,
          owner_type: row.ownerType,
          owner_id: row.ownerId,
          subject_type: row.subjectType,
          subject_id: row.subjectId,
          artifact_kind: row.artifactKind,
          visibility: row.visibility,
          reveal_gate: row.revealGate,
          changed_fields: changedFields,
          actor_type: 'candidate',
          source: 'canonical.repository',
        }
      : {
          proof_artifact_id: row.id,
          owner_type: row.ownerType,
          owner_id: row.ownerId,
          subject_type: row.subjectType,
          subject_id: row.subjectId,
          artifact_kind: row.artifactKind,
          visibility: row.visibility,
          reveal_gate: row.revealGate,
          actor_type: 'candidate',
          source: 'canonical.repository',
        },
    {
      userId: input.profileId,
      entityType: 'profile',
      entityId: row.id,
    }
  );

  const nextFreshnessState = getProofFreshnessState({
    issuedAt: row.issuedAt,
    expiresAt: row.expiresAt,
    updatedAt: row.updatedAt,
  });
  const previousFreshnessState = existing
    ? getProofFreshnessState({
        issuedAt: existing.issuedAt,
        expiresAt: existing.expiresAt,
        updatedAt: existing.updatedAt,
      })
    : null;

  if (!previousFreshnessState || previousFreshnessState !== nextFreshnessState) {
    const freshnessBasis = row.updatedAt ?? row.issuedAt ?? null;
    await emitLifecycleEvent(
      'proof_freshness_state_changed',
      {
        proof_artifact_id: row.id,
        subject_id: input.profileId,
        freshness_state: nextFreshnessState,
        age_bucket_days: getFreshnessAgeBucket(nextFreshnessState, freshnessBasis),
        expiry_state: getExpiryState(row.expiresAt),
        trigger: existing ? 'proof_artifact_updated' : 'proof_artifact_created',
        actor_type: 'candidate',
        source: 'canonical.repository',
      },
      {
        userId: input.profileId,
        entityType: 'profile',
        entityId: row.id,
      }
    );
  }

  await refreshIndividualProofTrustSnapshots(input.profileId);

  return row;
}

export async function deleteCanonicalProofArtifactForSkillProof(proofId: string) {
  const deletedResult = await db.execute(sql`
    DELETE FROM proof_artifacts
    WHERE legacy_source_table = 'skill_proofs'
      AND legacy_source_id = ${proofId}::uuid
    RETURNING *
  `);

  const row = (getRows(deletedResult)[0] ?? null) as typeof proofArtifacts.$inferSelect | null;
  if (!row) {
    return;
  }

  await emitLifecycleEvent(
    'proof_artifact_deleted',
    {
      proof_artifact_id: row.id,
      owner_type: row.ownerType,
      owner_id: row.ownerId,
      subject_type: row.subjectType,
      subject_id: row.subjectId,
      artifact_kind: row.artifactKind,
      visibility: row.visibility,
      reveal_gate: row.revealGate,
      actor_type: 'candidate',
      source: 'canonical.repository',
    },
    {
      userId: row.ownerId,
      entityType: 'profile',
      entityId: row.id,
    }
  );

  await refreshIndividualProofTrustSnapshots(row.ownerId);
}

export async function upsertCanonicalProofPackForSnippet(input: SnippetPackInput) {
  const ownerType = input.profileType === 'organization' ? 'organization' : 'individual_profile';
  const ownerId = input.profileType === 'organization' ? input.orgId || input.userId : input.userId;
  const [row] = await db
    .insert(proofPacks)
    .values({
      ownerType,
      ownerId,
      packKind: 'profile_export',
      title:
        input.profileType === 'organization' ? 'Organization Profile Export' : 'Profile Export',
      summary: null,
      visibility: 'link_only',
      revealGate: 'none',
      shareTokenHash: hashOpaqueToken(input.shareToken),
      shareExpiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      createdBy: input.userId,
      metadata: {
        fields: input.fields,
        theme: input.theme,
        format: input.format,
        profileType: input.profileType,
        orgId: input.orgId || null,
      },
      legacySourceTable: 'profile_snippets',
      legacySourceId: input.snippetId,
    })
    .onConflictDoUpdate({
      target: [proofPacks.legacySourceTable, proofPacks.legacySourceId],
      set: {
        ownerType: sql`excluded.owner_type`,
        ownerId: sql`excluded.owner_id`,
        title: sql`excluded.title`,
        visibility: sql`excluded.visibility`,
        revealGate: sql`excluded.reveal_gate`,
        shareTokenHash: sql`excluded.share_token_hash`,
        shareExpiresAt: sql`excluded.share_expires_at`,
        metadata: sql`excluded.metadata`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning();

  return row;
}

export async function deleteCanonicalProofPackForSnippet(snippetId: string) {
  await db.execute(sql`
    DELETE FROM proof_packs
    WHERE legacy_source_table = 'profile_snippets'
      AND legacy_source_id = ${snippetId}::uuid
  `);
}

export async function upsertCanonicalVerificationRecord(input: VerificationRecordUpsertInput) {
  const [row] = await db
    .insert(verificationRecords)
    .values({
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      proofArtifactId: input.proofArtifactId || null,
      verificationSlot: input.verificationSlot || null,
      verificationKind: input.verificationKind,
      status: input.status,
      verifierPrincipalType: input.verifierPrincipalType,
      verifierClass: input.verifierClass || null,
      verifierProfileId: input.verifierProfileId || null,
      verifierOrgId: input.verifierOrgId || null,
      verifierEmailHash: input.verifierEmailHash || null,
      verifierDomainSnapshot: input.verifierDomainSnapshot || null,
      integrityStatus: input.integrityStatus || 'unknown',
      integrityReason: input.integrityReason || null,
      disputeState: input.disputeState || 'none',
      badgeSemanticsVersion: input.badgeSemanticsVersion ?? 2,
      riskSignals: input.riskSignals || {},
      claimSnapshot: input.claimSnapshot || {},
      sourceRequestTable: input.sourceRequestTable || null,
      sourceRequestId: input.sourceRequestId || null,
      sourceResponseTable: input.sourceResponseTable || null,
      sourceResponseId: input.sourceResponseId || null,
      requestedAt: input.requestedAt ? new Date(input.requestedAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      lastRefreshedAt: input.lastRefreshedAt ? new Date(input.lastRefreshedAt) : null,
      supersededAt: input.supersededAt ? new Date(input.supersededAt) : null,
      supersededByVerificationId: input.supersededByVerificationId || null,
      downgradedAt: input.downgradedAt ? new Date(input.downgradedAt) : null,
      contradictedAt: input.contradictedAt ? new Date(input.contradictedAt) : null,
      contradictedByVerificationId: input.contradictedByVerificationId || null,
      disputedAt: input.disputedAt ? new Date(input.disputedAt) : null,
      revokedAt: input.revokedAt ? new Date(input.revokedAt) : null,
      verifiedAt: input.verifiedAt ? new Date(input.verifiedAt) : null,
      metadata: input.metadata || {},
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [
        verificationRecords.sourceRequestTable,
        verificationRecords.sourceRequestId,
        verificationRecords.subjectType,
        verificationRecords.subjectId,
      ],
      set: {
        proofArtifactId: sql`excluded.proof_artifact_id`,
        verificationSlot: sql`excluded.verification_slot`,
        verificationKind: sql`excluded.verification_kind`,
        status: sql`excluded.status`,
        verifierPrincipalType: sql`excluded.verifier_principal_type`,
        verifierClass: sql`excluded.verifier_class`,
        verifierProfileId: sql`excluded.verifier_profile_id`,
        verifierOrgId: sql`excluded.verifier_org_id`,
        verifierEmailHash: sql`excluded.verifier_email_hash`,
        verifierDomainSnapshot: sql`excluded.verifier_domain_snapshot`,
        integrityStatus: sql`excluded.integrity_status`,
        integrityReason: sql`excluded.integrity_reason`,
        disputeState: sql`excluded.dispute_state`,
        badgeSemanticsVersion: sql`excluded.badge_semantics_version`,
        riskSignals: sql`excluded.risk_signals`,
        claimSnapshot: sql`excluded.claim_snapshot`,
        sourceResponseTable: sql`excluded.source_response_table`,
        sourceResponseId: sql`excluded.source_response_id`,
        requestedAt: sql`excluded.requested_at`,
        expiresAt: sql`excluded.expires_at`,
        lastRefreshedAt: sql`excluded.last_refreshed_at`,
        supersededAt: sql`excluded.superseded_at`,
        supersededByVerificationId: sql`excluded.superseded_by_verification_id`,
        downgradedAt: sql`excluded.downgraded_at`,
        contradictedAt: sql`excluded.contradicted_at`,
        contradictedByVerificationId: sql`excluded.contradicted_by_verification_id`,
        disputedAt: sql`excluded.disputed_at`,
        revokedAt: sql`excluded.revoked_at`,
        verifiedAt: sql`excluded.verified_at`,
        metadata: sql`excluded.metadata`,
        updatedAt: sql`excluded.updated_at`,
      },
    })
    .returning();

  return row;
}

export function deriveMatchReasonCodes(input: MatchAuditInput): MatchReasonCode[] {
  const codes = new Set<MatchReasonCode>();
  const { subscores, missing = [], focusBoost } = input;

  if ((subscores.skills || 0) >= 0.7) codes.add('skills_strong');
  if (missing.length > 0 || (input.gaps || []).length > 0) codes.add('skills_gap');
  if ((subscores.pac || subscores.values || 0) >= 0.7) codes.add('purpose_alignment_strong');
  else if ((subscores.pac || subscores.values || 0) >= 0.4) codes.add('purpose_alignment_partial');
  if ((subscores.verifications || 0) >= 0.7) codes.add('verification_ready');
  else if ((input.verificationGates || []).length > 0) codes.add('verification_gap');
  if ((subscores.availability || 0) >= 0.7 && (subscores.location || 0) >= 0.7) {
    codes.add('logistics_fit');
  }
  if ((subscores.compensation || 0) >= 0.7) codes.add('compensation_fit');
  if ((subscores.language || 0) >= 0.7) codes.add('language_fit');
  if (focusBoost?.matched?.role) codes.add('focus_role');
  if (focusBoost?.matched?.industry) codes.add('focus_industry');
  if (focusBoost?.matched?.orgType) codes.add('focus_org_type');

  return MATCH_REASON_CODE_VALUES.filter((code) => codes.has(code));
}

export function buildMatchAuditFields(input: MatchAuditInput) {
  const reasonCodes = deriveMatchReasonCodes(input);

  return {
    scoreVersion: input.scoreVersion,
    inputsHash: stableHashPayload({
      scoreVersion: input.scoreVersion,
      assignmentId: input.assignmentId,
      profileId: input.profileId,
      weights: input.weights,
      subscores: input.subscores,
      missing: input.missing || [],
      gaps: input.gaps || [],
      focusBoost: input.focusBoost || {},
      verificationGates: input.verificationGates || [],
    }),
    reasonCodes,
    generatedAt: new Date(),
  };
}

export function packItemIncludedFieldsToArray(
  value: (typeof proofPackItems.$inferInsert)['includedFields']
) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

export function mapCanonicalProofRowToLegacySkillProof(row: typeof proofArtifacts.$inferSelect) {
  const metadata =
    row.metadata && typeof row.metadata === 'object'
      ? { ...row.metadata }
      : ({} as Record<string, unknown>);

  return {
    id: row.legacySourceId || row.id,
    skill_id: row.subjectId,
    profile_id: row.ownerId,
    proof_type: mapArtifactKindToLegacyProofType(row.artifactKind),
    title: row.title,
    description: row.description,
    url: row.sourceUrl,
    file_path: row.storagePath,
    issued_date: toLegacyDateString(row.issuedAt),
    expires_date: toLegacyDateString(row.expiresAt),
    verified: Boolean((metadata as Record<string, unknown>).verified),
    metadata,
    canonical_artifact_id: row.id,
  };
}
