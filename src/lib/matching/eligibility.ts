import { and, eq, isNotNull, sql } from 'drizzle-orm';

import { db } from '@/db';
import { individualProfiles, matchingProfiles, skillProofs, skills } from '@/db/schema';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import {
  MATCHABILITY_LITE_SKILLS_WITH_RECENCY,
  MATCHABILITY_MIN_PROOFS,
  MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
  resolveMatchabilityTier,
  type MatchabilityTier,
} from './thresholds';

export type EligibilityCriterionId = 'skillsWithRecency' | 'proofs' | 'purpose' | 'constraints';

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
  tier: MatchabilityTier;
  message: string;
  counts: {
    skillsWithRecency: number;
    proofCount: number;
    hasPurpose: boolean;
    hasConstraints: boolean;
  };
  nextTierTarget: null | {
    tier: 'lite' | 'strong';
    message: string;
    remaining: {
      skillsWithRecency: number;
      proofCount: number;
      purpose: number;
      constraints: number;
    };
  };
  criteria: Record<EligibilityCriterionId, EligibilityCriterion>;
  unmetCriteria: EligibilityCriterionId[];
  topActions: EligibilityAction[];
}

export interface NotMatchablePayload {
  error: 'PROFILE_NOT_MATCHABLE';
  message: string;
  eligibility: EligibilityResult;
  topActions: EligibilityAction[];
}

function hasContent(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasArrayContent(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function toNotMatchablePayload(result: EligibilityResult): NotMatchablePayload {
  return {
    error: 'PROFILE_NOT_MATCHABLE',
    message: result.message,
    eligibility: result,
    topActions: result.topActions,
  };
}

export async function evaluateIndividualMatchability(
  profileId: string
): Promise<EligibilityResult> {
  const activationTieringEnabled = await isFeatureEnabled(
    FEATURE_FLAG_KEYS.ACTIVATION_TIERING,
    { userId: profileId },
    true
  );

  const [profileRow, individualRow, skillsWithRecencyResult, proofsResult] = await Promise.all([
    db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, profileId),
    }),
    db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, profileId),
    }),
    db
      .select({
        count: sql<number>`count(${skills.id})::int`,
      })
      .from(skills)
      .where(and(eq(skills.profileId, profileId), isNotNull(skills.lastUsedAt))),
    db
      .select({
        count: sql<number>`count(${skillProofs.id})::int`,
      })
      .from(skillProofs)
      .where(eq(skillProofs.profileId, profileId)),
  ]);

  const skillsWithRecency = skillsWithRecencyResult[0]?.count ?? 0;
  const proofCount = proofsResult[0]?.count ?? 0;

  const hasPurpose =
    hasContent(individualRow?.mission) ||
    hasArrayContent(individualRow?.values) ||
    hasArrayContent(individualRow?.causes);

  const hasConstraints =
    !!profileRow?.workMode &&
    !!profileRow?.availabilityEarliest &&
    !!profileRow?.availabilityLatest &&
    profileRow?.compMin != null &&
    profileRow?.compMax != null &&
    !!profileRow?.currency;

  const tier = activationTieringEnabled
    ? resolveMatchabilityTier({
        skillsWithRecency,
        proofCount,
        hasPurpose,
        hasConstraints,
      })
    : proofCount >= MATCHABILITY_MIN_PROOFS &&
        hasPurpose &&
        hasConstraints &&
        skillsWithRecency >= MATCHABILITY_STRONG_SKILLS_WITH_RECENCY
      ? 'strong'
      : 'none';

  const requiredSkillThreshold = activationTieringEnabled
    ? MATCHABILITY_LITE_SKILLS_WITH_RECENCY
    : MATCHABILITY_STRONG_SKILLS_WITH_RECENCY;

  const criteria: Record<EligibilityCriterionId, EligibilityCriterion> = {
    skillsWithRecency: {
      id: 'skillsWithRecency',
      label: 'Skills with recency',
      met: skillsWithRecency >= requiredSkillThreshold,
      status: skillsWithRecency >= requiredSkillThreshold ? 'met' : 'unmet',
      current: skillsWithRecency,
      required: requiredSkillThreshold,
      detail: activationTieringEnabled
        ? 'Add or refresh at least 3 skills with "last used" dates in Expertise Atlas (10 for Strong tier).'
        : 'Add or refresh at least 10 skills with "last used" dates in Expertise Atlas.',
    },
    proofs: {
      id: 'proofs',
      label: 'Proof artifacts',
      met: proofCount >= MATCHABILITY_MIN_PROOFS,
      status: proofCount >= MATCHABILITY_MIN_PROOFS ? 'met' : 'unmet',
      current: proofCount,
      required: MATCHABILITY_MIN_PROOFS,
      detail: 'Add at least one proof artifact in Expertise Atlas.',
    },
    purpose: {
      id: 'purpose',
      label: 'Purpose block',
      met: hasPurpose,
      status: hasPurpose ? 'met' : 'unmet',
      current: hasPurpose,
      required: 'mission OR values OR causes',
      detail: 'Add mission, values, or causes on your profile.',
    },
    constraints: {
      id: 'constraints',
      label: 'Matching constraints',
      met: hasConstraints,
      status: hasConstraints ? 'met' : 'unmet',
      current: hasConstraints,
      required: 'work mode + availability earliest/latest + compensation min/max + currency',
      detail: 'Set work mode, availability window, and compensation range in matching preferences.',
    },
  };

  const unmetCriteria = (Object.values(criteria)
    .filter((criterion) => !criterion.met)
    .map((criterion) => criterion.id) || []) as EligibilityCriterionId[];

  const topActions: EligibilityAction[] = [];
  if (unmetCriteria.includes('skillsWithRecency') || unmetCriteria.includes('proofs')) {
    topActions.push({
      id: 'update-expertise-atlas',
      title: 'Update Expertise Atlas',
      description: 'Add skills with recency and at least one proof artifact.',
      actionUrl: '/app/i/expertise',
    });
  }
  if (unmetCriteria.includes('constraints')) {
    topActions.push({
      id: 'set-matching-constraints',
      title: 'Set matching constraints',
      description: 'Save work mode, availability window, and compensation range.',
      actionUrl: '/app/i/matching/preferences',
    });
  }
  if (unmetCriteria.includes('purpose')) {
    topActions.push({
      id: 'complete-purpose',
      title: 'Complete purpose section',
      description: 'Add mission, values, or causes to activate purpose alignment.',
      actionUrl: '/app/i/profile',
    });
  }

  const eligible = tier !== 'none';

  const nextTierTarget =
    tier === 'none'
      ? {
          tier: activationTieringEnabled ? ('lite' as const) : ('strong' as const),
          message: activationTieringEnabled
            ? 'Complete Lite activation to unlock first matches.'
            : 'Complete activation requirements to unlock first matches.',
          remaining: {
            skillsWithRecency: Math.max(0, requiredSkillThreshold - skillsWithRecency),
            proofCount: Math.max(0, MATCHABILITY_MIN_PROOFS - proofCount),
            purpose: hasPurpose ? 0 : 1,
            constraints: hasConstraints ? 0 : 1,
          },
        }
      : tier === 'lite'
        ? {
            tier: 'strong' as const,
            message: 'Add more skills to reach Strong activation and improve ranking precision.',
            remaining: {
              skillsWithRecency: Math.max(
                0,
                MATCHABILITY_STRONG_SKILLS_WITH_RECENCY - skillsWithRecency
              ),
              proofCount: 0,
              purpose: 0,
              constraints: 0,
            },
          }
        : null;

  return {
    profileId,
    status: eligible ? 'eligible' : 'not_matchable',
    eligible,
    tier,
    message:
      tier === 'strong'
        ? 'Profile is strongly matchable.'
        : tier === 'lite'
          ? 'Profile is matchable in Lite tier.'
          : 'Your profile is not matchable yet. Complete the required steps and try again.',
    counts: {
      skillsWithRecency,
      proofCount,
      hasPurpose,
      hasConstraints,
    },
    nextTierTarget,
    criteria,
    unmetCriteria,
    topActions: topActions.slice(0, 3),
  };
}
