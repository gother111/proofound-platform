/** @vitest-environment node */

import { describe, expect, it } from 'vitest';

import {
  buildCanonicalOwnerProofPackProjection,
  buildCanonicalProofPackPortabilityHash,
  buildCanonicalPublicProofPackProjection,
  computeProofPackVerificationStatus,
  getProofFreshnessState,
  summarizeProofFreshness,
  type CanonicalProofItemAggregate,
} from '@/lib/proofs/canonical-pack';

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function makePack(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pack-1',
    ownerType: 'individual_profile',
    ownerId: '11111111-1111-4111-8111-111111111111',
    packKind: 'verification_bundle',
    primarySubjectType: 'skill',
    primarySubjectId: '22222222-2222-4222-8222-222222222222',
    lifecycleState: 'published',
    title: 'Proof Pack',
    summary: 'Canonical proof pack',
    contextJson: {},
    evidenceSummary: 'Evidence summary',
    outcomesSummary: 'Outcomes summary',
    visibility: 'public',
    revealGate: 'none',
    shareTokenHash: null,
    shareExpiresAt: null,
    createdBy: null,
    verificationStatus: 'unverified',
    freshnessState: 'stale',
    freshnessEvaluatedAt: null,
    lastVerifiedAt: null,
    lastRefreshedAt: null,
    publishedAt: null,
    submittedAt: null,
    withdrawnAt: null,
    supersededAt: null,
    archivedAt: null,
    portabilityMeta: {
      portabilityHash: 'pack-hash',
      provenanceSummary: 'Imported from canonical proof flow',
    },
    metadata: {},
    legacySourceTable: null,
    legacySourceId: null,
    deletedAt: null,
    ...overrides,
  } as any;
}

function makeItemAggregate(
  artifactId: string,
  overrides: Record<string, unknown> = {}
): CanonicalProofItemAggregate {
  return {
    item: {
      id: `${artifactId}-item`,
      packId: 'pack-1',
      artifactId,
      position: 0,
      includedFields: ['title', 'sourceUrl'],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any,
    artifact: {
      id: artifactId,
      ownerType: 'individual_profile',
      ownerId: '11111111-1111-4111-8111-111111111111',
      subjectType: 'skill',
      subjectId: '22222222-2222-4222-8222-222222222222',
      artifactKind: 'document',
      lifecycleState: 'active',
      title: `Artifact ${artifactId}`,
      description: 'Canonical artifact',
      sourceUrl: `https://example.com/${artifactId}`,
      storagePath: null,
      mimeType: 'application/pdf',
      issuedAt: daysAgo(30),
      expiresAt: null,
      visibility: 'public',
      revealGate: 'none',
      metadata: {},
      deletedAt: null,
      revokedAt: null,
      updatedAt: daysAgo(30),
      ...overrides,
    } as any,
    effectiveVisibility: (overrides.effectiveVisibility as any) ?? 'public',
  };
}

describe('canonical proof pack projections', () => {
  it('keeps multiple artifacts in the owner projection and excludes private child artifacts from public-safe output', () => {
    const pack = makePack();
    const publicItem = makeItemAggregate('artifact-public');
    const privateItem = makeItemAggregate('artifact-private', {
      title: 'Private artifact',
      visibility: 'owner_only',
      effectiveVisibility: 'owner_only',
      sourceUrl: 'https://example.com/private-artifact',
    });
    const verificationStatus = computeProofPackVerificationStatus({
      pack,
      items: [publicItem, privateItem],
      verificationReferences: [
        {
          id: 'verification-1',
          subjectType: 'skill',
          subjectId: pack.primarySubjectId,
          proofArtifactId: publicItem.artifact.id,
          verificationKind: 'skill_attestation_manager',
          verificationSlot: 'skill.attestation',
          status: 'verified',
        } as any,
      ],
    });

    const ownerProjection = buildCanonicalOwnerProofPackProjection({
      pack,
      items: [publicItem, privateItem],
      verificationReferences: [],
      verificationStatus,
      freshnessState: 'fresh',
      latestEvidenceAt: daysAgo(30),
    });
    const publicProjection = buildCanonicalPublicProofPackProjection({
      pack,
      items: [publicItem, privateItem],
      verificationReferences: [],
      verificationStatus,
      freshnessState: 'fresh',
      latestEvidenceAt: daysAgo(30),
    });

    expect(ownerProjection.items).toHaveLength(2);
    expect(publicProjection?.items).toEqual([
      expect.objectContaining({
        artifactId: 'artifact-public',
        itemClass: 'url_link',
        semanticsNote: 'Supporting evidence only, not full verification.',
        title: 'Artifact artifact-public',
      }),
    ]);
    expect(ownerProjection.contract.primaryClaim.statement).toBe('Canonical proof pack');
    expect(ownerProjection.contract.linkedSkills).toEqual([
      expect.objectContaining({
        skillId: '22222222-2222-4222-8222-222222222222',
        evidenceClasses: expect.arrayContaining(['artifact_backed']),
      }),
    ]);
    expect(publicProjection?.contract.schemaVersion).toBe('proof_pack/v2');
    expect(JSON.stringify(publicProjection)).not.toContain('Private artifact');
    expect(JSON.stringify(publicProjection)).not.toContain('private-artifact');
  });

  it('classifies freshness transitions across fresh, review_soon, stale, and expired', () => {
    expect(getProofFreshnessState({ updatedAt: daysAgo(30) })).toBe('fresh');
    expect(getProofFreshnessState({ updatedAt: daysAgo(120) })).toBe('review_soon');
    expect(getProofFreshnessState({ updatedAt: daysAgo(300) })).toBe('stale');
    expect(getProofFreshnessState({ updatedAt: daysAgo(30), expiresAt: daysAgo(1) })).toBe(
      'expired'
    );

    expect(summarizeProofFreshness(['fresh', 'review_soon'])).toBe('review_soon');
    expect(summarizeProofFreshness(['fresh', 'stale'])).toBe('stale');
    expect(summarizeProofFreshness(['fresh', 'expired'])).toBe('expired');
  });

  it('rolls verification status up from unverified through disputed', () => {
    const pack = makePack();
    const firstItem = makeItemAggregate('artifact-1');
    const secondItem = makeItemAggregate('artifact-2');

    expect(
      computeProofPackVerificationStatus({
        pack,
        items: [firstItem],
        verificationReferences: [],
      })
    ).toBe('unverified');

    expect(
      computeProofPackVerificationStatus({
        pack,
        items: [firstItem, secondItem],
        verificationReferences: [
          {
            id: 'verification-1',
            subjectType: 'skill',
            subjectId: pack.primarySubjectId,
            proofArtifactId: firstItem.artifact.id,
            verificationKind: 'skill_attestation_peer',
            verificationSlot: 'skill.attestation',
            status: 'verified',
          } as any,
        ],
      })
    ).toBe('partially_verified');

    expect(
      computeProofPackVerificationStatus({
        pack,
        items: [firstItem],
        verificationReferences: [
          {
            id: 'verification-2',
            subjectType: 'skill',
            subjectId: pack.primarySubjectId,
            proofArtifactId: null,
            verificationKind: 'skill_attestation_manager',
            verificationSlot: 'skill.attestation',
            status: 'verified',
          } as any,
          {
            id: 'verification-2b',
            subjectType: 'skill',
            subjectId: pack.primarySubjectId,
            proofArtifactId: firstItem.artifact.id,
            verificationKind: 'skill_attestation_manager',
            verificationSlot: 'skill.attestation',
            status: 'verified',
          } as any,
        ],
      })
    ).toBe('verified');

    expect(
      computeProofPackVerificationStatus({
        pack,
        items: [firstItem],
        verificationReferences: [
          {
            id: 'verification-3',
            subjectType: 'skill',
            subjectId: pack.primarySubjectId,
            proofArtifactId: firstItem.artifact.id,
            verificationKind: 'skill_attestation_manager',
            verificationSlot: 'skill.attestation',
            status: 'disputed',
          } as any,
        ],
      })
    ).toBe('disputed');
  });

  it('builds deterministic portability hashes for canonical proof pack projections', () => {
    const pack = makePack();
    const ownerProjection = buildCanonicalOwnerProofPackProjection({
      pack,
      items: [makeItemAggregate('artifact-stable')],
      verificationReferences: [],
      verificationStatus: 'verified',
      freshnessState: 'fresh',
      latestEvidenceAt: daysAgo(14),
    });

    expect(buildCanonicalProofPackPortabilityHash('owner_full', ownerProjection)).toBe(
      buildCanonicalProofPackPortabilityHash('owner_full', ownerProjection)
    );
  });

  it('derives subordinate evidence classes and honest semantics from credential-backed proof items', () => {
    const pack = makePack({
      primaryClaimType: 'credential_fact',
      summary: 'Earned a role-relevant credential.',
    });
    const credentialItem = makeItemAggregate('artifact-credential', {
      artifactKind: 'credential',
      metadata: { artifactSubtype: 'certificate' },
      sourceUrl: 'https://example.com/certificate',
    });

    const projection = buildCanonicalOwnerProofPackProjection({
      pack,
      items: [credentialItem],
      verificationReferences: [],
      verificationStatus: 'unverified',
      freshnessState: 'fresh',
      latestEvidenceAt: daysAgo(10),
    });

    expect(projection.contract.primaryClaim.type).toBe('credential_fact');
    expect(projection.contract.linkedEvidenceItems[0]).toEqual(
      expect.objectContaining({
        itemClass: 'credential_evidence',
        semanticsNote: 'Shows credential facts, not job performance.',
      })
    );
    expect(projection.contract.linkedSkills[0]?.evidenceClasses).toEqual(
      expect.arrayContaining(['artifact_backed', 'credential_backed'])
    );
  });
});
