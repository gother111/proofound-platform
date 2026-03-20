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
  hasPrimaryAnchorContext: vi.fn(
    (pack: { primarySubjectType?: string | null; primarySubjectId?: string | null }) =>
      ['experience', 'education', 'volunteering'].includes(pack.primarySubjectType || '') &&
      typeof pack.primarySubjectId === 'string'
  ),
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

function profileRow() {
  return {
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
        skills: ['Floating Skill'],
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
  };
}

describe('public portfolio projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(summarizeVerificationPolicy as any).mockReturnValue(mockVerificationSummary());
    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([]);
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([]);
  });

  it('projects only anchored public proof and its supported skills', async () => {
    vi.mocked(db.execute as any)
      .mockResolvedValueOnce(profileRow())
      .mockResolvedValueOnce({
        rows: [{ id: 'skill-anchored', name: 'Anchored Skill' }],
      });

    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      {
        pack: {
          id: 'pack-anchored',
          ownerId: 'user-1',
          packKind: 'verification_bundle',
          primarySubjectType: 'experience',
          primarySubjectId: 'experience-1',
          title: 'Anchored pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: 'Shipped a proof-first launch.',
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              subjectType: 'skill',
              subjectId: 'skill-anchored',
              revealGate: 'none',
            },
          },
        ],
        verificationReferences: [],
        publicSafe: {
          contract: {
            status: 'published',
            title: 'Anchored pack',
            primaryClaim: { statement: 'Anchored pack claim' },
            ownershipStatement: 'Owned the anchored contribution.',
            verificationSummary: {
              summary: 'Scoped verification supports this Proof Pack.',
            },
            proofQualityScore: 0.8,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Anchored pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: 'Shipped a proof-first launch.',
          items: [
            {
              artifactId: 'artifact-public',
              artifactKind: 'link',
              title: 'Uploaded document',
              artifactDisplayName: 'Uploaded document',
              description: 'Visible evidence',
              sourceUrl: 'https://example.com/public-proof',
              issuedAt: '2026-01-15T00:00:00.000Z',
              expiresAt: null,
              semanticsNote: 'Supporting evidence only, not full verification.',
            },
          ],
        },
        verificationStatus: 'verified',
        freshnessState: 'fresh',
        latestEvidenceAt: new Date('2026-01-15T00:00:00.000Z'),
      },
      {
        pack: {
          id: 'pack-orphan',
          ownerId: 'user-1',
          packKind: 'verification_bundle',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-floating',
          title: 'Floating pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: null,
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              subjectType: 'skill',
              subjectId: 'skill-floating',
              revealGate: 'none',
            },
          },
        ],
        verificationReferences: [],
        publicSafe: {
          contract: {
            status: 'published',
            title: 'Floating pack',
            primaryClaim: { statement: 'Floating pack claim' },
            ownershipStatement: null,
            verificationSummary: {
              summary: 'No scoped verification is recorded for this Proof Pack yet.',
            },
            proofQualityScore: 0.4,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Floating pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: null,
          items: [
            {
              artifactId: 'artifact-orphan',
              artifactKind: 'link',
              title: 'Floating proof',
              description: 'Legacy evidence',
              sourceUrl: 'https://example.com/floating-proof',
              issuedAt: '2026-01-12T00:00:00.000Z',
              expiresAt: null,
              semanticsNote: 'Supporting evidence only, not full verification.',
            },
          ],
        },
        verificationStatus: 'verified',
        freshnessState: 'fresh',
        latestEvidenceAt: new Date('2026-01-12T00:00:00.000Z'),
      },
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.publicProofCount).toBe(1);
    expect(projection?.featuredProofs.map((proof) => proof.title)).toEqual(['Uploaded document']);
    expect(projection?.publicSkills).toEqual(['Anchored Skill']);
    expect(projection?.exportData.signals.proofs.count).toBe(1);
    expect(projection?.exportData.skills).toEqual([
      expect.objectContaining({
        name: 'Anchored Skill',
      }),
    ]);
    expect(projection?.jsonLd.description).toContain('Shipped a proof-first launch.');
    expect(projection?.exportData.signals).not.toHaveProperty('attestations');
    expect(projection?.exportData.proofPacks).toEqual([
      expect.objectContaining({
        id: 'pack-anchored',
        selectedEvidence: [
          expect.objectContaining({
            title: 'Uploaded document',
            artifactDisplayName: 'Uploaded document',
          }),
        ],
      }),
    ]);
    expect(JSON.stringify(projection)).not.toContain('Jane Doe Resume.pdf');
  });

  it('does not let orphan packs or floating skills raise public trust projections', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(profileRow());
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      {
        pack: {
          id: 'pack-orphan',
          ownerId: 'user-1',
          packKind: 'verification_bundle',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-floating',
          title: 'Floating pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: null,
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              subjectType: 'skill',
              subjectId: 'skill-floating',
              revealGate: 'none',
            },
          },
        ],
        verificationReferences: [],
        publicSafe: {
          contract: {
            status: 'published',
            title: 'Floating pack',
            primaryClaim: { statement: 'Floating pack claim' },
            ownershipStatement: null,
            verificationSummary: {
              summary: 'No scoped verification is recorded for this Proof Pack yet.',
            },
            proofQualityScore: 0.4,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Floating pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: null,
          items: [
            {
              artifactId: 'artifact-orphan',
              artifactKind: 'link',
              title: 'Floating proof',
              description: 'Legacy evidence',
              sourceUrl: 'https://example.com/floating-proof',
              issuedAt: '2026-01-12T00:00:00.000Z',
              expiresAt: null,
              semanticsNote: 'Supporting evidence only, not full verification.',
            },
          ],
        },
        verificationStatus: 'verified',
        freshnessState: 'fresh',
        latestEvidenceAt: new Date('2026-01-12T00:00:00.000Z'),
      },
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.publicProofCount).toBe(0);
    expect(projection?.featuredProofs).toEqual([]);
    expect(projection?.publicSkills).toEqual([]);
    expect(projection?.exportData.skills).toEqual([]);
    expect(projection?.exportData.signals.proofs.count).toBe(0);
    expect(projection?.exportData.proofPacks).toEqual([]);
  });
});
