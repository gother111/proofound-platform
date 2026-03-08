import { createHash } from 'crypto';
import { z } from 'zod';

export const VISIBILITY_LEVEL_VALUES = [
  'public',
  'link_only',
  'matched_org',
  'owner_only',
] as const;
export type VisibilityLevel = (typeof VISIBILITY_LEVEL_VALUES)[number];
export const VisibilityLevelSchema = z.enum(VISIBILITY_LEVEL_VALUES);

export const REVEAL_GATE_VALUES = ['none', 'match_exists', 'conversation_started'] as const;
export type RevealGate = (typeof REVEAL_GATE_VALUES)[number];
export const RevealGateSchema = z.enum(REVEAL_GATE_VALUES);

export const OWNER_TYPE_VALUES = ['individual_profile', 'organization'] as const;
export type OwnerType = (typeof OWNER_TYPE_VALUES)[number];
export const OwnerTypeSchema = z.enum(OWNER_TYPE_VALUES);

export const PROOF_SUBJECT_TYPE_VALUES = [
  'individual_profile',
  'skill',
  'project',
  'impact_story',
  'experience',
  'education',
  'volunteering',
  'organization',
] as const;
export type ProofSubjectType = (typeof PROOF_SUBJECT_TYPE_VALUES)[number];
export const ProofSubjectTypeSchema = z.enum(PROOF_SUBJECT_TYPE_VALUES);

export const PROOF_ARTIFACT_KIND_VALUES = [
  'link',
  'document',
  'image',
  'video',
  'credential',
  'reference',
  'assessment',
  'other',
] as const;
export type ProofArtifactKind = (typeof PROOF_ARTIFACT_KIND_VALUES)[number];
export const ProofArtifactKindSchema = z.enum(PROOF_ARTIFACT_KIND_VALUES);

export const PROOF_PACK_KIND_VALUES = [
  'profile_export',
  'organization_export',
  'verification_bundle',
] as const;
export type ProofPackKind = (typeof PROOF_PACK_KIND_VALUES)[number];
export const ProofPackKindSchema = z.enum(PROOF_PACK_KIND_VALUES);

export const VERIFICATION_KIND_VALUES = [
  'skill_peer',
  'skill_manager',
  'custom_bundle',
  'impact_story',
  'work_email',
  'linkedin',
  'veriff',
  'org_registry',
  'org_domain',
  'manual',
] as const;
export type VerificationKind = (typeof VERIFICATION_KIND_VALUES)[number];
export const VerificationKindSchema = z.enum(VERIFICATION_KIND_VALUES);

export const VERIFICATION_STATUS_VALUES = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'cancelled',
  'failed',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS_VALUES)[number];
export const VerificationStatusSchema = z.enum(VERIFICATION_STATUS_VALUES);

export const VERIFIER_PRINCIPAL_TYPE_VALUES = [
  'user_account',
  'organization',
  'external_email',
  'platform_admin',
  'system',
] as const;
export type VerifierPrincipalType = (typeof VERIFIER_PRINCIPAL_TYPE_VALUES)[number];
export const VerifierPrincipalTypeSchema = z.enum(VERIFIER_PRINCIPAL_TYPE_VALUES);

export const INTEGRITY_STATUS_VALUES = ['unknown', 'clear', 'flagged'] as const;
export type IntegrityStatus = (typeof INTEGRITY_STATUS_VALUES)[number];
export const IntegrityStatusSchema = z.enum(INTEGRITY_STATUS_VALUES);

export const MATCH_REASON_CODE_VALUES = [
  'skills_strong',
  'skills_gap',
  'purpose_alignment_strong',
  'purpose_alignment_partial',
  'verification_ready',
  'verification_gap',
  'logistics_fit',
  'compensation_fit',
  'language_fit',
  'focus_role',
  'focus_industry',
  'focus_org_type',
  'shortlist_selected',
  'passed_for_now',
  'rejected_constraints',
  'override_keep_under_review',
  'override_shortlist_manual',
  'override_reject_manual',
  'fairness_warning_active',
  'fairness_ranking_suppressed',
  'reveal_shortlist_identity',
  'reveal_full_identity',
] as const;
export type MatchReasonCode = (typeof MATCH_REASON_CODE_VALUES)[number];
export const MatchReasonCodeSchema = z.enum(MATCH_REASON_CODE_VALUES);

export const MATCH_REASON_CATEGORY_VALUES = [
  'positive_match',
  'constraint_mismatch',
  'workflow_decision',
  'manual_override',
  'fairness',
] as const;
export type MatchReasonCategory = (typeof MATCH_REASON_CATEGORY_VALUES)[number];
export const MatchReasonCategorySchema = z.enum(MATCH_REASON_CATEGORY_VALUES);

export const PrincipalRefSchema = z.object({
  type: z.enum(['user_account', 'organization']),
  id: z.string().uuid(),
});
export type PrincipalRef = z.infer<typeof PrincipalRefSchema>;

export const OwnershipRefSchema = z.object({
  ownerType: OwnerTypeSchema,
  ownerId: z.string().uuid(),
});
export type OwnershipRef = z.infer<typeof OwnershipRefSchema>;

export const ProofArtifactSchema = z.object({
  id: z.string().uuid(),
  ownerType: OwnerTypeSchema,
  ownerId: z.string().uuid(),
  subjectType: ProofSubjectTypeSchema,
  subjectId: z.string().uuid().nullable(),
  artifactKind: ProofArtifactKindSchema,
  title: z.string().min(1),
  description: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  storagePath: z.string().nullable(),
  mimeType: z.string().nullable(),
  issuedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  visibility: VisibilityLevelSchema,
  revealGate: RevealGateSchema,
  metadata: z.record(z.any()),
  legacySourceTable: z.string().nullable(),
  legacySourceId: z.string().uuid().nullable(),
  legacySourcePath: z.string().nullable(),
});
export type ProofArtifact = z.infer<typeof ProofArtifactSchema>;

export const ProofPackSchema = z.object({
  id: z.string().uuid(),
  ownerType: OwnerTypeSchema,
  ownerId: z.string().uuid(),
  packKind: ProofPackKindSchema,
  title: z.string().min(1),
  summary: z.string().nullable(),
  visibility: VisibilityLevelSchema,
  revealGate: RevealGateSchema,
  shareTokenHash: z.string().nullable(),
  shareExpiresAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid().nullable(),
  metadata: z.record(z.any()),
  legacySourceTable: z.string().nullable(),
  legacySourceId: z.string().uuid().nullable(),
});
export type ProofPack = z.infer<typeof ProofPackSchema>;

export const ProofPackItemSchema = z.object({
  id: z.string().uuid(),
  packId: z.string().uuid(),
  artifactId: z.string().uuid(),
  position: z.number().int().nonnegative(),
  includedFields: z.array(z.string()),
});
export type ProofPackItem = z.infer<typeof ProofPackItemSchema>;

export const VerificationRecordSchema = z.object({
  id: z.string().uuid(),
  ownerType: OwnerTypeSchema,
  ownerId: z.string().uuid(),
  subjectType: ProofSubjectTypeSchema,
  subjectId: z.string().uuid(),
  proofArtifactId: z.string().uuid().nullable(),
  verificationKind: VerificationKindSchema,
  status: VerificationStatusSchema,
  verifierPrincipalType: VerifierPrincipalTypeSchema,
  verifierProfileId: z.string().uuid().nullable(),
  verifierOrgId: z.string().uuid().nullable(),
  verifierEmailHash: z.string().nullable(),
  verifierDomainSnapshot: z.string().nullable(),
  integrityStatus: IntegrityStatusSchema,
  integrityReason: z.string().nullable(),
  riskSignals: z.record(z.any()),
  claimSnapshot: z.record(z.any()),
  sourceRequestTable: z.string().nullable(),
  sourceRequestId: z.string().uuid().nullable(),
  sourceResponseTable: z.string().nullable(),
  sourceResponseId: z.string().uuid().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  metadata: z.record(z.any()),
});
export type VerificationRecord = z.infer<typeof VerificationRecordSchema>;

export function mapLegacyProfileVisibility(value: string | null | undefined): {
  visibility: VisibilityLevel;
  revealGate: RevealGate;
} {
  switch (value) {
    case 'public':
      return { visibility: 'public', revealGate: 'none' };
    case 'network':
    case 'network_only':
      return { visibility: 'link_only', revealGate: 'none' };
    case 'match_only':
      return { visibility: 'matched_org', revealGate: 'match_exists' };
    case 'private':
    case 'hidden':
    default:
      return { visibility: 'owner_only', revealGate: 'none' };
  }
}

export function mapLegacyOrganizationVisibility(value: string | null | undefined): {
  visibility: VisibilityLevel;
  revealGate: RevealGate;
} {
  switch (value) {
    case 'public':
      return { visibility: 'public', revealGate: 'none' };
    case 'post_match':
      return { visibility: 'matched_org', revealGate: 'match_exists' };
    case 'post_conversation_start':
      return { visibility: 'matched_org', revealGate: 'conversation_started' };
    case 'internal_only':
    default:
      return { visibility: 'owner_only', revealGate: 'none' };
  }
}

export function mapLegacyProofVisibility(value: string | null | undefined): {
  visibility: VisibilityLevel;
  revealGate: RevealGate;
} {
  switch (value) {
    case 'public':
      return { visibility: 'public', revealGate: 'none' };
    case 'match-only':
    case 'match_only':
      return { visibility: 'matched_org', revealGate: 'match_exists' };
    case 'network':
    case 'network_only':
      return { visibility: 'link_only', revealGate: 'none' };
    case 'private':
    case 'owner_only':
    case 'hidden':
    default:
      return { visibility: 'owner_only', revealGate: 'none' };
  }
}

export function hashOpaqueToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function sortForStableHash(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForStableHash);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortForStableHash((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return value;
}

export function stableHashPayload(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(sortForStableHash(value)))
    .digest('hex');
}
