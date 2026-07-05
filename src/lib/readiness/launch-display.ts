import type {
  IndividualReadiness,
  ReadinessAction,
  ReadinessRequirement,
} from '@/lib/momentum/types';

export type LaunchReadinessDisplayLabel = 'Portfolio ready' | 'Match visible' | 'Intro eligible';

function dedupeRequirements(requirements: ReadinessRequirement[]) {
  const seen = new Set<string>();
  return requirements.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
}

export function getLaunchReadinessDisplayLabel(flags: {
  matchVisible?: boolean;
  introEligible?: boolean;
}): LaunchReadinessDisplayLabel {
  if (flags.introEligible) return 'Intro eligible';
  if (flags.matchVisible) return 'Match visible';
  return 'Portfolio ready';
}

export function getLaunchReadinessSummary(flags: {
  portfolioReady?: boolean;
  matchVisible?: boolean;
  introEligible?: boolean;
}) {
  if (flags.introEligible) {
    return 'Your portfolio is live, matching is visible, and introductions can proceed when you choose.';
  }

  if (flags.matchVisible) {
    return 'Your proof is visible for matching. Stronger trust and intro settings still gate identity-bearing progress.';
  }

  if (flags.portfolioReady) {
    return 'Your portfolio foundation is in place. Strengthen matching signal next, then work toward introductions.';
  }

  return 'Start with one real context and one anchored proof. Portfolio-ready comes before matching.';
}

export function getLaunchReadinessBlockers(
  input: Pick<IndividualReadiness, 'flags' | 'missingByState'>
) {
  if (!input.flags.portfolioReady) {
    return input.missingByState.portfolio_ready.slice(0, 3);
  }

  if (!input.flags.matchVisible) {
    const matchVisibleIds = new Set([
      'desired_roles',
      'work_mode',
      'engagement_type',
      'proof_coverage',
      'role_relevant_proof',
      'trusted_signal',
      'location',
    ]);

    return dedupeRequirements([
      ...input.missingByState.browse_ready,
      ...input.missingByState.qualified_intro_ready.filter((item) => matchVisibleIds.has(item.id)),
    ]).slice(0, 3);
  }

  if (!input.flags.introEligible) {
    const introEligibleIds = new Set([
      'trusted_signal',
      'fresh_proof_24',
      'fresh_proof_12',
      'availability',
      'compensation',
      'currency',
      'orphan_relevant_packs',
    ]);

    return dedupeRequirements(
      input.missingByState.qualified_intro_ready.filter((item) => introEligibleIds.has(item.id))
    ).slice(0, 3);
  }

  return [];
}

export function getLaunchPrimaryAction(actions: ReadinessAction[]) {
  return actions[0] ?? null;
}
