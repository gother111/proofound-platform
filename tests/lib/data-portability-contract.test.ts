/** @vitest-environment node */

import { describe, expect, it } from 'vitest';

import { normalizeImportRequest } from '@/lib/contracts/data-portability';

const basePayload = {
  version: '4.0.0',
  exportedAt: '2026-03-10T12:00:00.000Z',
  profile: {
    headline: 'Proof-first builder',
  },
  skills: [
    {
      skillCode: 'typescript',
      level: 4,
      lastUsed: '2026-02-01T00:00:00.000Z',
    },
  ],
  experiences: [],
  volunteering: [],
  proof: {
    scope: 'owner_full',
    schemaVersion: '4.0.0',
    packs: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        ownerType: 'individual_profile',
        ownerId: '22222222-2222-4222-8222-222222222222',
        packKind: 'verification_bundle',
        primarySubjectType: 'skill',
        primarySubjectId: '33333333-3333-4333-8333-333333333333',
        lifecycleState: 'published',
        title: 'Imported Proof Pack',
        summary: 'Canonical proof pack',
        contextJson: {},
        evidenceSummary: 'Evidence summary',
        outcomesSummary: 'Outcomes summary',
        visibility: 'public',
        revealGate: 'none',
        shareTokenHash: null,
        shareExpiresAt: null,
        createdBy: null,
        verificationStatus: 'verified',
        freshnessState: 'fresh',
        freshnessEvaluatedAt: '2026-03-10T12:00:00.000Z',
        lastVerifiedAt: '2026-03-10T12:00:00.000Z',
        lastRefreshedAt: '2026-03-10T12:00:00.000Z',
        publishedAt: '2026-03-10T12:00:00.000Z',
        submittedAt: null,
        withdrawnAt: null,
        supersededAt: null,
        archivedAt: null,
        portabilityMeta: {
          portabilityHash: 'pack-hash',
        },
        metadata: {},
        legacySourceTable: null,
        legacySourceId: null,
      },
    ],
    artifacts: [
      {
        id: '44444444-4444-4444-8444-444444444444',
        ownerType: 'individual_profile',
        ownerId: '22222222-2222-4222-8222-222222222222',
        subjectType: 'skill',
        subjectId: '33333333-3333-4333-8333-333333333333',
        artifactKind: 'document',
        title: 'Artifact',
        description: 'Artifact description',
        sourceUrl: 'https://example.com/artifact',
        storagePath: null,
        mimeType: 'application/pdf',
        issuedAt: '2026-03-01T00:00:00.000Z',
        expiresAt: null,
        visibility: 'public',
        revealGate: 'none',
        metadata: {},
        legacySourceTable: null,
        legacySourceId: null,
        legacySourcePath: null,
      },
    ],
    packItems: [
      {
        id: '55555555-5555-4555-8555-555555555555',
        packId: '11111111-1111-4111-8111-111111111111',
        artifactId: '44444444-4444-4444-8444-444444444444',
        position: 0,
        includedFields: ['title', 'sourceUrl'],
      },
    ],
    submissions: [],
    submissionArtifacts: [],
    verificationReferences: [],
    verificationLogEntries: [],
  },
};

describe('data portability proof contract', () => {
  it('normalizes owner_full proof exports and preserves canonical proof objects for re-import', () => {
    const normalized = normalizeImportRequest({
      data: basePayload,
      mode: 'merge',
      consentAcknowledged: true,
    });

    expect(normalized.mode).toBe('merge');
    expect(normalized.data.proof.scope).toBe('owner_full');
    expect(normalized.data.proof.packs).toHaveLength(1);
    expect(normalized.data.proof.artifacts).toHaveLength(1);
    expect(normalized.data.proof.packItems).toHaveLength(1);
  });

  it('rejects public-safe proof payloads for import', () => {
    expect(() =>
      normalizeImportRequest({
        data: {
          ...basePayload,
          proof: {
            ...basePayload.proof,
            scope: 'public_safe',
          },
        },
        consentAcknowledged: true,
      })
    ).toThrow();
  });
});
