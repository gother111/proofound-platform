import { describe, expect, it } from 'vitest';

import { evaluateIntroGate, type EvaluateIntroGateInput } from '@/lib/matching/intro-gates';

const readyInput: EvaluateIntroGateInput = {
  discoveryStatus: 'review_ready_match',
  candidate: {
    matchVisible: true,
    hasFreshRoleRelevantProof: true,
    activeNonSelfTrustAnchorCount: 1,
  },
  assignment: {
    hardConstraintsSatisfied: true,
  },
  privacy: {
    privacySafeReviewAvailable: true,
  },
  workflow: {
    matchVisibleForWorkflow: true,
    existingWorkflowAllowsIntroRequest: true,
  },
};

describe('strict matching intro gates', () => {
  it('returns intro_ready only when every trust and workflow gate passes', () => {
    const result = evaluateIntroGate(readyInput);

    expect(result.introGate).toBe('intro_ready');
    expect(result.canRequestIntro).toBe(true);
    expect(result.missingGates).toEqual([]);
  });

  it('holds when the non-self trust anchor is missing', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      candidate: {
        ...readyInput.candidate,
        activeNonSelfTrustAnchorCount: 0,
      },
    });

    expect(result.introGate).toBe('intro_hold_missing_trust_anchor');
    expect(result.canRequestIntro).toBe(false);
  });

  it('does not count stale, contradicted, or revoked verification as trust lift', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      candidate: {
        ...readyInput.candidate,
        staleContradictedOrRevokedVerificationCounted: true,
      },
    });

    expect(result.introGate).toBe('intro_hold_missing_trust_anchor');
    expect(result.canRequestIntro).toBe(false);
  });

  it('holds when fresh role-relevant proof is missing', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      candidate: {
        ...readyInput.candidate,
        hasFreshRoleRelevantProof: false,
      },
    });

    expect(result.introGate).toBe('intro_hold_missing_fresh_relevant_proof');
    expect(result.canRequestIntro).toBe(false);
  });

  it('holds on hard assignment constraint mismatch', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      assignment: {
        hardConstraintsSatisfied: false,
      },
    });

    expect(result.introGate).toBe('intro_hold_constraint_mismatch');
    expect(result.canRequestIntro).toBe(false);
  });

  it('holds on privacy or policy review', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      privacy: {
        privacySafeReviewAvailable: false,
      },
    });

    expect(result.introGate).toBe('intro_hold_privacy_or_policy_review');
    expect(result.canRequestIntro).toBe(false);
  });

  it('blocks discovery-only candidates from intro requests', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      discoveryStatus: 'possible_discovery_match',
    });

    expect(result.introGate).toBe('intro_hold_not_match_visible');
    expect(result.canRequestIntro).toBe(false);
  });

  it('blocks orphan Proof Pack evidence from intro eligibility', () => {
    const result = evaluateIntroGate({
      ...readyInput,
      candidate: {
        ...readyInput.candidate,
        orphanRelevantProofCount: 1,
      },
    });

    expect(result.introGate).toBe('intro_hold_missing_trust_anchor');
    expect(result.canRequestIntro).toBe(false);
  });
});
