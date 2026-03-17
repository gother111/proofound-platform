import { describe, expect, it } from 'vitest';

import { buildCanonicalPublicProofPackProjection } from '@/lib/proofs/canonical-pack';

describe('buildCanonicalPublicProofPackProjection', () => {
  it('omits artifacts backed by uploads held for privacy review', () => {
    const projection = buildCanonicalPublicProofPackProjection({
      pack: {
        id: 'pack-1',
        visibility: 'public',
        packKind: 'verification_bundle',
        primarySubjectType: 'experience',
        primarySubjectId: 'experience-1',
        lifecycleState: 'published',
        title: 'unsafe_name.pdf',
        summary: null,
        evidenceSummary: null,
        outcomesSummary: 'Public-safe outcome',
        lastVerifiedAt: null,
        lastRefreshedAt: null,
        portabilityMeta: {},
      } as any,
      items: [
        {
          item: { position: 1 } as any,
          effectiveVisibility: 'public',
          artifact: {
            id: 'artifact-1',
            artifactKind: 'document',
            title: 'unsafe_name.pdf',
            description: 'Hidden metadata artifact',
            sourceUrl: null,
            issuedAt: null,
            expiresAt: null,
            deletedAt: null,
            revokedAt: null,
            lifecycleState: 'active',
          } as any,
          uploadedFile: {
            id: 'upload-1',
            lifecycleState: 'quarantined',
            safetyStatus: 'manual_review',
            safetyReason: 'privacy_review_required:metadata_exif',
            attachStatus: 'pending',
            safeForPublic: false,
          },
        },
      ],
      verificationStatus: 'verified',
      freshnessState: 'fresh',
      latestEvidenceAt: null,
    });

    expect(projection).toBeNull();
  });
});
