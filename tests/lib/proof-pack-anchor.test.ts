import { describe, expect, it } from 'vitest';

import {
  buildOwnerAnchor,
  isQuarantinedProofPack,
  validateProofPackAnchor,
} from '@/lib/proofs/pack-anchor';

describe('proof pack anchor policy', () => {
  it('accepts verification bundles only with real context anchors', () => {
    expect(
      validateProofPackAnchor({
        packKind: 'verification_bundle',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
        primarySubjectType: 'experience',
        primarySubjectId: 'context-1',
      } as any)
    ).toEqual({ ok: true });

    expect(
      validateProofPackAnchor({
        packKind: 'verification_bundle',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
        primarySubjectType: 'skill',
        primarySubjectId: 'skill-1',
      } as any)
    ).toMatchObject({
      ok: false,
      reason: 'invalid_context_anchor_type',
    });
  });

  it('accepts export packs only when they use the owner as the structural anchor', () => {
    const ownerAnchor = buildOwnerAnchor('individual_profile', 'user-1');

    expect(
      validateProofPackAnchor({
        packKind: 'profile_export',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
        primarySubjectType: ownerAnchor.primarySubjectType,
        primarySubjectId: ownerAnchor.primarySubjectId,
      } as any)
    ).toEqual({ ok: true });

    expect(
      validateProofPackAnchor({
        packKind: 'profile_export',
        ownerType: 'individual_profile',
        ownerId: 'user-1',
        primarySubjectType: 'organization',
        primarySubjectId: 'org-1',
      } as any)
    ).toMatchObject({
      ok: false,
      reason: 'owner_anchor_mismatch',
    });
  });

  it('treats deleted or excluded packs as quarantined', () => {
    expect(
      isQuarantinedProofPack({
        deletedAt: null,
        exportExcludedReason: null,
      } as any)
    ).toBe(false);

    expect(
      isQuarantinedProofPack({
        deletedAt: new Date(),
        exportExcludedReason: null,
      } as any)
    ).toBe(true);

    expect(
      isQuarantinedProofPack({
        deletedAt: null,
        exportExcludedReason: 'missing_primary_anchor_context',
      } as any)
    ).toBe(true);
  });
});
