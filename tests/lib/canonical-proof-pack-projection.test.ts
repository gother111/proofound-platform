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
      verificationReferences: [],
      verificationStatus: 'verified',
      freshnessState: 'fresh',
      latestEvidenceAt: null,
    });

    expect(projection).toBeNull();
  });

  it('uses generic typed labels for public-safe upload-backed evidence', () => {
    const projection = buildCanonicalPublicProofPackProjection({
      pack: {
        id: 'pack-2',
        visibility: 'public',
        revealGate: 'none',
        packKind: 'verification_bundle',
        primarySubjectType: 'experience',
        primarySubjectId: 'experience-1',
        lifecycleState: 'published',
        title: 'safe_name.pdf',
        summary: null,
        evidenceSummary: null,
        outcomesSummary: 'Public-safe outcome',
        lastVerifiedAt: null,
        lastRefreshedAt: null,
        portabilityMeta: {},
      } as any,
      items: [
        {
          item: { position: 1, itemClass: 'file_upload', subtypeMetadata: {} } as any,
          effectiveVisibility: 'public',
          artifact: {
            id: 'artifact-2',
            uploadedFileId: 'upload-2',
            artifactKind: 'document',
            title: 'safe_name.pdf',
            description: 'Visible evidence',
            sourceUrl: null,
            storagePath: 'proofs/safe_name.pdf',
            issuedAt: null,
            expiresAt: null,
            deletedAt: null,
            revokedAt: null,
            lifecycleState: 'active',
            metadata: {},
            revealGate: 'none',
          } as any,
          uploadedFile: {
            id: 'upload-2',
            uploadKind: 'document',
            originalFilename: 'Jane Doe Resume.pdf',
            sanitizedFilename: 'safe_name.pdf',
            detectedMime: 'application/pdf',
            lifecycleState: 'attachable',
            safetyStatus: 'clean',
            safetyReason: null,
            attachStatus: 'attached',
            safeForPublic: false,
            metadata: {
              surfaceLabels: {
                review: 'Uploaded PDF document',
                public: 'Uploaded PDF document',
              },
            },
          },
        },
      ],
      verificationReferences: [],
      verificationStatus: 'verified',
      freshnessState: 'fresh',
      latestEvidenceAt: null,
    });

    expect(projection).not.toBeNull();
    expect(projection?.title).toBe('Uploaded PDF document');
    expect(projection?.contract.title).toBe('Uploaded PDF document');
    expect(projection?.items[0]).toEqual(
      expect.objectContaining({
        title: 'Uploaded PDF document',
        artifactDisplayName: 'Uploaded PDF document',
      })
    );
  });
});
