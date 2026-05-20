import type { ReadinessAction, ReadinessState } from '@/lib/momentum/types';
import type {
  IndividualReadinessStateSnapshot,
  TrustLevelOrNone,
} from '@/lib/readiness/individual-state';

export type ProofReadinessChecklistPresentation = {
  missing: string[];
  actions: Array<
    ReadinessAction & {
      completed: boolean;
    }
  >;
  skillCount?: number;
  proofCount?: number;
  states: ReadinessState[];
  highestState: ReadinessState | null;
};

export type ExpertiseStatsPresentation = {
  totalL4Skills: number;
  skillsWithRecency: number;
  skillsWithProofs: number;
  skillsWithVerifications: number;
  progressPercentage: number;
  activationThreshold: number;
  activationThresholds: {
    lite: { skillsWithRecency: number; proofCount: number };
    strong: { skillsWithRecency: number; proofCount: number };
  };
  progressByTier: {
    lite: { skillsWithRecencyProgress: number; proofProgress: number };
    strong: { skillsWithRecencyProgress: number; proofProgress: number };
  };
  eligibility: {
    tier: 'none' | 'lite' | 'strong';
    trustLevel: TrustLevelOrNone;
    nextTierTarget: null | {
      tier: 'lite' | 'strong';
      message: string;
      remaining: {
        skillsWithRecency: number;
        proofCount: number;
        intentSignal: number;
        constraints: number;
        trustedSignal?: number;
      };
    };
  };
  featureFlags: {
    activationTiering: boolean;
  };
  readiness: Pick<
    IndividualReadinessStateSnapshot,
    'states' | 'highestState' | 'flags' | 'missingByState' | 'nextBestActions'
  >;
};

export function toProofReadinessChecklistPresentation(
  readiness: IndividualReadinessStateSnapshot
): ProofReadinessChecklistPresentation {
  return {
    missing: [
      ...readiness.missingByState.portfolio_ready.map((item) => item.id),
      ...readiness.missingByState.browse_ready.map((item) => item.id),
      ...readiness.missingByState.qualified_intro_ready.map((item) => item.id),
    ],
    actions: readiness.nextBestActions.map((action) => ({
      ...action,
      completed: false,
    })),
    skillCount: readiness.counts.skillsCount,
    proofCount: readiness.counts.proofCount,
    states: readiness.states,
    highestState: readiness.highestState,
  };
}

export function toExpertiseStatsPresentation(
  readiness: IndividualReadinessStateSnapshot,
  skillsWithProofs: number,
  skillsWithVerifications: number
): ExpertiseStatsPresentation {
  const liteProgressSkills = Math.min(
    Math.round((readiness.counts.skillsWithRecency / 3) * 100),
    100
  );
  const strongProgressSkills = Math.min(
    Math.round((readiness.counts.skillsWithRecency / 5) * 100),
    100
  );
  const proofProgress = Math.min(Math.round((readiness.counts.proofCount / 2) * 100), 100);

  return {
    totalL4Skills: readiness.counts.skillsCount,
    skillsWithRecency: readiness.counts.skillsWithRecency,
    skillsWithProofs,
    skillsWithVerifications,
    progressPercentage:
      readiness.highestState === 'qualified_intro_ready' ? 100 : strongProgressSkills,
    activationThreshold: 5,
    activationThresholds: {
      lite: { skillsWithRecency: 3, proofCount: 0 },
      strong: { skillsWithRecency: 5, proofCount: 2 },
    },
    progressByTier: {
      lite: { skillsWithRecencyProgress: liteProgressSkills, proofProgress },
      strong: { skillsWithRecencyProgress: strongProgressSkills, proofProgress },
    },
    eligibility: {
      tier: readiness.legacyTier,
      trustLevel: readiness.trustLevel,
      nextTierTarget:
        readiness.legacyTier === 'none'
          ? {
              tier: 'lite',
              message:
                'Browsing is available once you connect a few recent skills to anchored proof and add one practical preference so your profile becomes match-visible.',
              remaining: {
                skillsWithRecency: Math.max(0, 3 - readiness.counts.skillsWithRecency),
                proofCount: 0,
                intentSignal: readiness.flags.hasIntentSignal ? 0 : 1,
                constraints: readiness.flags.hasLogisticsSignal ? 0 : 1,
              },
            }
          : readiness.legacyTier === 'lite'
            ? {
                tier: 'strong',
                message:
                  'Your portfolio remains useful now. Introductions stay protected until stronger anchored proof coverage, one non-self verification, and full intro preferences are in place.',
                remaining: {
                  skillsWithRecency: Math.max(0, 5 - readiness.counts.skillsWithRecency),
                  proofCount: Math.max(0, 4 - readiness.counts.qualifyingProofLinkedL4Count),
                  intentSignal: readiness.flags.hasIntentSignal ? 0 : 1,
                  constraints: readiness.flags.hasIntroConstraints ? 0 : 1,
                  trustedSignal: readiness.flags.hasTrustedSignal ? 0 : 1,
                },
              }
            : null,
    },
    featureFlags: {
      activationTiering: true,
    },
    readiness: {
      states: readiness.states,
      highestState: readiness.highestState,
      flags: readiness.flags,
      missingByState: readiness.missingByState,
      nextBestActions: readiness.nextBestActions,
    },
  };
}
