import { beforeEach, describe, expect, it, vi } from 'vitest';

import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import {
  getIndividualReadinessState,
  type IndividualReadinessStateSnapshot,
} from '@/lib/readiness/individual-state';

vi.mock('@/lib/readiness/individual-state', () => ({
  getIndividualReadinessState: vi.fn(),
}));

const getIndividualReadinessStateMock = vi.mocked(getIndividualReadinessState);

function createReadinessSnapshot(
  overrides: Partial<IndividualReadinessStateSnapshot> = {}
): IndividualReadinessStateSnapshot {
  return {
    states: ['portfolio_ready', 'browse_ready'],
    highestState: 'browse_ready',
    legacyTier: 'lite',
    publicPortfolioUrl: 'https://proofound.io/portfolio/jane-doe',
    flags: {
      portfolioReady: true,
      browseReady: true,
      qualifiedIntroReady: false,
      hasDisplayName: true,
      hasHandle: true,
      hasHeadlineOrBio: true,
      hasPortfolioSkill: true,
      hasPublicProofSignal: true,
      hasMatchingProfile: true,
      hasIntentSignal: true,
      hasLogisticsSignal: true,
      hasPurposeBlock: true,
      hasIntroConstraints: false,
      hasTrustedSignal: false,
    },
    counts: {
      skillsCount: 5,
      skillsWithRecency: 5,
      proofCount: 1,
      publicProofSignalCount: 1,
      proofBackedSkillCount: 1,
      acceptedVerificationCount: 0,
      verifiedTrustSignalCount: 0,
    },
    missingByState: {
      portfolio_ready: [],
      browse_ready: [],
      qualified_intro_ready: [
        {
          id: 'trusted_signal',
          label: 'Verified trust signal',
          detail: 'Add a verified trust signal.',
          met: false,
          actionUrl: '/app/i/verifications',
        },
      ],
    },
    nextBestActions: [
      {
        id: 'complete-intro-constraints',
        title: 'Complete intro requirements',
        description: 'Add role, availability, location, and compensation constraints.',
        priority: 'high',
        category: 'matching',
        actionUrl: '/app/i/matching/preferences',
      },
    ],
    ...overrides,
  };
}

describe('evaluateIndividualMatchability', () => {
  const profileId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns eligible with a lite compatibility tier when browse requirements are met', async () => {
    getIndividualReadinessStateMock.mockResolvedValue(createReadinessSnapshot());

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(true);
    expect(result.tier).toBe('lite');
    expect(result.unmetCriteria).toHaveLength(0);
    expect(result.nextTierTarget?.tier).toBe('strong');
    expect(result.readiness.highestState).toBe('browse_ready');
  });

  it('returns strong compatibility tier only when qualified introductions are ready', async () => {
    getIndividualReadinessStateMock.mockResolvedValue(
      createReadinessSnapshot({
        states: ['portfolio_ready', 'browse_ready', 'qualified_intro_ready'],
        highestState: 'qualified_intro_ready',
        legacyTier: 'strong',
        flags: {
          portfolioReady: true,
          browseReady: true,
          qualifiedIntroReady: true,
          hasDisplayName: true,
          hasHandle: true,
          hasHeadlineOrBio: true,
          hasPortfolioSkill: true,
          hasPublicProofSignal: true,
          hasMatchingProfile: true,
          hasIntentSignal: true,
          hasLogisticsSignal: true,
          hasPurposeBlock: true,
          hasIntroConstraints: true,
          hasTrustedSignal: true,
        },
        counts: {
          skillsCount: 6,
          skillsWithRecency: 6,
          proofCount: 2,
          publicProofSignalCount: 2,
          proofBackedSkillCount: 2,
          acceptedVerificationCount: 1,
          verifiedTrustSignalCount: 1,
        },
        missingByState: {
          portfolio_ready: [],
          browse_ready: [],
          qualified_intro_ready: [],
        },
        nextBestActions: [],
      })
    );

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(true);
    expect(result.tier).toBe('strong');
    expect(result.nextTierTarget).toBeNull();
    expect(result.message).toContain('qualified introductions are unlocked');
  });

  it('soft-gates browse when recent skills or preferences are missing', async () => {
    getIndividualReadinessStateMock.mockResolvedValue(
      createReadinessSnapshot({
        states: [],
        highestState: null,
        legacyTier: 'none',
        flags: {
          portfolioReady: false,
          browseReady: false,
          qualifiedIntroReady: false,
          hasDisplayName: true,
          hasHandle: true,
          hasHeadlineOrBio: true,
          hasPortfolioSkill: false,
          hasPublicProofSignal: false,
          hasMatchingProfile: false,
          hasIntentSignal: false,
          hasLogisticsSignal: false,
          hasPurposeBlock: false,
          hasIntroConstraints: false,
          hasTrustedSignal: false,
        },
        counts: {
          skillsCount: 2,
          skillsWithRecency: 2,
          proofCount: 0,
          publicProofSignalCount: 0,
          proofBackedSkillCount: 0,
          acceptedVerificationCount: 0,
          verifiedTrustSignalCount: 0,
        },
        missingByState: {
          portfolio_ready: [
            {
              id: 'public_proof_signal',
              label: 'One public proof-backed signal',
              detail: 'Add one proof link.',
              met: false,
              actionUrl: '/app/i/expertise',
            },
          ],
          browse_ready: [
            {
              id: 'skills_with_recency',
              label: 'Three recent skills',
              detail: 'Add recent skills.',
              met: false,
              actionUrl: '/app/i/expertise',
            },
            {
              id: 'logistics_signal',
              label: 'One practical preference',
              detail: 'Add work mode or location.',
              met: false,
              actionUrl: '/app/i/matching/preferences',
            },
            {
              id: 'intent_signal',
              label: 'Intent signal',
              detail: 'Add purpose or desired roles.',
              met: false,
              actionUrl: '/app/i/profile',
            },
          ],
          qualified_intro_ready: [],
        },
      })
    );

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(false);
    expect(result.tier).toBe('none');
    expect(result.unmetCriteria).toEqual([
      'skillsWithRecency',
      'matchingProfile',
      'intentSignal',
      'logisticsSignal',
    ]);
    expect(result.topActions.map((action) => action.actionUrl)).toEqual(
      expect.arrayContaining(['/app/i/expertise', '/app/i/matching/preferences', '/app/i/profile'])
    );
  });
});
