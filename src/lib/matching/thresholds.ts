export const MATCHABILITY_LITE_SKILLS_WITH_RECENCY = 3;
export const MATCHABILITY_STRONG_SKILLS_WITH_RECENCY = 10;
export const MATCHABILITY_MIN_PROOFS = 1;

export const MATCHABILITY_THRESHOLDS = {
  lite: {
    skillsWithRecency: MATCHABILITY_LITE_SKILLS_WITH_RECENCY,
    proofCount: MATCHABILITY_MIN_PROOFS,
  },
  strong: {
    skillsWithRecency: MATCHABILITY_STRONG_SKILLS_WITH_RECENCY,
    proofCount: MATCHABILITY_MIN_PROOFS,
  },
} as const;

export type MatchabilityTier = 'none' | 'lite' | 'strong';

export function resolveMatchabilityTier(input: {
  skillsWithRecency: number;
  proofCount: number;
  hasIntentSignal: boolean;
  hasConstraints: boolean;
}): MatchabilityTier {
  const baseCriteriaMet =
    input.proofCount >= MATCHABILITY_MIN_PROOFS && input.hasIntentSignal && input.hasConstraints;

  if (!baseCriteriaMet || input.skillsWithRecency < MATCHABILITY_LITE_SKILLS_WITH_RECENCY) {
    return 'none';
  }

  if (input.skillsWithRecency >= MATCHABILITY_STRONG_SKILLS_WITH_RECENCY) {
    return 'strong';
  }

  return 'lite';
}
