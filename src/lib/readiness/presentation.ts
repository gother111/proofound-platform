import type { ReadinessAction, ReadinessState } from '@/lib/momentum/types';
import type { IndividualReadinessStateSnapshot } from '@/lib/readiness/individual-state';

export type ProfileCompletenessPresentation = {
  percentage: number;
  missing: string[];
  actions: Array<
    ReadinessAction & {
      completed: boolean;
    }
  >;
  skillCount?: number;
  proofCount?: number;
  valuesCount?: number;
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
    nextTierTarget: null | {
      tier: 'lite' | 'strong';
      message: string;
      remaining: {
        skillsWithRecency: number;
        proofCount: number;
        purpose: number;
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

export function toProfileCompletenessPresentation(
  readiness: IndividualReadinessStateSnapshot
): ProfileCompletenessPresentation {
  const totalRequirements =
    readiness.missingByState.portfolio_ready.length +
    readiness.missingByState.browse_ready.length +
    readiness.missingByState.qualified_intro_ready.length +
    readiness.states.length * 2;
  const unmetCount =
    readiness.missingByState.portfolio_ready.length +
    readiness.missingByState.browse_ready.length +
    readiness.missingByState.qualified_intro_ready.length;
  const percentage =
    totalRequirements === 0
      ? 100
      : Math.max(8, Math.round(((totalRequirements - unmetCount) / totalRequirements) * 100));

  return {
    percentage,
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
    valuesCount: 0,
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
      nextTierTarget:
        readiness.legacyTier === 'none'
          ? {
              tier: 'lite',
              message:
                'Browsing is available once you add a few recent skills and one practical preference.',
              remaining: {
                skillsWithRecency: Math.max(0, 3 - readiness.counts.skillsWithRecency),
                proofCount: 0,
                purpose: readiness.flags.hasIntentSignal ? 0 : 1,
                constraints: readiness.flags.hasLogisticsSignal ? 0 : 1,
              },
            }
          : readiness.legacyTier === 'lite'
            ? {
                tier: 'strong',
                message:
                  'Qualified introductions require stronger proof coverage, trust signals, and full constraints.',
                remaining: {
                  skillsWithRecency: Math.max(0, 5 - readiness.counts.skillsWithRecency),
                  proofCount: Math.max(0, 2 - readiness.counts.proofCount),
                  purpose: readiness.flags.hasPurposeBlock ? 0 : 1,
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
