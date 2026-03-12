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
    trustLevel: 'match_visible',
    publicPortfolioUrl: 'https://proofound.io/portfolio/jane-doe',
    flags: {
      portfolioReady: true,
      browseReady: true,
      qualifiedIntroReady: false,
      discoverable: true,
      matchVisible: true,
      introEligible: false,
      stronglyTrusted: false,
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
      qualifyingProofLinkedL4Count: 1,
      roleRelevantProofLinkedL4Count: 1,
      attestedProofLinkedSkillCount: 0,
      freshProofLinkedL4Count24: 0,
      freshProofLinkedL4Count12: 0,
      acceptedVerificationCount: 0,
      verifiedTrustSignalCount: 0,
      activeTrustAnchorCount: 0,
      providerTrustAnchorCount: 0,
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
    introEligibility: {
      status: 'blocked_profile',
      profileEligible: false,
      assignmentEligible: null,
      reasonCodes: ['trusted_or_attested_proof_missing'],
      missingRequirements: [
        {
          id: 'trusted_signal',
          label: 'Trusted or attested proof-backed signal',
          detail: 'Add a verified or attested proof-backed skill.',
          met: false,
          actionUrl: '/app/i/verifications',
        },
      ],
      nextActions: [
        {
          id: 'complete-intro-constraints',
          title: 'Complete intro requirements',
          description: 'Add role, availability, location, and compensation constraints.',
          priority: 'high',
          category: 'matching',
          actionUrl: '/app/i/matching/preferences',
        },
      ],
      qualifyingProofLinkedL4Count: 1,
      roleRelevantProofLinkedL4Count: 1,
      assignmentRelevantProofLinkedL4Count: 0,
      activeTrustAnchorCount: 0,
    },
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
    expect(result.trustLevel).toBe('match_visible');
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
        trustLevel: 'strongly_trusted',
        flags: {
          portfolioReady: true,
          browseReady: true,
          qualifiedIntroReady: true,
          discoverable: true,
          matchVisible: true,
          introEligible: true,
          stronglyTrusted: true,
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
          proofBackedSkillCount: 5,
          qualifyingProofLinkedL4Count: 4,
          roleRelevantProofLinkedL4Count: 4,
          attestedProofLinkedSkillCount: 2,
          freshProofLinkedL4Count24: 4,
          freshProofLinkedL4Count12: 2,
          acceptedVerificationCount: 1,
          verifiedTrustSignalCount: 3,
          activeTrustAnchorCount: 3,
          providerTrustAnchorCount: 1,
        },
        missingByState: {
          portfolio_ready: [],
          browse_ready: [],
          qualified_intro_ready: [],
        },
        nextBestActions: [],
        introEligibility: {
          status: 'eligible',
          profileEligible: true,
          assignmentEligible: null,
          reasonCodes: [],
          missingRequirements: [],
          nextActions: [],
          qualifyingProofLinkedL4Count: 4,
          roleRelevantProofLinkedL4Count: 4,
          assignmentRelevantProofLinkedL4Count: 0,
          activeTrustAnchorCount: 3,
        },
      })
    );

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(true);
    expect(result.tier).toBe('strong');
    expect(result.nextTierTarget).toBeNull();
    expect(result.message).toContain('higher-trust label');
  });

  it('soft-gates browse when recent skills or preferences are missing', async () => {
    getIndividualReadinessStateMock.mockResolvedValue(
      createReadinessSnapshot({
        states: [],
        highestState: null,
        legacyTier: 'none',
        trustLevel: 'none',
        flags: {
          portfolioReady: false,
          browseReady: false,
          qualifiedIntroReady: false,
          discoverable: false,
          matchVisible: false,
          introEligible: false,
          stronglyTrusted: false,
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
          qualifyingProofLinkedL4Count: 0,
          roleRelevantProofLinkedL4Count: 0,
          attestedProofLinkedSkillCount: 0,
          freshProofLinkedL4Count24: 0,
          freshProofLinkedL4Count12: 0,
          acceptedVerificationCount: 0,
          verifiedTrustSignalCount: 0,
          activeTrustAnchorCount: 0,
          providerTrustAnchorCount: 0,
        },
        missingByState: {
          portfolio_ready: [
            {
              id: 'public_proof_signal',
              label: 'One public proof-backed signal',
              detail: 'Add one proof link.',
              met: false,
              actionUrl: '/app/i/portfolio',
            },
          ],
          browse_ready: [
            {
              id: 'skills_with_recency',
              label: 'Three recent skills',
              detail: 'Add recent skills.',
              met: false,
              actionUrl: '/app/i/portfolio',
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
        introEligibility: {
          status: 'blocked_profile',
          profileEligible: false,
          assignmentEligible: null,
          reasonCodes: ['discoverable_requirements_incomplete'],
          missingRequirements: [],
          nextActions: [],
          qualifyingProofLinkedL4Count: 0,
          roleRelevantProofLinkedL4Count: 0,
          assignmentRelevantProofLinkedL4Count: 0,
          activeTrustAnchorCount: 0,
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
      expect.arrayContaining(['/app/i/portfolio', '/app/i/matching/preferences', '/app/i/profile'])
    );
  });
});
