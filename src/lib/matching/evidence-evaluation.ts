import { evaluateIntroGate, type EvaluateIntroGateInput } from '@/lib/matching/intro-gates';
import { describeReasonCodes, sortReasonCodeStrings } from '@/lib/matching/reason-codes';
import type {
  BroadMatchReasonCode,
  DiscoveredCandidate,
  DiscoveryStatus,
  FitBand,
  IntroGateResult,
  MatchEvidenceEvaluation,
  MatchReasonDetail,
  PublicSafeEvidenceRef,
} from '@/lib/matching/types';

type EvaluateMatchEvidenceInput = {
  discoveredCandidate: DiscoveredCandidate;
  introGate?: IntroGateResult | null;
  introGateInput?: EvaluateIntroGateInput | null;
};

function evidenceRefsByCode(candidate: DiscoveredCandidate) {
  const refs: Partial<Record<string, PublicSafeEvidenceRef[]>> = {};
  for (const signal of candidate.discoverySignals) {
    refs[signal] = candidate.evidenceRefs;
  }
  refs.fresh_proof_present = candidate.candidateSignals.proofSignals
    .filter((proof) => proof.freshnessState === 'fresh')
    .map((proof) => ({ type: 'proof_pack' as const, id: proof.id, label: proof.title }));
  refs.non_self_trust_anchor_present = candidate.candidateSignals.proofSignals
    .filter((proof) => proof.hasActiveNonSelfTrustAnchor)
    .map((proof) => ({ type: 'verification' as const, id: proof.id, label: proof.title }));
  refs.constraint_match = [{ type: 'constraint', field: 'hard_constraints' }];
  refs.constraint_mismatch = [{ type: 'constraint', field: 'hard_constraints' }];
  refs.privacy_safe_for_stage = [{ type: 'privacy', field: 'review_stage' }];
  refs.privacy_or_policy_hold = [{ type: 'privacy', field: 'review_stage' }];
  return refs;
}

function deriveReasonCodesFromDiscovery(candidate: DiscoveredCandidate): string[] {
  const codes = new Set<string>(candidate.discoverySignals);
  const trust = candidate.candidateSignals.trustSignals;
  const privacy = candidate.candidateSignals.privacy;
  const constraints = candidate.candidateSignals.constraints;

  if (trust.hasFreshRoleRelevantProof) {
    codes.add('fresh_proof_present');
  } else {
    codes.add('fresh_proof_missing');
  }

  if (trust.activeNonSelfTrustAnchorCount > 0) {
    codes.add('non_self_trust_anchor_present');
  } else {
    codes.add('verification_gate_missing');
  }

  if (constraints?.hardConstraintsSatisfied === false) {
    codes.add('constraint_mismatch');
  } else {
    codes.add('constraint_match');
  }

  if (
    privacy?.policyHold ||
    privacy?.moderationHold ||
    privacy?.redactionHold ||
    privacy?.privacySafeForStage === false
  ) {
    codes.add('privacy_or_policy_hold');
  } else {
    codes.add('privacy_safe_for_stage');
  }

  return sortReasonCodeStrings([...codes]);
}

export function buildReasonCodes(
  evaluationOrCandidate: MatchEvidenceEvaluation | DiscoveredCandidate
): MatchReasonDetail[] {
  if ('reasonDetails' in evaluationOrCandidate) {
    return evaluationOrCandidate.reasonDetails;
  }

  const refs = evidenceRefsByCode(evaluationOrCandidate);
  return describeReasonCodes(deriveReasonCodesFromDiscovery(evaluationOrCandidate), refs);
}

export function deriveFitBand(input: {
  reasonCodes: string[];
  introGate?: IntroGateResult | null;
  hasOnlyWeakDiscoverySignals?: boolean;
}): FitBand {
  if (
    input.reasonCodes.includes('privacy_or_policy_hold') ||
    input.reasonCodes.includes('constraint_mismatch') ||
    input.introGate?.introGate === 'intro_hold_privacy_or_policy_review' ||
    input.introGate?.introGate === 'intro_hold_constraint_mismatch'
  ) {
    return 'constraint_or_trust_hold';
  }

  if (
    input.reasonCodes.includes('fresh_proof_missing') ||
    input.reasonCodes.includes('verification_gate_missing')
  ) {
    return 'needs_more_proof';
  }

  if (input.hasOnlyWeakDiscoverySignals) {
    return 'adjacent_exploratory';
  }

  if (
    input.reasonCodes.includes('canonical_skill_overlap') &&
    input.reasonCodes.includes('role_relevant_outcome') &&
    input.reasonCodes.includes('fresh_proof_present') &&
    input.reasonCodes.includes('non_self_trust_anchor_present')
  ) {
    return 'strong_evidence_overlap';
  }

  if (
    input.reasonCodes.includes('canonical_skill_overlap') ||
    input.reasonCodes.includes('alias_skill_overlap') ||
    input.reasonCodes.includes('role_relevant_outcome') ||
    input.reasonCodes.includes('proof_text_overlap')
  ) {
    return 'relevant_partial';
  }

  return 'adjacent_exploratory';
}

function deriveDiscoveryStatus(input: {
  introGate: IntroGateResult;
  candidate: DiscoveredCandidate;
}): DiscoveryStatus {
  if (input.introGate.canRequestIntro) {
    return 'intro_ready_match';
  }

  if (input.candidate.candidateSignals.readiness?.matchVisible === true) {
    return 'review_ready_match';
  }

  return 'possible_discovery_match';
}

export function evaluateMatchEvidence(input: EvaluateMatchEvidenceInput): MatchEvidenceEvaluation {
  const candidate = input.discoveredCandidate;
  const fallbackIntroInput: EvaluateIntroGateInput = {
    discoveryStatus: null,
    candidate: {
      matchVisible: candidate.candidateSignals.readiness?.matchVisible ?? false,
      hasFreshRoleRelevantProof: candidate.candidateSignals.trustSignals.hasFreshRoleRelevantProof,
      activeNonSelfTrustAnchorCount:
        candidate.candidateSignals.trustSignals.activeNonSelfTrustAnchorCount,
      orphanRelevantProofCount: candidate.candidateSignals.trustSignals.orphanRelevantProofCount,
    },
    assignment: {
      hardConstraintsSatisfied:
        candidate.candidateSignals.constraints?.hardConstraintsSatisfied ?? null,
    },
    privacy: {
      privacySafeReviewAvailable: candidate.candidateSignals.privacy?.privacySafeForStage ?? true,
      policyBlock: candidate.candidateSignals.privacy?.policyHold ?? false,
      moderationHold: candidate.candidateSignals.privacy?.moderationHold ?? false,
      privacyOrRedactionHold: candidate.candidateSignals.privacy?.redactionHold ?? false,
    },
    workflow: {
      matchVisibleForWorkflow: true,
      existingWorkflowAllowsIntroRequest: true,
    },
  };
  const introGate =
    input.introGate ?? evaluateIntroGate(input.introGateInput ?? fallbackIntroInput);
  const reasonCodes = deriveReasonCodesFromDiscovery(candidate);
  const onlyWeakDiscoverySignals = candidate.discoverySignals.every((signal) =>
    (
      [
        'adjacent_skill_overlap',
        'custom_wording_overlap',
        'low_supply_expanded_discovery',
      ] as BroadMatchReasonCode[]
    ).includes(signal as BroadMatchReasonCode)
  );
  const fitBand = deriveFitBand({
    reasonCodes,
    introGate,
    hasOnlyWeakDiscoverySignals: onlyWeakDiscoverySignals,
  });
  const discoveryStatus = deriveDiscoveryStatus({ introGate, candidate });
  const reasonDetails = describeReasonCodes(reasonCodes, evidenceRefsByCode(candidate));

  return {
    profileId: candidate.profileId,
    discoverySignals: candidate.discoverySignals,
    fitBand,
    discoveryStatus,
    internalOrder: candidate.internalOrder,
    reasonDetails,
    missingGates: introGate.missingGates,
    lowSupplyExpanded: candidate.lowSupplyExpanded,
    hasStrongEvidenceOverlap: fitBand === 'strong_evidence_overlap',
    hasOnlyWeakDiscoverySignals: onlyWeakDiscoverySignals,
    canRequestIntro: introGate.canRequestIntro,
  };
}
