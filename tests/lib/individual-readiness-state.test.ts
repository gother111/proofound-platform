import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  profilesFindFirstMock,
  individualProfilesFindFirstMock,
  matchingProfilesFindFirstMock,
  skillsFindManyMock,
  experiencesFindManyMock,
  educationFindManyMock,
  volunteeringFindManyMock,
  publicationFindFirstMock,
  listCanonicalProofPackAggregatesForOwnerMock,
} = vi.hoisted(() => ({
  profilesFindFirstMock: vi.fn(),
  individualProfilesFindFirstMock: vi.fn(),
  matchingProfilesFindFirstMock: vi.fn(),
  skillsFindManyMock: vi.fn(),
  experiencesFindManyMock: vi.fn(),
  educationFindManyMock: vi.fn(),
  volunteeringFindManyMock: vi.fn(),
  publicationFindFirstMock: vi.fn(),
  listCanonicalProofPackAggregatesForOwnerMock: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      profiles: { findFirst: profilesFindFirstMock },
      individualProfiles: { findFirst: individualProfilesFindFirstMock },
      matchingProfiles: { findFirst: matchingProfilesFindFirstMock },
      skills: { findMany: skillsFindManyMock },
      experiences: { findMany: experiencesFindManyMock },
      education: { findMany: educationFindManyMock },
      volunteering: { findMany: volunteeringFindManyMock },
      portfolioPublicationStates: { findFirst: publicationFindFirstMock },
    },
  },
}));

vi.mock('@/lib/proofs/canonical-pack', async () => {
  const actual = await vi.importActual<typeof import('@/lib/proofs/canonical-pack')>(
    '@/lib/proofs/canonical-pack'
  );

  return {
    ...actual,
    listCanonicalProofPackAggregatesForOwner: listCanonicalProofPackAggregatesForOwnerMock,
  };
});

import { getIndividualReadinessState } from '@/lib/readiness/individual-state';

function createAnchoredAggregate({
  skillIds,
  verification = true,
  latestEvidenceAt = new Date().toISOString(),
}: {
  skillIds: string[];
  verification?: boolean;
  latestEvidenceAt?: string;
}) {
  return {
    pack: {
      id: 'pack-anchored',
      packKind: 'verification_bundle',
      primarySubjectType: 'experience',
      primarySubjectId: 'ctx-1',
    },
    items: skillIds.map((skillId, index) => ({
      position: index,
      effectiveVisibility: 'public',
      artifact: {
        id: `artifact-${skillId}`,
        subjectType: 'skill',
        subjectId: skillId,
        revealGate: 'none',
      },
    })),
    verificationReferences: verification
      ? [
          {
            id: 'verification-1',
            status: 'verified',
            integrityStatus: 'clear',
            disputeState: 'none',
            verificationKind: 'skill_attestation_manager',
            subjectType: 'skill',
            subjectId: skillIds[0] ?? 'skill-1',
          },
        ]
      : [],
    latestEvidenceAt,
    publicSafe: { id: 'public-safe-pack', items: [] },
  } as any;
}

function createOrphanAggregate(skillIds: string[]) {
  return {
    pack: {
      id: 'pack-orphan',
      packKind: 'verification_bundle',
      primarySubjectType: 'skill',
      primarySubjectId: skillIds[0] ?? 'skill-floating',
    },
    items: skillIds.map((skillId, index) => ({
      position: index,
      effectiveVisibility: 'public',
      artifact: {
        id: `artifact-orphan-${index}`,
        subjectType: 'skill',
        subjectId: skillId,
        revealGate: 'none',
      },
    })),
    verificationReferences: [],
    latestEvidenceAt: new Date().toISOString(),
    publicSafe: { id: 'public-safe-orphan', items: [] },
  } as any;
}

describe('getIndividualReadinessState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profilesFindFirstMock.mockResolvedValue({
      id: 'user-1',
      displayName: 'Jane Doe',
      handle: 'jane-doe',
      publicPortfolioState: 'published',
    });
    individualProfilesFindFirstMock.mockResolvedValue({
      userId: 'user-1',
      headline: 'Builder',
      bio: null,
      location: 'Stockholm, Sweden',
      mission: null,
      values: [],
      causes: [],
    });
    matchingProfilesFindFirstMock.mockResolvedValue({
      profileId: 'user-1',
      timezone: 'Europe/Stockholm',
      desiredRoles: ['Product onboarding'],
      workMode: 'remote',
      engagementType: 'contract',
      country: 'SE',
      city: 'Stockholm',
      availabilityEarliest: '2026-04-01',
      availabilityLatest: '2026-06-01',
      compMin: 1000,
      compMax: 2000,
      currency: 'EUR',
    });
    publicationFindFirstMock.mockResolvedValue({ effectiveState: 'published' });
    experiencesFindManyMock.mockResolvedValue([{ id: 'ctx-1' }]);
    educationFindManyMock.mockResolvedValue([]);
    volunteeringFindManyMock.mockResolvedValue([]);
  });

  it('keeps portfolio-ready easier than intro-eligible', async () => {
    skillsFindManyMock.mockResolvedValue([]);
    listCanonicalProofPackAggregatesForOwnerMock.mockResolvedValue([
      createAnchoredAggregate({ skillIds: ['skill-1'], verification: false }),
    ]);

    const state = await getIndividualReadinessState('user-1');

    expect(state.flags.portfolioReady).toBe(true);
    expect(state.flags.introEligible).toBe(false);
    expect(state.highestState).toBe('browse_ready');
    expect(state.introEligibility.reasonCodes).toContain(
      'match_visibility_requirements_incomplete'
    );
    expect(state.missingByState.qualified_intro_ready).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'proof_coverage',
          label: 'Three proof-backed role signals',
        }),
        expect.objectContaining({
          id: 'fresh_proof_24',
          label: 'Fresh supporting proof',
        }),
        expect.objectContaining({
          id: 'fresh_proof_12',
          label: 'One current proof signal',
        }),
      ])
    );
  });

  it('unlocks intro eligibility only with strong anchored proof and a non-self trust anchor', async () => {
    skillsFindManyMock.mockResolvedValue(
      ['skill-1', 'skill-2', 'skill-3'].map((id) => ({
        id,
        relevance: 'current',
        lastUsedAt: new Date().toISOString(),
      }))
    );
    listCanonicalProofPackAggregatesForOwnerMock.mockResolvedValue([
      createAnchoredAggregate({ skillIds: ['skill-1', 'skill-2', 'skill-3'] }),
    ]);

    const state = await getIndividualReadinessState('user-1');

    expect(state.flags.portfolioReady).toBe(true);
    expect(state.flags.matchVisible).toBe(true);
    expect(state.flags.introEligible).toBe(true);
    expect(state.states).toContain('qualified_intro_ready');
    expect(state.counts.activeTrustAnchorCount).toBe(1);
  });

  it('does not let floating skills raise readiness or trust', async () => {
    skillsFindManyMock.mockResolvedValue(
      ['skill-1', 'skill-2', 'skill-3'].map((id) => ({
        id,
        relevance: 'current',
        lastUsedAt: new Date().toISOString(),
      }))
    );
    listCanonicalProofPackAggregatesForOwnerMock.mockResolvedValue([
      createOrphanAggregate(['skill-1', 'skill-2', 'skill-3']),
    ]);

    const state = await getIndividualReadinessState('user-1');

    expect(state.flags.portfolioReady).toBe(false);
    expect(state.flags.matchVisible).toBe(false);
    expect(state.flags.introEligible).toBe(false);
    expect(state.counts.proofBackedSkillCount).toBe(0);
    expect(state.counts.activeTrustAnchorCount).toBe(0);
  });

  it('treats legacy orphan packs as readable but blocks intro eligibility when they are relevant', async () => {
    skillsFindManyMock.mockResolvedValue(
      ['skill-1', 'skill-2', 'skill-3'].map((id) => ({
        id,
        relevance: 'current',
        lastUsedAt: new Date().toISOString(),
      }))
    );
    listCanonicalProofPackAggregatesForOwnerMock.mockResolvedValue([
      createAnchoredAggregate({ skillIds: ['skill-1', 'skill-2', 'skill-3'] }),
      createOrphanAggregate(['skill-1']),
    ]);

    const state = await getIndividualReadinessState('user-1');

    expect(state.flags.portfolioReady).toBe(true);
    expect(state.flags.matchVisible).toBe(true);
    expect(state.flags.introEligible).toBe(false);
    expect(state.introEligibility.reasonCodes).toContain('orphan_relevant_proof_blocking_intro');
    expect(state.counts.proofCount).toBe(1);
  });
});
