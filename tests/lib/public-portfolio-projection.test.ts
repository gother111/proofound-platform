import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/verification/policy', () => ({
  listVerificationRecordsForOwner: vi.fn(),
  summarizeVerificationPolicy: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalProofPackAggregatesForOwner: vi.fn(),
}));

import { db } from '@/db';
import { getPublicIndividualPortfolioProjectionByHandle } from '@/lib/portfolio/public-projection';
import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';

function mockVerificationSummary() {
  return {
    badgeSemanticsVersion: 2,
    recordsEvaluated: 0,
    slots: {
      identity: { publicLabel: null },
      workplace: { publicLabel: null },
      organizationDomain: { publicLabel: null },
      organizationPlatformReview: { publicLabel: null },
    },
    evidence: {
      verifiedCount: 0,
      latestVerifiedAt: null,
      publicLabel: null,
    },
    activeIssues: [],
    publicBadges: [],
    orgReviewBadges: [],
    internalBadges: [],
    compatibility: {
      verificationTier: 'unverified',
      verificationTierSource: 'unknown',
      verificationStatus: 'unverified',
      verificationMethod: null,
      verified: false,
      workEmailVerified: false,
      workEmailNeedsReverify: false,
      orgTrustStatus: 'unverified',
      orgVerified: false,
    },
  };
}

describe('public portfolio projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.execute as any).mockReset();
    vi.mocked(listVerificationRecordsForOwner as any).mockReset();
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockReset();
    vi.mocked(summarizeVerificationPolicy as any).mockReturnValue(mockVerificationSummary());
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([]);
  });

  it('counts only currently public proof in the shared projection and export payload', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce({
      rows: [
        {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          deleted: false,
          headline: 'Impact builder',
          bio: 'Public bio',
          tagline: null,
          skills: ['Strategy'],
          redact_mode: false,
          verification_status: 'unverified',
          verification_method: null,
          verified_at: null,
          work_email: null,
          work_email_verified: false,
          linkedin_verification_status: 'unverified',
          linkedin_verified_at: null,
          linkedin_verification_data: null,
          verified: false,
          field_visibility: {
            bio: true,
            contact: false,
            workEmail: false,
            skills: true,
            counts: true,
            proofBar: true,
            header: true,
            identity: true,
            linkedin: true,
          },
          display_name_visibility: 'public',
          headline_visibility: 'public',
          skills_visibility: 'public',
        },
      ],
    });
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      {
        pack: {
          ownerId: 'user-1',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-public',
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              revealGate: 'none',
            },
          },
          {
            effectiveVisibility: 'matched_org',
            artifact: {
              revealGate: 'match_exists',
            },
          },
        ],
        publicSafe: {
          items: [
            {
              artifactId: 'artifact-public',
              artifactKind: 'link',
              title: 'Public proof',
              description: 'Visible evidence',
              sourceUrl: 'https://example.com/public-proof',
              issuedAt: '2026-01-15T00:00:00.000Z',
              expiresAt: null,
            },
          ],
          outcomesSummary: null,
        },
        verificationStatus: 'verified',
        latestEvidenceAt: new Date('2026-01-15T00:00:00.000Z'),
      },
      {
        pack: {
          ownerId: 'user-1',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-legacy-public',
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              revealGate: 'none',
            },
          },
        ],
        publicSafe: {
          items: [
            {
              artifactId: 'legacy-public',
              artifactKind: 'link',
              title: 'Legacy public proof',
              description: 'Legacy visible evidence',
              sourceUrl: 'https://example.com/legacy-public',
              issuedAt: '2026-01-12T00:00:00.000Z',
              expiresAt: null,
            },
          ],
          outcomesSummary: null,
        },
        verificationStatus: 'unverified',
        latestEvidenceAt: new Date('2026-01-12T00:00:00.000Z'),
      },
    ]);

    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([
      {
        status: 'verified',
        subjectType: 'skill',
        subjectId: 'skill-public',
        verificationKind: 'skill_attestation_manager',
      },
      {
        status: 'verified',
        subjectType: 'skill',
        subjectId: 'skill-gated',
        verificationKind: 'skill_attestation_manager',
      },
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.publicProofCount).toBe(2);
    expect(projection?.featuredProofs.map((proof) => proof.title)).toEqual([
      'Public proof',
      'Legacy public proof',
    ]);
    expect(
      projection?.featuredProofs.find((proof) => proof.title === 'Reveal-gated proof')
    ).toBeUndefined();
    expect(projection?.hasRevealGatedContent).toBe(true);
    expect(projection?.exportData.signals.proofs.count).toBe(2);
    expect(projection?.exportData.signals.verifications.count).toBe(1);
  });

  it('removes withdrawn or disabled proof from public projection immediately', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce({
      rows: [
        {
          id: 'user-1',
          handle: 'jane',
          display_name: 'Jane Doe',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          deleted: false,
          headline: 'Impact builder',
          bio: 'Public bio',
          tagline: null,
          skills: ['Strategy'],
          redact_mode: false,
          verification_status: 'unverified',
          verification_method: null,
          verified_at: null,
          work_email: null,
          work_email_verified: false,
          linkedin_verification_status: 'unverified',
          linkedin_verified_at: null,
          linkedin_verification_data: null,
          verified: false,
          field_visibility: {
            bio: true,
            contact: false,
            workEmail: false,
            skills: true,
            counts: true,
            proofBar: true,
            header: true,
            identity: true,
            linkedin: true,
          },
          display_name_visibility: 'public',
          headline_visibility: 'public',
          skills_visibility: 'public',
        },
      ],
    });
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      {
        pack: {
          ownerId: 'user-1',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-public',
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              revealGate: 'none',
            },
          },
        ],
        publicSafe: null,
        verificationStatus: 'unverified',
        latestEvidenceAt: null,
      },
    ]);

    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.publicProofCount).toBe(0);
    expect(projection?.featuredProofs).toEqual([]);
    expect(projection?.exportData.signals.proofs.count).toBe(0);
  });
});
