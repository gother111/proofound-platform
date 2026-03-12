import { beforeEach, describe, expect, it, vi } from 'vitest';

const proofArtifactsTable = { id: 'proof_artifacts.id' };
const proofPacksTable = { id: 'proof_packs.id' };
const proofPackItemsTable = { id: 'proof_pack_items.id' };

let insertedArtifactValues: Record<string, unknown> | null = null;
let insertedPackValues: Record<string, unknown> | null = null;
let insertedPackItemValues: Record<string, unknown> | null = null;
let syncedPackRow: Record<string, unknown> | null = null;

const dbMock = {
  query: {
    proofArtifacts: {
      findFirst: vi.fn(),
    },
    proofPacks: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn((table: unknown) => {
    if (table === proofArtifactsTable) {
      return {
        values: (values: Record<string, unknown>) => {
          insertedArtifactValues = values;
          return {
            returning: async () => [
              {
                id: 'artifact-1',
                ownerType: 'individual_profile',
                ownerId: values.ownerId,
                subjectType: 'skill',
                subjectId: values.subjectId,
                artifactKind: values.artifactKind,
                lifecycleState: values.lifecycleState,
                title: values.title,
                description: values.description,
                sourceUrl: values.sourceUrl,
                storagePath: values.storagePath,
                uploadedFileId: values.uploadedFileId,
                activatedAt: values.activatedAt,
                issuedAt: values.issuedAt,
                expiresAt: values.expiresAt,
                visibility: values.visibility,
                revealGate: values.revealGate,
                metadata: values.metadata,
                createdAt: values.createdAt,
                updatedAt: values.updatedAt,
                legacySourceId: null,
              },
            ],
          };
        },
      };
    }

    if (table === proofPacksTable) {
      return {
        values: (values: Record<string, unknown>) => {
          insertedPackValues = values;
          syncedPackRow = {
            id: 'pack-1',
            ownerType: values.ownerType,
            ownerId: values.ownerId,
            packKind: values.packKind,
            primarySubjectType: values.primarySubjectType,
            primarySubjectId: values.primarySubjectId,
            lifecycleState: values.lifecycleState,
            title: values.title,
            summary: values.summary,
            contextJson: values.contextJson,
            evidenceSummary: values.evidenceSummary,
            outcomesSummary: values.outcomesSummary,
            visibility: values.visibility,
            revealGate: values.revealGate,
            verificationStatus: values.verificationStatus,
            freshnessState: values.freshnessState,
            freshnessEvaluatedAt: values.freshnessEvaluatedAt,
            lastRefreshedAt: values.lastRefreshedAt,
            portabilityMeta: values.portabilityMeta,
            metadata: values.metadata,
            publishedAt: values.publishedAt,
            updatedAt: values.updatedAt,
          };
          return {
            returning: async () => [syncedPackRow],
          };
        },
      };
    }

    if (table === proofPackItemsTable) {
      return {
        values: (values: Record<string, unknown>) => {
          insertedPackItemValues = values;
          return {
            onConflictDoNothing: async () => [],
          };
        },
      };
    }

    throw new Error(`Unexpected insert table: ${String(table)}`);
  }),
  update: vi.fn(() => {
    throw new Error('update should not be used in this test');
  }),
};

vi.mock('@/db', () => ({
  db: dbMock,
}));

vi.mock('@/db/schema', () => ({
  proofArtifacts: proofArtifactsTable,
  proofPacks: proofPacksTable,
  proofPackItems: proofPackItemsTable,
  verificationRecords: {},
}));

vi.mock('@/lib/analytics/lifecycle-events', () => ({
  emitLifecycleEvent: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  getProofFreshnessState: vi.fn(() => 'fresh'),
  syncCanonicalProofPackState: vi.fn(async () => syncedPackRow),
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicPortfolioByProfileId: vi.fn(),
}));

vi.mock('@/lib/proof-trust/snapshots', () => ({
  computeProofTrustSnapshot: vi.fn(async () => ({
    snapshotId: 'snapshot-1',
  })),
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((...args: unknown[]) => args),
  sql: vi.fn((strings: TemplateStringsArray) => strings.join('')),
}));

describe('upsertCanonicalSkillProof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertedArtifactValues = null;
    insertedPackValues = null;
    insertedPackItemValues = null;
    syncedPackRow = null;
    dbMock.query.proofArtifacts.findFirst.mockResolvedValue(null);
    dbMock.query.proofPacks.findFirst.mockResolvedValue(null);
  });

  it('requires a primary anchor context for new canonical skill proof packs', async () => {
    const { upsertCanonicalSkillProof } = await import('@/lib/canonical/repository');

    await expect(
      upsertCanonicalSkillProof({
        profileId: 'user-1',
        skillId: 'skill-1',
        proofType: 'link',
        title: 'Proof Pack Launch',
        description: 'Public launch evidence.',
        url: 'https://example.com/proof-pack-launch',
        metadata: {
          visibility: 'public',
        },
        importedFrom: 'onboarding',
      })
    ).rejects.toThrow('Primary anchor context is required for canonical proof packs');
  });

  it('creates canonical skill proof packs with the anchor context as the primary subject', async () => {
    const { upsertCanonicalSkillProof } = await import('@/lib/canonical/repository');

    const result = await upsertCanonicalSkillProof({
      profileId: 'user-1',
      skillId: 'skill-1',
      primaryAnchor: {
        type: 'experience',
        id: 'experience-1',
      },
      proofType: 'link',
      title: 'Proof Pack Launch',
      description: 'Public launch evidence.',
      url: 'https://example.com/proof-pack-launch',
      metadata: {
        visibility: 'public',
      },
      importedFrom: 'onboarding',
    });

    expect(insertedArtifactValues).toMatchObject({
      ownerId: 'user-1',
      subjectId: 'skill-1',
      title: 'Proof Pack Launch',
      metadata: expect.objectContaining({
        canonicalWritePath: 'skill_proof',
        importedFrom: 'onboarding',
      }),
    });
    expect(insertedPackValues).toMatchObject({
      ownerId: 'user-1',
      primarySubjectType: 'experience',
      primarySubjectId: 'experience-1',
      title: 'Proof Pack Launch',
      contextJson: expect.objectContaining({
        primaryAnchorType: 'experience',
        primaryAnchorId: 'experience-1',
        linkedSkillId: 'skill-1',
      }),
      metadata: expect.objectContaining({
        canonicalWritePath: 'skill_proof',
        primaryAnchorType: 'experience',
        primaryAnchorId: 'experience-1',
        linkedSkillId: 'skill-1',
      }),
    });
    expect(insertedPackItemValues).toMatchObject({
      packId: 'pack-1',
      artifactId: 'artifact-1',
    });
    expect(result.legacyProof).toMatchObject({
      canonical_artifact_id: 'artifact-1',
      canonical_pack_id: 'pack-1',
      canonical_pack_title: 'Proof Pack Launch',
      title: 'Proof Pack Launch',
    });
  });
});
