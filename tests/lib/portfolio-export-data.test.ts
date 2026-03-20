/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  listCanonicalProofPackAggregatesForOwnerMock,
  summarizeCanonicalProofOwnerAggregatesMock,
  listVerificationRecordsForOwnerMock,
  summarizeVerificationPolicyMock,
} = vi.hoisted(() => ({
  listCanonicalProofPackAggregatesForOwnerMock: vi.fn(),
  summarizeCanonicalProofOwnerAggregatesMock: vi.fn(),
  listVerificationRecordsForOwnerMock: vi.fn(),
  summarizeVerificationPolicyMock: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', async () => {
  const actual = await vi.importActual<typeof import('@/lib/proofs/canonical-pack')>(
    '@/lib/proofs/canonical-pack'
  );

  return {
    ...actual,
    listCanonicalProofPackAggregatesForOwner: listCanonicalProofPackAggregatesForOwnerMock,
    summarizeCanonicalProofOwnerAggregates: summarizeCanonicalProofOwnerAggregatesMock,
  };
});

vi.mock('@/lib/verification/policy', () => ({
  listVerificationRecordsForOwner: listVerificationRecordsForOwnerMock,
  summarizeVerificationPolicy: summarizeVerificationPolicyMock,
}));

import { fetchTrustExportData } from '@/lib/portfolio/export-data';

describe('fetchTrustExportData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    summarizeCanonicalProofOwnerAggregatesMock.mockReturnValue({
      packCount: 1,
    });
    listVerificationRecordsForOwnerMock.mockResolvedValue([]);
    summarizeVerificationPolicyMock.mockReturnValue({
      publicBadges: [],
      activeIssues: [],
    });
  });

  it('uses only proof-linked anchored skills in owner export output', async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'user-1',
        handle: 'jane',
        display_name: 'Jane Doe',
        public_portfolio_state: 'public_link_only',
        search_indexing_enabled_at: null,
        individual_profiles: {
          headline: 'Impact builder',
          bio: 'Proof-first profile',
          tagline: null,
          redact_mode: false,
          work_email: null,
          work_email_verified: false,
          linkedin_verification_status: 'unverified',
          linkedin_verified_at: null,
          linkedin_verification_data: null,
          verification_status: 'unverified',
          verification_method: null,
          verified_at: null,
          verified: false,
        },
        field_visibility: {
          field_visibility: {
            header: true,
            proofBar: true,
            workEmail: false,
            linkedin: true,
            identity: true,
            counts: true,
            skills: true,
            bio: true,
            contact: false,
          },
        },
      },
    });
    const inMock = vi.fn().mockReturnThis();
    const orderMock = vi.fn().mockReturnThis();
    const limitMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'skill-anchored',
          level: 4,
          skill_code: 'product_strategy',
          taxonomy: {
            name_i18n: {
              en: 'Product Strategy',
            },
          },
        },
      ],
    });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: maybeSingleMock,
              }),
            }),
          };
        }

        if (table === 'skills') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: inMock,
                order: orderMock,
                limit: limitMock,
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as any;

    listCanonicalProofPackAggregatesForOwnerMock.mockResolvedValue([
      {
        pack: {
          id: 'pack-anchored',
          packKind: 'verification_bundle',
          ownerType: 'individual_profile',
          ownerId: 'user-1',
          primarySubjectType: 'experience',
          primarySubjectId: 'experience-1',
          title: 'Anchored pack',
          summary: 'Anchored proof summary',
          evidenceSummary: 'Reviewed by a project lead.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
        },
        ownerFull: {
          contract: {
            status: 'published',
            primaryClaim: { statement: 'Anchored proof summary' },
            ownershipStatement: 'Owned the anchored contribution.',
            verificationSummary: { summary: 'Scoped verification supports this Proof Pack.' },
            proofQualityScore: 0.8,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Anchored pack',
          summary: 'Anchored proof summary',
          evidenceSummary: 'Reviewed by a project lead.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
          items: [
            {
              artifactId: 'artifact-1',
              itemClass: 'linked_evidence',
              subtypeMetadata: {},
              artifact: {
                subjectType: 'skill',
                subjectId: 'skill-anchored',
                title: 'Launch memo',
                sourceUrl: 'https://example.com/launch-memo',
                artifactKind: 'link',
                issuedAt: '2026-02-20',
                description: 'Public launch memo',
              },
            },
          ],
          verificationReferences: [
            {
              id: 'verification-1',
              subjectType: 'skill',
              subjectId: 'skill-anchored',
            },
          ],
        },
        publicSafe: {
          contract: {
            status: 'published',
            primaryClaim: { statement: 'Anchored proof summary' },
            ownershipStatement: 'Owned the anchored contribution.',
            verificationSummary: { summary: 'Scoped verification supports this Proof Pack.' },
            proofQualityScore: 0.8,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Anchored pack',
          summary: 'Anchored proof summary',
          evidenceSummary: 'Reviewed by a project lead.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
          items: [],
        },
        items: [],
        verificationReferences: [
          {
            id: 'verification-1',
            status: 'verified',
          },
        ],
        verificationStatus: 'verified',
        freshnessState: 'fresh',
      },
      {
        pack: {
          id: 'pack-orphan',
          packKind: 'verification_bundle',
          ownerType: 'individual_profile',
          ownerId: 'user-1',
          primarySubjectType: 'skill',
          primarySubjectId: 'skill-floating',
          title: 'Floating pack',
          summary: 'Legacy floating proof',
          evidenceSummary: null,
          outcomesSummary: null,
        },
        ownerFull: {
          contract: {
            status: 'published',
            primaryClaim: { statement: 'Legacy floating proof' },
            ownershipStatement: 'Owned the floating contribution.',
            verificationSummary: { summary: 'Supporting evidence only.' },
            proofQualityScore: 0.4,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Floating pack',
          summary: 'Legacy floating proof',
          evidenceSummary: null,
          outcomesSummary: null,
          items: [
            {
              artifactId: 'artifact-2',
              itemClass: 'linked_evidence',
              subtypeMetadata: {},
              artifact: {
                subjectType: 'skill',
                subjectId: 'skill-floating',
                title: 'Legacy evidence',
                sourceUrl: 'https://example.com/legacy-evidence',
                artifactKind: 'link',
                issuedAt: '2026-02-01',
                description: 'Legacy proof',
              },
            },
          ],
          verificationReferences: [],
        },
        publicSafe: null,
        items: [],
        verificationReferences: [],
        verificationStatus: 'unverified',
        freshnessState: 'fresh',
      },
    ]);

    const exportData = await fetchTrustExportData(supabase, 'user-1');

    expect(exportData).not.toBeNull();
    expect(inMock).toHaveBeenCalledWith('id', ['skill-anchored']);
    expect(exportData?.skills).toEqual([
      expect.objectContaining({
        id: 'skill-anchored',
        name: 'Product Strategy',
      }),
    ]);
    expect(exportData?.proofPacks).toEqual([
      expect.objectContaining({
        id: 'pack-anchored',
      }),
      expect.objectContaining({
        id: 'pack-orphan',
      }),
    ]);
  });
});
