import { db } from '@/db';
import { proofArtifacts, proofPacks, verificationRecords, proofPackItems } from '@/db/schema';
import type { ProofSubjectType } from '@/lib/contracts/canonical-domain';
import {
  MATCH_REASON_CODE_VALUES,
  type MatchReasonCode,
  hashOpaqueToken,
  mapLegacyProofVisibility,
  stableHashPayload,
} from '@/lib/contracts/canonical-domain';
import { sql } from 'drizzle-orm';

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
    | 'skill_peer'
    | 'skill_manager'
    | 'custom_bundle'
    | 'impact_story'
    | 'work_email'
    | 'linkedin'
    | 'veriff'
    | 'org_registry'
    | 'org_domain'
    | 'manual';
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'failed';
  verifierPrincipalType:
    | 'user_account'
    | 'organization'
    | 'external_email'
    | 'platform_admin'
    | 'system';
  verifierProfileId?: string | null;
  verifierOrgId?: string | null;
  verifierEmailHash?: string | null;
  verifierDomainSnapshot?: string | null;
  integrityStatus?: 'unknown' | 'clear' | 'flagged';
  integrityReason?: string | null;
  riskSignals?: Record<string, unknown>;
  claimSnapshot?: Record<string, unknown>;
  sourceRequestTable?: string | null;
  sourceRequestId?: string | null;
  sourceResponseTable?: string | null;
  sourceResponseId?: string | null;
  verifiedAt?: string | Date | null;
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

  return row;
}

export async function deleteCanonicalProofArtifactForSkillProof(proofId: string) {
  await db.execute(sql`
    DELETE FROM proof_artifacts
    WHERE legacy_source_table = 'skill_proofs'
      AND legacy_source_id = ${proofId}::uuid
  `);
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
      verificationKind: input.verificationKind,
      status: input.status,
      verifierPrincipalType: input.verifierPrincipalType,
      verifierProfileId: input.verifierProfileId || null,
      verifierOrgId: input.verifierOrgId || null,
      verifierEmailHash: input.verifierEmailHash || null,
      verifierDomainSnapshot: input.verifierDomainSnapshot || null,
      integrityStatus: input.integrityStatus || 'unknown',
      integrityReason: input.integrityReason || null,
      riskSignals: input.riskSignals || {},
      claimSnapshot: input.claimSnapshot || {},
      sourceRequestTable: input.sourceRequestTable || null,
      sourceRequestId: input.sourceRequestId || null,
      sourceResponseTable: input.sourceResponseTable || null,
      sourceResponseId: input.sourceResponseId || null,
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
        verificationKind: sql`excluded.verification_kind`,
        status: sql`excluded.status`,
        verifierPrincipalType: sql`excluded.verifier_principal_type`,
        verifierProfileId: sql`excluded.verifier_profile_id`,
        verifierOrgId: sql`excluded.verifier_org_id`,
        verifierEmailHash: sql`excluded.verifier_email_hash`,
        verifierDomainSnapshot: sql`excluded.verifier_domain_snapshot`,
        integrityStatus: sql`excluded.integrity_status`,
        integrityReason: sql`excluded.integrity_reason`,
        riskSignals: sql`excluded.risk_signals`,
        claimSnapshot: sql`excluded.claim_snapshot`,
        sourceResponseTable: sql`excluded.source_response_table`,
        sourceResponseId: sql`excluded.source_response_id`,
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
