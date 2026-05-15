import type { ReadinessRequirement } from '@/lib/momentum/types';
import {
  getIndividualReadinessState,
  getIndividualPortfolioReadinessMap,
  type LegacyReadinessTier,
  type IntroEligibilitySummary,
  type TrustLevelOrNone,
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
  actionUrl:
    | '/app/i/profile?profileView=full&tab=proof_packs'
    | '/app/i/matching/preferences'
    | '/app/i/profile';
}

export interface EligibilityResult {
  profileId: string;
  status: 'eligible' | 'not_matchable';
  eligible: boolean;
  tier: LegacyReadinessTier;
  trustLevel: TrustLevelOrNone;
  introEligibility: IntroEligibilitySummary;
  message: string;
  counts: {
    skillsWithRecency: number;
    proofCount: number;
    hasConstraints: boolean;
    hasIntentSignal: boolean;
    hasLogisticsSignal: boolean;
    hasTrustedSignal: boolean;
    qualifyingProofLinkedL4Count: number;
    roleRelevantProofLinkedL4Count: number;
    activeTrustAnchorCount: number;
  };
  nextTierTarget: null | {
    tier: 'lite' | 'strong';
    message: string;
    remaining: {
      skillsWithRecency: number;
      proofCount: number;
      intentSignal: number;
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
  trustLevel: TrustLevelOrNone;
  introEligibility: IntroEligibilitySummary;
  readiness: EligibilityResult['readiness'];
  topActions: EligibilityAction[];
}

function toEligibilityAction(requirement: ReadinessRequirement): EligibilityAction {
  if (requirement.actionUrl === '/app/i/profile') {
    return {
      id: requirement.id,
      title: 'Add role context',
      description: requirement.detail,
      actionUrl: '/app/i/profile',
    };
  }

  if (requirement.actionUrl.includes('tab=proof_packs')) {
    return {
      id: requirement.id,
      title: 'Strengthen Public Page proof',
      description: requirement.detail,
      actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
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
    trustLevel: result.trustLevel,
    introEligibility: result.introEligibility,
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
      label: 'Target role signal',
      met: flags.hasIntentSignal,
      status: flags.hasIntentSignal ? 'met' : 'unmet',
      current: flags.hasIntentSignal,
      required: 'desired roles',
      detail: 'Add desired roles so browse results stay grounded in the work you want.',
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
            'Keep browsing. Add a few recent skills and one practical preference to become match-visible.',
          remaining: {
            skillsWithRecency: Math.max(0, 3 - counts.skillsWithRecency),
            proofCount: 0,
            intentSignal: flags.hasIntentSignal ? 0 : 1,
            constraints: flags.hasLogisticsSignal ? 0 : 1,
            trustedSignal: 0,
          },
        }
      : readiness.legacyTier === 'lite'
        ? {
            tier: 'strong' as const,
            message:
              'Browsing stays open while introductions are protected. Add deeper proof, one trusted proof-backed skill, and complete intro preferences.',
            remaining: {
              skillsWithRecency: Math.max(0, 5 - counts.skillsWithRecency),
              proofCount: Math.max(0, 4 - counts.qualifyingProofLinkedL4Count),
              intentSignal: flags.hasIntentSignal ? 0 : 1,
              constraints: flags.hasIntroConstraints ? 0 : 1,
              trustedSignal: flags.hasTrustedSignal ? 0 : 1,
            },
          }
        : null;

  return {
    profileId,
    status: readiness.flags.discoverable ? 'eligible' : 'not_matchable',
    eligible: readiness.flags.discoverable,
    tier: readiness.legacyTier,
    message: readiness.flags.browseReady
      ? readiness.flags.introEligible
        ? readiness.flags.stronglyTrusted
          ? 'Browse is active. Introductions are unlocked and the profile carries a higher-trust label.'
          : 'Browse is active and introductions are unlocked.'
        : 'Browsing stays open while qualified introductions are protected. Add stronger relevant proof and one trusted proof-backed skill when you are ready.'
      : readiness.flags.discoverable
        ? 'Private browse is active. Add deeper recent proof and availability details to become match-visible.'
        : 'Browsing stays open while you add a target role, one proof-linked skill, and one practical preference.',
    counts: {
      skillsWithRecency: counts.skillsWithRecency,
      proofCount: counts.proofCount,
      hasConstraints: flags.hasIntroConstraints,
      hasIntentSignal: flags.hasIntentSignal,
      hasLogisticsSignal: flags.hasLogisticsSignal,
      hasTrustedSignal: flags.hasTrustedSignal,
      qualifyingProofLinkedL4Count: counts.qualifyingProofLinkedL4Count,
      roleRelevantProofLinkedL4Count: counts.roleRelevantProofLinkedL4Count,
      activeTrustAnchorCount: counts.activeTrustAnchorCount,
    },
    trustLevel: readiness.trustLevel,
    introEligibility: readiness.introEligibility,
    nextTierTarget,
    criteria,
    unmetCriteria,
    topActions,
    readiness,
  };
}

export async function evaluateIndividualMatchabilityForProfiles(
  profileIds: string[]
): Promise<Map<string, boolean>> {
  return getIndividualPortfolioReadinessMap(profileIds);
}
