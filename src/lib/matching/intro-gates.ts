import { describeReasonCodes } from '@/lib/matching/reason-codes';
import type { IntroGateResult, MatchReasonDetail } from '@/lib/matching/types';

export type EvaluateIntroGateInput = {
  discoveryStatus?: string | null;
  candidate: {
    matchVisible?: boolean | null;
    hasFreshRoleRelevantProof?: boolean | null;
    activeNonSelfTrustAnchorCount?: number | null;
    hasActiveNonSelfTrustAnchor?: boolean | null;
    staleContradictedOrRevokedVerificationCounted?: boolean | null;
    orphanRelevantProofCount?: number | null;
  };
  assignment?: {
    hardConstraintsSatisfied?: boolean | null;
  };
  privacy?: {
    privacySafeReviewAvailable?: boolean | null;
    policyBlock?: boolean | null;
    moderationHold?: boolean | null;
    privacyOrRedactionHold?: boolean | null;
  };
  workflow?: {
    matchVisibleForWorkflow?: boolean | null;
    existingWorkflowAllowsIntroRequest?: boolean | null;
  };
};

function fail(
  introGate: IntroGateResult['introGate'],
  missingGates: string[],
  reasonCodes: string[]
): IntroGateResult {
  return {
    introGate,
    canRequestIntro: false,
    missingGates,
    reasonDetails: describeReasonCodes(reasonCodes) as MatchReasonDetail[],
  };
}

export function evaluateIntroGate(input: EvaluateIntroGateInput): IntroGateResult {
  const candidate = input.candidate;
  const privacy = input.privacy ?? {};
  const workflow = input.workflow ?? {};
  const assignment = input.assignment ?? {};

  if (
    input.discoveryStatus === 'possible_discovery_match' ||
    candidate.matchVisible !== true ||
    workflow.matchVisibleForWorkflow === false
  ) {
    return fail(
      'intro_hold_not_match_visible',
      ['match_visible_candidate'],
      ['verification_gate_missing']
    );
  }

  if (
    privacy.policyBlock ||
    privacy.moderationHold ||
    privacy.privacyOrRedactionHold ||
    privacy.privacySafeReviewAvailable === false ||
    workflow.existingWorkflowAllowsIntroRequest === false
  ) {
    return fail(
      'intro_hold_privacy_or_policy_review',
      ['privacy_safe_review_rendering'],
      ['privacy_or_policy_hold']
    );
  }

  if (assignment.hardConstraintsSatisfied === false) {
    return fail(
      'intro_hold_constraint_mismatch',
      ['assignment_hard_constraints'],
      ['constraint_mismatch']
    );
  }

  if (candidate.hasFreshRoleRelevantProof !== true) {
    return fail(
      'intro_hold_missing_fresh_relevant_proof',
      ['fresh_role_relevant_proof'],
      ['fresh_proof_missing']
    );
  }

  const hasTrustAnchor =
    candidate.hasActiveNonSelfTrustAnchor === true ||
    Number(candidate.activeNonSelfTrustAnchorCount ?? 0) > 0;

  if (
    !hasTrustAnchor ||
    candidate.staleContradictedOrRevokedVerificationCounted === true ||
    Number(candidate.orphanRelevantProofCount ?? 0) > 0
  ) {
    return fail(
      'intro_hold_missing_trust_anchor',
      ['active_non_self_trust_anchor'],
      ['verification_gate_missing']
    );
  }

  return {
    introGate: 'intro_ready',
    canRequestIntro: true,
    missingGates: [],
    reasonDetails: describeReasonCodes([
      'fresh_proof_present',
      'non_self_trust_anchor_present',
      'privacy_safe_for_stage',
      'constraint_match',
    ]),
  };
}
