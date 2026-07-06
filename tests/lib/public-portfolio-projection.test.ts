import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
import {
  getPublicIndividualPortfolioProjectionByHandle,
  getPublicOrganizationPortfolioProjectionBySlug,
} from '@/lib/portfolio/public-projection';
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

function profileRow(overrides: Record<string, unknown> = {}) {
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
        ...overrides,
      },
    ],
  };
}

function publicReadyAggregate(overrides: Record<string, any> = {}) {
  const item = {
    effectiveVisibility: 'public',
    artifact: {
      id: 'artifact-public',
      subjectType: 'experience',
      subjectId: 'experience-1',
      revealGate: 'none',
    },
    ...(overrides.item ?? {}),
  };
  const publicItem = {
    artifactId: 'artifact-public',
    artifactKind: 'link',
    title: 'Launch memo',
    artifactDisplayName: 'Launch memo',
    description: 'Visible evidence',
    sourceUrl: 'https://example.com/public-proof',
    issuedAt: '2026-01-15T00:00:00.000Z',
    expiresAt: null,
    semanticsNote: 'Supporting evidence only, not full verification.',
    ...(overrides.publicItem ?? {}),
  };

  return {
    pack: {
      id: 'pack-public',
      ownerId: 'user-1',
      packKind: 'verification_bundle',
      primarySubjectType: 'experience',
      primarySubjectId: 'experience-1',
      title: 'Public pack',
      summary: null,
      evidenceSummary: null,
      outcomesSummary: 'Shipped a proof-first launch.',
      contextJson: {},
      metadata: {},
      ...(overrides.pack ?? {}),
    },
    items: [item, ...(overrides.items ?? [])],
    verificationReferences: [
      {
        id: 'verification-public',
        status: 'verified',
        integrityStatus: 'clear',
        disputeState: 'none',
        verificationKind: 'impact_attestation',
        subjectType: 'experience',
        subjectId: 'experience-1',
        proofArtifactId: null,
      },
      ...(overrides.verificationReferences ?? []),
    ],
    publicSafe: {
      contract: {
        status: 'published',
        title: 'Public pack',
        primaryClaim: { statement: 'Public pack claim' },
        ownershipStatement: 'Owned the public contribution.',
        verificationSummary: {
          summary: 'Scoped verification supports this proof record.',
        },
        proofQualityScore: 0.8,
        schemaVersion: 'proof_pack/v2',
        ...(overrides.contract ?? {}),
      },
      title: 'Public pack',
      summary: null,
      evidenceSummary: null,
      outcomesSummary: 'Shipped a proof-first launch.',
      items: [publicItem, ...(overrides.publicItems ?? [])],
      ...(overrides.publicSafe ?? {}),
    },
    verificationStatus: 'verified',
    freshnessState: 'fresh',
    latestEvidenceAt: new Date('2026-01-15T00:00:00.000Z'),
    ...overrides.aggregate,
  };
}

describe('public portfolio projection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
    delete process.env.PROOFOUND_VISUAL_FIXTURES;
    vi.mocked(summarizeVerificationPolicy as any).mockReturnValue(mockVerificationSummary());
    vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([]);
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([]);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
    delete process.env.PROOFOUND_VISUAL_FIXTURES;
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
        verificationReferences: [
          {
            id: 'verification-anchored',
            status: 'verified',
            integrityStatus: 'clear',
            disputeState: 'none',
            verificationKind: 'skill_attestation_manager',
            subjectType: 'skill',
            subjectId: 'skill-anchored',
            proofArtifactId: null,
          },
        ],
        publicSafe: {
          contract: {
            status: 'published',
            title: 'Anchored pack',
            primaryClaim: { statement: 'Anchored pack claim' },
            ownershipStatement: 'Owned the anchored contribution.',
            verificationSummary: {
              summary: 'Scoped verification supports this proof record.',
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
              summary: 'No scoped verification is recorded for this proof record yet.',
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
    expect(projection?.verifiedPublicProofPackCount).toBe(1);
    expect(projection?.effectiveState).toBe('public_link_only');
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
    expect(projection?.exportData.proofPacks[0]).not.toHaveProperty('proofQualityScore');
    expect(JSON.stringify(projection?.exportData)).not.toContain('proofQualityScore');
    expect(JSON.stringify(projection)).not.toContain('Jane Doe Resume.pdf');
  });

  it('builds the profile summary only from public-safe structured proof context tokens', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(profileRow());
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      publicReadyAggregate({
        pack: {
          title: 'Launch corridor proof',
          contextJson: {
            contextCompanySize: '11-50',
            contextFocusArea: 'Proof systems',
            contextIndustryDomain: 'Proof-first assignment review',
            contextScope: 'global',
            contextOperatingEnvironment: 'Remote launch team',
          },
          outcomesSummary: 'Do not promote this outcome as biography.',
        },
        contract: {
          title: 'Launch corridor proof',
          primaryClaim: { statement: 'Do not use this claim as summary copy.' },
        },
      }),
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.traceableSummary).toMatchObject({
      provenanceLabel: 'Generated from public-safe proof records and context tokens',
      hasEnoughData: true,
      segments: [
        expect.objectContaining({
          key: 'scale',
          state: 'ready',
          value: 'Company size: 11-50',
          sources: [
            expect.objectContaining({
              label: 'Launch corridor proof',
              detail: 'Experience',
            }),
          ],
        }),
        expect.objectContaining({
          key: 'focus',
          state: 'ready',
          value: 'Work area: Proof systems',
        }),
        expect.objectContaining({
          key: 'context',
          state: 'ready',
          value:
            'Industry: Proof-first assignment review · Operating environment: Remote launch team · Scope: global',
        }),
      ],
    });
    expect(JSON.stringify(projection?.traceableSummary)).not.toContain(
      'Do not promote this outcome as biography.'
    );
    expect(JSON.stringify(projection?.traceableSummary)).not.toContain(
      'Do not use this claim as summary copy.'
    );
  });

  it('serves the local mock organization public trust page only in visual fixture mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    process.env.PROOFOUND_VISUAL_FIXTURES = 'true';

    const projection = await getPublicOrganizationPortfolioProjectionBySlug('test-org');

    expect(projection).not.toBeNull();
    expect(projection?.effectiveState).toBe('public_link_only');
    expect(projection?.publicDisplayName).toBe('Test Organization');
    expect(projection?.minimumContentMet).toBe(true);
    expect(projection?.assignmentSnapshot?.role).toBe('Proof-first product reviewer');
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('does not serve mock organization public trust pages in plain mock Supabase mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    vi.mocked(db.execute as any).mockResolvedValueOnce({ rows: [] });

    const projection = await getPublicOrganizationPortfolioProjectionBySlug('test-org');

    expect(projection).toBeNull();
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it('does not make a generic organization fallback summary enough for a public trust page', async () => {
    vi.mocked(db.execute as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'org-1',
            slug: 'thin-org',
            display_name: 'Thin Org',
            public_portfolio_state: 'public_link_only',
            search_indexing_enabled_at: null,
            trust_status: 'unverified',
            trust_status_updated_at: null,
            website_verified_at: null,
            operating_region: null,
            verified: false,
            website: null,
            tagline: null,
            mission: null,
            working_context: null,
            type: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ display_name: 'public', mission: 'public' }] })
      .mockResolvedValueOnce({ rows: [] });

    const projection = await getPublicOrganizationPortfolioProjectionBySlug('thin-org');

    expect(projection).not.toBeNull();
    expect(projection?.publicSummary).toBe('Public organization trust page on Proofound.');
    expect(projection?.minimumContentMet).toBe(false);
    expect(projection?.effectiveState).toBe('unavailable');
  });

  it('serves the local mock individual public page only in visual fixture mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    process.env.PROOFOUND_VISUAL_FIXTURES = 'true';

    const projection = await getPublicIndividualPortfolioProjectionByHandle('demo-proofound');

    expect(projection).not.toBeNull();
    expect(projection?.effectiveState).toBe('public_link_only');
    expect(projection?.publicDisplayName).toBe('Mika Andersson');
    expect(projection?.minimumContentMet).toBe(true);
    expect(projection?.exportData.proofPacks).toHaveLength(2);
    expect(JSON.stringify(projection?.exportData.proofPacks)).not.toContain('proofQualityScore');
    expect(projection?.publicSkills.length).toBeGreaterThan(3);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('accepts the mock individual handle alias in visual fixture mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    process.env.PROOFOUND_VISUAL_FIXTURES = 'true';

    const projection = await getPublicIndividualPortfolioProjectionByHandle('mock-individual');

    expect(projection).not.toBeNull();
    expect(projection?.handle).toBe('demo-proofound');
    expect(projection?.publicDisplayName).toBe('Mika Andersson');
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('does not serve mock individual public pages in plain mock Supabase mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    vi.mocked(db.execute as any).mockResolvedValueOnce({ rows: [] });

    const projection = await getPublicIndividualPortfolioProjectionByHandle('demo-proofound');

    expect(projection).toBeNull();
    expect(db.execute).toHaveBeenCalledTimes(1);
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
              summary: 'No scoped verification is recorded for this proof record yet.',
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
    expect(projection?.verifiedPublicProofPackCount).toBe(0);
    expect(projection?.featuredProofs).toEqual([]);
    expect(projection?.publicSkills).toEqual([]);
    expect(projection?.exportData.skills).toEqual([]);
    expect(projection?.exportData.signals.proofs.count).toBe(0);
    expect(projection?.exportData.proofPacks).toEqual([]);
  });

  it('allows public access when anchored proof has no accepted non-self verification', async () => {
    vi.mocked(db.execute as any)
      .mockResolvedValueOnce(profileRow())
      .mockResolvedValueOnce({ rows: [] });
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      {
        pack: {
          id: 'pack-unverified',
          ownerId: 'user-1',
          packKind: 'verification_bundle',
          primarySubjectType: 'experience',
          primarySubjectId: 'experience-1',
          title: 'Unverified anchored pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: 'Looks useful but has no accepted verification.',
        },
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              id: 'artifact-unverified',
              subjectType: 'skill',
              subjectId: 'skill-unverified',
              revealGate: 'none',
            },
          },
        ],
        verificationReferences: [],
        publicSafe: {
          contract: {
            status: 'published',
            title: 'Unverified anchored pack',
            primaryClaim: { statement: 'Unverified anchored pack claim' },
            ownershipStatement: 'Owned the work.',
            verificationSummary: {
              summary: 'No scoped verification is recorded for this proof record yet.',
            },
            proofQualityScore: 0.5,
            schemaVersion: 'proof_pack/v2',
          },
          title: 'Unverified anchored pack',
          summary: null,
          evidenceSummary: null,
          outcomesSummary: 'Looks useful but has no accepted verification.',
          items: [
            {
              artifactId: 'artifact-unverified',
              artifactKind: 'link',
              title: 'Unverified proof',
              description: 'Visible evidence',
              sourceUrl: 'https://example.com/unverified-proof',
              issuedAt: '2026-01-12T00:00:00.000Z',
              expiresAt: null,
              semanticsNote: 'Supporting evidence only, not full verification.',
            },
          ],
        },
        verificationStatus: 'unverified',
        freshnessState: 'fresh',
        latestEvidenceAt: new Date('2026-01-12T00:00:00.000Z'),
      },
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.publicProofCount).toBe(1);
    expect(projection?.verifiedPublicProofPackCount).toBe(0);
    expect(projection?.minimumContentMet).toBe(true);
    expect(projection?.effectiveState).toBe('public_link_only');
    expect(projection?.exportData.proofPacks[0]?.verificationStatus).toBe('unverified');
  });

  it('keeps individual Public Pages noindex even when stale data requested search indexing', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(
      profileRow({
        public_portfolio_state: 'public_indexable',
        search_indexing_enabled_at: '2026-03-20T10:00:00.000Z',
      })
    );
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      publicReadyAggregate(),
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.effectiveState).toBe('public_noindex');
    expect(projection?.metadata.useGenericPreview).toBe(true);
    expect(projection?.exportData.publication).toMatchObject({
      requestedState: 'public_indexable',
      effectiveState: 'public_noindex',
      searchIndexingEnabled: false,
    });
  });

  it.each([
    [
      'link-only',
      publicReadyAggregate({
        items: [
          {
            effectiveVisibility: 'link_only',
            artifact: {
              id: 'artifact-link-only',
              subjectType: 'experience',
              subjectId: 'experience-1',
              revealGate: 'none',
            },
          },
        ],
      }),
      { hasLinkOnlyContent: true, hasRevealGatedContent: false },
    ],
    [
      'reveal-gated',
      publicReadyAggregate({
        items: [
          {
            effectiveVisibility: 'public',
            artifact: {
              id: 'artifact-reveal-gated',
              subjectType: 'experience',
              subjectId: 'experience-1',
              revealGate: 'conversation_started',
            },
          },
        ],
      }),
      { hasLinkOnlyContent: false, hasRevealGatedContent: true },
    ],
    [
      'private',
      publicReadyAggregate({
        items: [
          {
            effectiveVisibility: 'owner_only',
            artifact: {
              id: 'artifact-private',
              subjectType: 'experience',
              subjectId: 'experience-1',
              revealGate: 'none',
            },
          },
        ],
      }),
      { hasLinkOnlyContent: false, hasRevealGatedContent: false },
    ],
  ])(
    'downgrades explicit search indexing when %s evidence is present',
    async (_, aggregate, flags) => {
      vi.clearAllMocks();
      vi.mocked(summarizeVerificationPolicy as any).mockReturnValue(mockVerificationSummary());
      vi.mocked(listVerificationRecordsForOwner as any).mockResolvedValue([]);
      vi.mocked(db.execute as any).mockResolvedValueOnce(
        profileRow({
          public_portfolio_state: 'public_indexable',
          search_indexing_enabled_at: '2026-03-20T10:00:00.000Z',
        })
      );
      vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([aggregate]);

      const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

      expect(projection).not.toBeNull();
      expect(projection?.effectiveState).toBe('public_noindex');
      expect(projection).toMatchObject(flags);
      expect(projection?.publicProofCount).toBe(1);
    }
  );

  it('keeps hidden review-stage fields and filename labels out of the public projection', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(
      profileRow({
        display_name: 'Jane Secret',
        public_portfolio_state: 'public_indexable',
        search_indexing_enabled_at: '2026-03-20T10:00:00.000Z',
        headline: 'Hidden headline',
        bio: 'Hidden bio',
        work_email: 'jane.secret@example.com',
        field_visibility: {
          bio: false,
          contact: false,
          workEmail: false,
          skills: false,
          counts: true,
          proofBar: true,
          header: true,
          identity: false,
          linkedin: false,
        },
        display_name_visibility: 'private',
        headline_visibility: 'private',
        skills_visibility: 'private',
      })
    );
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      publicReadyAggregate({
        pack: {
          contextJson: {
            exactLocation: 'Sankt Eriksgatan 10, Stockholm',
            employerNames: ['Acme Climate AB'],
            schoolNames: ['Stockholm University'],
          },
          metadata: {
            topic_label: 'Public Strategy',
            hiddenReviewerNote: 'private reviewer note',
          },
        },
        publicItem: {
          title: 'Jane_Doe_Resume.pdf',
          artifactDisplayName: 'Jane Doe Resume.pdf',
          description:
            'Public-safe description for Acme Climate AB near Sankt Eriksgatan 10, Stockholm.',
        },
      }),
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');
    const serialized = JSON.stringify(projection);

    expect(projection).not.toBeNull();
    expect(projection?.effectiveState).toBe('public_noindex');
    expect(projection?.publicDisplayName).toBe('jane');
    expect(projection?.publicHeadline).toBe('');
    expect(projection?.publicBio).toBeNull();
    expect(projection?.individual.work_email).toBeNull();
    expect(projection?.exportData.profile.contactEmail).toBeUndefined();
    expect(projection?.exportData.proofPacks).toHaveLength(1);
    expect(projection?.exportData.proofPacks[0]?.selectedEvidence[0]).toMatchObject({
      title: 'Uploaded PDF document',
      artifactDisplayName: 'Uploaded PDF document',
    });
    expect(projection?.featuredProofs[0]?.title).toBe('Uploaded PDF document');
    expect(serialized).not.toContain('Jane Secret');
    expect(serialized).not.toContain('Hidden headline');
    expect(serialized).not.toContain('Hidden bio');
    expect(serialized).not.toContain('jane.secret@example.com');
    expect(serialized).not.toContain('Jane Doe Resume.pdf');
    expect(serialized).not.toContain('Jane_Doe_Resume.pdf');
    expect(serialized).not.toContain('Sankt Eriksgatan 10');
    expect(serialized).not.toContain('Acme Climate AB');
    expect(serialized).not.toContain('Stockholm University');
    expect(serialized).not.toContain('private reviewer note');
  });

  it('keeps legacy string visibility values hidden on public portfolio projections', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(
      profileRow({
        public_portfolio_state: 'public_indexable',
        search_indexing_enabled_at: '2026-03-20T10:00:00.000Z',
        bio: 'Private biography',
        work_email: 'jane.private@example.com',
        field_visibility: {
          bio: 'private',
          contact: 'private',
          workEmail: 'private',
          skills: 'private',
          counts: 'private',
          proofBar: true,
          header: true,
          identity: false,
          linkedin: false,
        },
        skills_visibility: 'public',
      })
    );
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      publicReadyAggregate(),
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');
    const serialized = JSON.stringify(projection);

    expect(projection).not.toBeNull();
    expect(projection?.publicBio).toBeNull();
    expect(projection?.publicSkills).toEqual([]);
    expect(projection?.individual.work_email).toBeNull();
    expect(projection?.exportData.profile.contactEmail).toBeUndefined();
    expect(serialized).not.toContain('Private biography');
    expect(serialized).not.toContain('jane.private@example.com');
    expect(serialized).not.toContain('Floating Skill');
  });

  it('omits private signed evidence URLs from public proof links', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(profileRow());
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      publicReadyAggregate({
        publicItem: {
          sourceUrl:
            'https://project.supabase.co/storage/v1/object/sign/user-uploads-private/user-1/proof.pdf?token=secret&expires=999999',
        },
      }),
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');

    expect(projection).not.toBeNull();
    expect(projection?.exportData.proofPacks[0]?.selectedEvidence[0]?.href).toBeNull();
    expect(projection?.featuredProofs[0]?.evidence).toEqual([]);
    expect(projection?.featuredProofs[0]?.proofPackHref).toBeNull();
    expect(JSON.stringify(projection)).not.toContain('token=secret');
    expect(JSON.stringify(projection)).not.toContain('user-uploads-private');
  });

  it('redacts hidden context labels before publishing proof-pack context', async () => {
    vi.mocked(db.execute as any).mockResolvedValueOnce(profileRow());
    vi.mocked(listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      publicReadyAggregate({
        pack: {
          contextJson: {
            employerNames: ['Acme Climate AB'],
            primaryAnchorLabel: 'Acme Climate AB launch role',
          },
        },
      }),
    ]);

    const projection = await getPublicIndividualPortfolioProjectionByHandle('jane');
    const proofPack = projection?.exportData.proofPacks[0];

    expect(projection).not.toBeNull();
    expect(proofPack?.contextLabel).toBe('Experience');
    expect(JSON.stringify(projection)).not.toContain('Acme Climate AB');
  });
});
