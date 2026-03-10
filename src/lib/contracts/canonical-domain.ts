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
export const PROOF_PACK_LIFECYCLE_STATE_VALUES = [
  'draft',
  'ready',
  'published',
  'submitted',
  'withdrawn',
  'superseded',
  'archived',
] as const;
export type ProofPackLifecycleState = (typeof PROOF_PACK_LIFECYCLE_STATE_VALUES)[number];
export const ProofPackLifecycleStateSchema = z.enum(PROOF_PACK_LIFECYCLE_STATE_VALUES);
export const PROOF_PACK_VERIFICATION_STATUS_VALUES = [
  'unverified',
  'partially_verified',
  'verified',
  'disputed',
] as const;
export type ProofPackVerificationStatus = (typeof PROOF_PACK_VERIFICATION_STATUS_VALUES)[number];
export const ProofPackVerificationStatusSchema = z.enum(PROOF_PACK_VERIFICATION_STATUS_VALUES);
export const PROOF_FRESHNESS_STATE_VALUES = ['fresh', 'review_soon', 'stale', 'expired'] as const;
export type ProofFreshnessState = (typeof PROOF_FRESHNESS_STATE_VALUES)[number];
export const ProofFreshnessStateSchema = z.enum(PROOF_FRESHNESS_STATE_VALUES);

export const SUBMISSION_KIND_VALUES = [
  'assignment_section',
  'proof_card',
  'application_proof',
  'intro_proof',
  'verification_response_payload',
  'manual_upload',
] as const;
export type SubmissionKind = (typeof SUBMISSION_KIND_VALUES)[number];
export const SubmissionKindSchema = z.enum(SUBMISSION_KIND_VALUES);

export const SUBMISSION_STATUS_VALUES = [
  'draft',
  'submitted',
  'under_review',
  'accepted',
  'rejected',
  'withdrawn',
  'superseded',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUS_VALUES)[number];
export const SubmissionStatusSchema = z.enum(SUBMISSION_STATUS_VALUES);

export const SUBMISSION_CONTEXT_TYPE_VALUES = [
  'assignment',
  'assignment_invitation',
  'candidate_invite',
  'match',
  'intro',
  'application',
  'verification_request',
  'manual',
] as const;
export type SubmissionContextType = (typeof SUBMISSION_CONTEXT_TYPE_VALUES)[number];
export const SubmissionContextTypeSchema = z.enum(SUBMISSION_CONTEXT_TYPE_VALUES);

export const VERIFICATION_KIND_VALUES = [
  'veriff_identity',
  'linkedin_identity',
  'linkedin_workplace',
  'work_email',
  'skill_attestation_peer',
  'skill_attestation_manager',
  'impact_attestation',
  'org_domain',
  'org_registry_manual',
  'platform_manual_review',
] as const;
export type VerificationKind = (typeof VERIFICATION_KIND_VALUES)[number];
export const VerificationKindSchema = z.enum(VERIFICATION_KIND_VALUES);

export const VERIFICATION_STATUS_VALUES = [
  'pending',
  'verified',
  'expired',
  'superseded',
  'downgraded',
  'contradicted',
  'disputed',
  'revoked',
  'declined',
  'cancelled',
  'failed',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUS_VALUES)[number];
export const VerificationStatusSchema = z.enum(VERIFICATION_STATUS_VALUES);

export const VERIFICATION_SLOT_VALUES = [
  'individual.identity',
  'individual.workplace',
  'skill.attestation',
  'impact_story.attestation',
  'artifact.attestation',
  'organization.domain',
  'organization.platform_review',
] as const;
export type VerificationSlot = (typeof VERIFICATION_SLOT_VALUES)[number];
export const VerificationSlotSchema = z.enum(VERIFICATION_SLOT_VALUES);

export const VERIFIER_PRINCIPAL_TYPE_VALUES = [
  'user_account',
  'organization',
  'external_email',
  'platform_admin',
  'system',
] as const;
export type VerifierPrincipalType = (typeof VERIFIER_PRINCIPAL_TYPE_VALUES)[number];
export const VerifierPrincipalTypeSchema = z.enum(VERIFIER_PRINCIPAL_TYPE_VALUES);

export const VERIFIER_CLASS_VALUES = [
  'system_provider',
  'system_signal',
  'authenticated_manager',
  'authenticated_peer',
  'authenticated_external',
  'manual_platform_reviewer',
] as const;
export type VerifierClass = (typeof VERIFIER_CLASS_VALUES)[number];
export const VerifierClassSchema = z.enum(VERIFIER_CLASS_VALUES);

export const INTEGRITY_STATUS_VALUES = ['unknown', 'clear', 'warning', 'contradicted'] as const;
export type IntegrityStatus = (typeof INTEGRITY_STATUS_VALUES)[number];
export const IntegrityStatusSchema = z.enum(INTEGRITY_STATUS_VALUES);

export const DISPUTE_STATE_VALUES = [
  'none',
  'open',
  'under_review',
  'resolved_upheld',
  'resolved_downgraded',
  'resolved_revoked',
] as const;
export type DisputeState = (typeof DISPUTE_STATE_VALUES)[number];
export const DisputeStateSchema = z.enum(DISPUTE_STATE_VALUES);

export const VERIFICATION_LOG_ENTRY_TYPE_VALUES = [
  'record_created',
  'state_transition',
  'refresh_requested',
  'refresh_completed',
  'expired',
  'downgraded',
  'contradiction_detected',
  'dispute_opened',
  'dispute_updated',
  'dispute_resolved',
  'revoked',
  'superseded',
  'restored',
  'recomputed',
] as const;
export type VerificationLogEntryType = (typeof VERIFICATION_LOG_ENTRY_TYPE_VALUES)[number];
export const VerificationLogEntryTypeSchema = z.enum(VERIFICATION_LOG_ENTRY_TYPE_VALUES);

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
  primarySubjectType: ProofSubjectTypeSchema.nullable(),
  primarySubjectId: z.string().uuid().nullable(),
  lifecycleState: ProofPackLifecycleStateSchema,
  title: z.string().min(1),
  summary: z.string().nullable(),
  contextJson: z.record(z.any()),
  evidenceSummary: z.string().nullable(),
  outcomesSummary: z.string().nullable(),
  visibility: VisibilityLevelSchema,
  revealGate: RevealGateSchema,
  shareTokenHash: z.string().nullable(),
  shareExpiresAt: z.string().datetime().nullable(),
  createdBy: z.string().uuid().nullable(),
  verificationStatus: ProofPackVerificationStatusSchema,
  freshnessState: ProofFreshnessStateSchema,
  freshnessEvaluatedAt: z.string().datetime().nullable(),
  lastVerifiedAt: z.string().datetime().nullable(),
  lastRefreshedAt: z.string().datetime().nullable(),
  publishedAt: z.string().datetime().nullable(),
  submittedAt: z.string().datetime().nullable(),
  withdrawnAt: z.string().datetime().nullable(),
  supersededAt: z.string().datetime().nullable(),
  archivedAt: z.string().datetime().nullable(),
  portabilityMeta: z.record(z.any()),
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

export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  submissionKind: SubmissionKindSchema,
  status: SubmissionStatusSchema,
  ownerType: OwnerTypeSchema,
  ownerId: z.string().uuid(),
  submittedByUserId: z.string().uuid().nullable(),
  submittedByOrgId: z.string().uuid().nullable(),
  assignmentId: z.string().uuid().nullable(),
  proofPackId: z.string().uuid().nullable(),
  requestContextType: SubmissionContextTypeSchema,
  requestContextId: z.string().uuid().nullable(),
  matchId: z.string().uuid().nullable(),
  introId: z.string().uuid().nullable(),
  applicationId: z.string().uuid().nullable(),
  legacySourceTable: z.string().nullable(),
  legacySourceId: z.string().uuid().nullable(),
  submittedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().nullable(),
  withdrawnAt: z.string().datetime().nullable(),
  supersededAt: z.string().datetime().nullable(),
  supersededBySubmissionId: z.string().uuid().nullable(),
  metadata: z.record(z.any()),
});
export type Submission = z.infer<typeof SubmissionSchema>;

export const SubmissionArtifactSchema = z.object({
  id: z.string().uuid(),
  submissionId: z.string().uuid(),
  artifactId: z.string().uuid(),
  position: z.number().int().nonnegative(),
  includedFields: z.array(z.string()),
});
export type SubmissionArtifact = z.infer<typeof SubmissionArtifactSchema>;

export const VerificationRecordSchema = z.object({
  id: z.string().uuid(),
  ownerType: OwnerTypeSchema,
  ownerId: z.string().uuid(),
  subjectType: ProofSubjectTypeSchema,
  subjectId: z.string().uuid(),
  proofArtifactId: z.string().uuid().nullable(),
  verificationSlot: VerificationSlotSchema.nullable(),
  verificationKind: VerificationKindSchema,
  status: VerificationStatusSchema,
  verifierPrincipalType: VerifierPrincipalTypeSchema,
  verifierClass: VerifierClassSchema.nullable(),
  verifierProfileId: z.string().uuid().nullable(),
  verifierOrgId: z.string().uuid().nullable(),
  verifierEmailHash: z.string().nullable(),
  verifierDomainSnapshot: z.string().nullable(),
  integrityStatus: IntegrityStatusSchema,
  integrityReason: z.string().nullable(),
  disputeState: DisputeStateSchema,
  badgeSemanticsVersion: z.number().int(),
  riskSignals: z.record(z.any()),
  claimSnapshot: z.record(z.any()),
  sourceRequestTable: z.string().nullable(),
  sourceRequestId: z.string().uuid().nullable(),
  sourceResponseTable: z.string().nullable(),
  sourceResponseId: z.string().uuid().nullable(),
  requestedAt: z.string().datetime().nullable(),
  lastRefreshedAt: z.string().datetime().nullable(),
  verifiedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime().nullable(),
  supersededAt: z.string().datetime().nullable(),
  supersededByVerificationId: z.string().uuid().nullable(),
  downgradedAt: z.string().datetime().nullable(),
  contradictedAt: z.string().datetime().nullable(),
  contradictedByVerificationId: z.string().uuid().nullable(),
  disputedAt: z.string().datetime().nullable(),
  revokedAt: z.string().datetime().nullable(),
  metadata: z.record(z.any()),
});
export type VerificationRecord = z.infer<typeof VerificationRecordSchema>;

export const VerificationLogEntrySchema = z.object({
  id: z.string().uuid(),
  verificationRecordId: z.string().uuid(),
  sequenceNumber: z.number().int().positive(),
  entryType: VerificationLogEntryTypeSchema,
  fromStatus: VerificationStatusSchema.nullable(),
  toStatus: VerificationStatusSchema.nullable(),
  reasonCode: z.string().nullable(),
  actorType: z.enum([
    'candidate',
    'organization_member',
    'platform_admin',
    'system',
    'service_account',
  ]),
  actorId: z.string().uuid().nullable(),
  relatedContradictionId: z.string().uuid().nullable(),
  relatedDisputeId: z.string().uuid().nullable(),
  relatedVerificationRecordId: z.string().uuid().nullable(),
  recomputeBatchId: z.string().nullable(),
  metadata: z.record(z.any()),
  occurredAt: z.string().datetime(),
});
export type VerificationLogEntry = z.infer<typeof VerificationLogEntrySchema>;

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
