import type { proofPacks } from '@/db/schema';

export const PRIMARY_ANCHOR_CONTEXT_SUBJECT_TYPES = [
  'experience',
  'education',
  'volunteering',
] as const;

export type PrimaryAnchorContextSubjectType = (typeof PRIMARY_ANCHOR_CONTEXT_SUBJECT_TYPES)[number];

export const OWNER_ANCHOR_SUBJECT_TYPES = ['individual_profile', 'organization'] as const;
export type OwnerAnchorSubjectType = (typeof OWNER_ANCHOR_SUBJECT_TYPES)[number];

type ProofPackAnchorFields = Pick<
  typeof proofPacks.$inferSelect,
  'packKind' | 'ownerType' | 'ownerId' | 'primarySubjectType' | 'primarySubjectId'
>;

type ProofPackQuarantineFields = Pick<
  typeof proofPacks.$inferSelect,
  'exportExcludedReason' | 'deletedAt'
>;

export type ProofPackAnchorValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | 'missing_primary_anchor_context'
        | 'invalid_context_anchor_type'
        | 'invalid_owner_anchor_type'
        | 'owner_anchor_mismatch';
      message: string;
    };

export function isPrimaryAnchorContextSubjectType(
  value: ProofPackAnchorFields['primarySubjectType'] | null | undefined
): value is PrimaryAnchorContextSubjectType {
  return (
    typeof value === 'string' &&
    (PRIMARY_ANCHOR_CONTEXT_SUBJECT_TYPES as readonly string[]).includes(value)
  );
}

export function hasPrimaryAnchorContext(
  pack: Pick<ProofPackAnchorFields, 'primarySubjectType' | 'primarySubjectId'>
): boolean {
  return (
    isPrimaryAnchorContextSubjectType(pack.primarySubjectType) &&
    typeof pack.primarySubjectId === 'string' &&
    pack.primarySubjectId.length > 0
  );
}

export function isOwnerAnchorSubjectType(
  value: ProofPackAnchorFields['primarySubjectType'] | null | undefined
): value is OwnerAnchorSubjectType {
  return (
    typeof value === 'string' && (OWNER_ANCHOR_SUBJECT_TYPES as readonly string[]).includes(value)
  );
}

export function hasOwnerAnchor(
  pack: Pick<
    ProofPackAnchorFields,
    'ownerType' | 'ownerId' | 'primarySubjectType' | 'primarySubjectId'
  >
): boolean {
  return (
    isOwnerAnchorSubjectType(pack.primarySubjectType) &&
    typeof pack.primarySubjectId === 'string' &&
    pack.primarySubjectId.length > 0 &&
    pack.primarySubjectType === pack.ownerType &&
    pack.primarySubjectId === pack.ownerId
  );
}

export function buildOwnerAnchor(
  ownerType: ProofPackAnchorFields['ownerType'],
  ownerId: ProofPackAnchorFields['ownerId']
) {
  return {
    primarySubjectType: ownerType,
    primarySubjectId: ownerId,
  };
}

export function validateProofPackAnchor(
  pack: ProofPackAnchorFields
): ProofPackAnchorValidationResult {
  if (typeof pack.primarySubjectId !== 'string' || pack.primarySubjectId.length === 0) {
    return {
      ok: false,
      reason: 'missing_primary_anchor_context',
      message: 'Every Proof Pack must include a primary anchor.',
    };
  }

  if (pack.packKind === 'verification_bundle') {
    if (!isPrimaryAnchorContextSubjectType(pack.primarySubjectType)) {
      return {
        ok: false,
        reason: 'invalid_context_anchor_type',
        message:
          'Verification-bundle Proof Packs must anchor to experience, education, or volunteering.',
      };
    }

    return { ok: true };
  }

  if (!isOwnerAnchorSubjectType(pack.primarySubjectType)) {
    return {
      ok: false,
      reason: 'invalid_owner_anchor_type',
      message: 'Export Proof Packs must anchor to the owning profile or organization.',
    };
  }

  if (pack.primarySubjectType !== pack.ownerType || pack.primarySubjectId !== pack.ownerId) {
    return {
      ok: false,
      reason: 'owner_anchor_mismatch',
      message: 'Export Proof Packs must use the owner as their structural anchor.',
    };
  }

  return { ok: true };
}

export function isQuarantinedProofPack(pack: ProofPackQuarantineFields) {
  return pack.deletedAt !== null || pack.exportExcludedReason === 'missing_primary_anchor_context';
}

export function isExportableProofPack(pack: ProofPackAnchorFields & ProofPackQuarantineFields) {
  return !isQuarantinedProofPack(pack) && validateProofPackAnchor(pack).ok;
}
