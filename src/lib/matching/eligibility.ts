import type { ReadinessRequirement } from '@/lib/momentum/types';
import {
  getIndividualReadinessState,
  type LegacyReadinessTier,
} from '@/lib/readiness/individual-state';

export type EligibilityCriterionId =
  | 'skillsWithRecency'
  | 'matchingProfile'
  | 'intentSignal'
  | 'logisticsSignal';

export interface EligibilityCriterion {
  id: EligibilityCriterionId;
  label: string;
  status: 'met' | 'unmet';
  met: boolean;
  current: number | boolean;
  required: number | string;
  detail: string;
}

export interface EligibilityAction {
  id: string;
  title: string;
  description: string;
  actionUrl: '/app/i/expertise' | '/app/i/matching/preferences' | '/app/i/profile';
}

export interface EligibilityResult {
  profileId: string;
  status: 'eligible' | 'not_matchable';
  eligible: boolean;
  tier: LegacyReadinessTier;
  message: string;
  counts: {
    skillsWithRecency: number;
    proofCount: number;
    hasPurpose: boolean;
    hasConstraints: boolean;
    hasIntentSignal: boolean;
    hasLogisticsSignal: boolean;
    hasTrustedSignal: boolean;
  };
  nextTierTarget: null | {
    tier: 'lite' | 'strong';
    message: string;
    remaining: {
      skillsWithRecency: number;
      proofCount: number;
      purpose: number;
      constraints: number;
      trustedSignal: number;
    };
  };
  criteria: Record<EligibilityCriterionId, EligibilityCriterion>;
  unmetCriteria: EligibilityCriterionId[];
  topActions: EligibilityAction[];
  readiness: Awaited<ReturnType<typeof getIndividualReadinessState>>;
}

export interface MatchingSoftGatePayload {
  items: unknown[];
  meta: {
    softGated: true;
    softGateReason: 'browse_requirements_incomplete';
    message: string;
  };
  eligibility: EligibilityResult;
  readiness: EligibilityResult['readiness'];
  topActions: EligibilityAction[];
}

function toEligibilityAction(requirement: ReadinessRequirement): EligibilityAction {
  if (requirement.actionUrl === '/app/i/profile') {
    return {
      id: requirement.id,
      title: 'Add purpose signals',
      description: requirement.detail,
      actionUrl: '/app/i/profile',
    };
  }

  if (requirement.actionUrl === '/app/i/expertise') {
    return {
      id: requirement.id,
      title: 'Add recent skills and proof',
      description: requirement.detail,
      actionUrl: '/app/i/expertise',
    };
  }

  return {
    id: requirement.id,
    title: 'Set browse preferences',
    description: requirement.detail,
    actionUrl: '/app/i/matching/preferences',
  };
}

export function toSoftGatedPayload(result: EligibilityResult): MatchingSoftGatePayload {
  return {
    items: [],
    meta: {
      softGated: true,
      softGateReason: 'browse_requirements_incomplete',
      message: result.message,
    },
    eligibility: result,
    readiness: result.readiness,
    topActions: result.topActions,
  };
}

export async function evaluateIndividualMatchability(
  profileId: string
): Promise<EligibilityResult> {
  const readiness = await getIndividualReadinessState(profileId);
  const { counts, flags } = readiness;

  const criteria: Record<EligibilityCriterionId, EligibilityCriterion> = {
    skillsWithRecency: {
      id: 'skillsWithRecency',
      label: 'Recent skills',
      met: counts.skillsWithRecency >= 3,
      status: counts.skillsWithRecency >= 3 ? 'met' : 'unmet',
      current: counts.skillsWithRecency,
      required: 3,
      detail: 'Add at least 3 skills with last-used dates so browse results stay relevant.',
    },
    matchingProfile: {
      id: 'matchingProfile',
      label: 'Browse profile',
      met: flags.hasMatchingProfile,
      status: flags.hasMatchingProfile ? 'met' : 'unmet',
      current: flags.hasMatchingProfile,
      required: 'matching profile',
      detail: 'Create your matching profile so preferences have somewhere to live.',
    },
    intentSignal: {
      id: 'intentSignal',
      label: 'Intent signal',
      met: flags.hasIntentSignal,
      status: flags.hasIntentSignal ? 'met' : 'unmet',
      current: flags.hasIntentSignal,
      required: 'mission OR values OR causes OR desired roles',
      detail: 'Add mission, values, causes, or desired roles to make browse results explainable.',
    },
    logisticsSignal: {
      id: 'logisticsSignal',
      label: 'One practical preference',
      met: flags.hasLogisticsSignal,
      status: flags.hasLogisticsSignal ? 'met' : 'unmet',
      current: flags.hasLogisticsSignal,
      required: 'work mode OR country OR city',
      detail: 'Add work mode or a location preference before personalized browse unlocks.',
    },
  };

  const unmetCriteria = Object.values(criteria)
    .filter((criterion) => !criterion.met)
    .map((criterion) => criterion.id) as EligibilityCriterionId[];

  const topActions = readiness.missingByState.browse_ready
    .map(toEligibilityAction)
    .filter(
      (action, index, collection) =>
        collection.findIndex((candidate) => candidate.actionUrl === action.actionUrl) === index
    )
    .slice(0, 3);

  const nextTierTarget =
    readiness.legacyTier === 'none'
      ? {
          tier: 'lite' as const,
          message:
            'Browsing is available today. Add a few recent skills and one preference to personalize results.',
          remaining: {
            skillsWithRecency: Math.max(0, 3 - counts.skillsWithRecency),
            proofCount: 0,
            purpose: flags.hasIntentSignal ? 0 : 1,
            constraints: flags.hasLogisticsSignal ? 0 : 1,
            trustedSignal: 0,
          },
        }
      : readiness.legacyTier === 'lite'
        ? {
            tier: 'strong' as const,
            message:
              'Qualified introductions need stronger proof coverage, trust signals, and complete constraints.',
            remaining: {
              skillsWithRecency: Math.max(0, 5 - counts.skillsWithRecency),
              proofCount: Math.max(0, 2 - counts.proofCount),
              purpose: flags.hasPurposeBlock ? 0 : 1,
              constraints: flags.hasIntroConstraints ? 0 : 1,
              trustedSignal: flags.hasTrustedSignal ? 0 : 1,
            },
          }
        : null;

  return {
    profileId,
    status: readiness.flags.browseReady ? 'eligible' : 'not_matchable',
    eligible: readiness.flags.browseReady,
    tier: readiness.legacyTier,
    message: readiness.flags.browseReady
      ? readiness.flags.qualifiedIntroReady
        ? 'Browse is active and qualified introductions are unlocked.'
        : 'Browse is active. Add stronger proof and complete constraints for qualified introductions.'
      : 'Browsing is open, but add a few recent skills and one preference to personalize results.',
    counts: {
      skillsWithRecency: counts.skillsWithRecency,
      proofCount: counts.proofCount,
      hasPurpose: flags.hasPurposeBlock,
      hasConstraints: flags.hasIntroConstraints,
      hasIntentSignal: flags.hasIntentSignal,
      hasLogisticsSignal: flags.hasLogisticsSignal,
      hasTrustedSignal: flags.hasTrustedSignal,
    },
    nextTierTarget,
    criteria,
    unmetCriteria,
    topActions,
    readiness,
  };
}
