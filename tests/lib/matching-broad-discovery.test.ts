import { describe, expect, it } from 'vitest';

import { discoverPossibleMatches } from '@/lib/matching/discovery';
import { evaluateMatchEvidence } from '@/lib/matching/evidence-evaluation';

function discoverOne(assignment: unknown, candidate: unknown) {
  const [match] = discoverPossibleMatches({
    assignment,
    candidates: [candidate],
  });
  expect(match).toBeDefined();
  return match;
}

describe('broad deterministic matching discovery', () => {
  it('finds alias wording for user research and customer interviews', () => {
    const match = discoverOne(
      { id: 'assignment-1', mustHaveSkills: [{ id: 'user research', level: 4 }] },
      { id: 'candidate-1', skills: ['customer interviews'] }
    );

    expect(match.discoverySignals).toContain('alias_skill_overlap');
  });

  it('normalizes spelling and hyphen variants for front-end and frontend', () => {
    const match = discoverOne(
      { id: 'assignment-1', mustHaveSkills: [{ id: 'front-end', level: 4 }] },
      { id: 'candidate-1', skills: ['frontend'] }
    );

    expect(match.discoverySignals).toContain('canonical_skill_overlap');
  });

  it('normalizes abbreviations for JavaScript and JS', () => {
    const match = discoverOne(
      { id: 'assignment-1', mustHaveSkills: [{ id: 'JavaScript', level: 4 }] },
      { id: 'candidate-1', skills: ['JS'] }
    );

    expect(match.discoverySignals).toContain('canonical_skill_overlap');
  });

  it('keeps adjacent product operations and workflow design exploratory', () => {
    const match = discoverOne(
      { id: 'assignment-1', mustHaveSkills: [{ id: 'product operations', level: 4 }] },
      { id: 'candidate-1', skills: ['workflow design'] }
    );
    const evaluation = evaluateMatchEvidence({ discoveredCandidate: match });

    expect(match.discoverySignals).toContain('adjacent_skill_overlap');
    expect(match.discoverySignals).not.toContain('canonical_skill_overlap');
    expect(evaluation.hasStrongEvidenceOverlap).toBe(false);
  });

  it('discovers proof outcome text aligned to assignment outcomes', () => {
    const match = discoverOne(
      {
        id: 'assignment-1',
        expectedImpact: 'Reduce onboarding support load for new customers.',
      },
      {
        id: 'candidate-1',
        proofPacks: [
          {
            id: 'proof-1',
            title: 'Onboarding support redesign',
            outcome: 'Reduced onboarding support tickets by 23%.',
            freshnessState: 'fresh',
            hasPrimaryAnchor: true,
            hasActiveNonSelfTrustAnchor: true,
          },
        ],
      }
    );

    expect(match.discoverySignals).toContain('role_relevant_outcome');
  });

  it('discovers custom wording overlap without a mapped taxonomy skill', () => {
    const match = discoverOne(
      {
        id: 'assignment-1',
        expectedImpact: 'Reduce onboarding support load for first-week users.',
      },
      {
        id: 'candidate-1',
        customWording: ['first-week onboarding support load reduction'],
      }
    );

    expect(match.discoverySignals).toContain('custom_wording_overlap');
  });

  it('does not lift trust from unsupported self-claimed skills alone', () => {
    const match = discoverOne(
      { id: 'assignment-1', mustHaveSkills: [{ id: 'user research', level: 4 }] },
      {
        id: 'candidate-1',
        skills: ['user research'],
        readiness: { matchVisible: true },
      }
    );
    const evaluation = evaluateMatchEvidence({ discoveredCandidate: match });

    expect(match.discoverySignals).toContain('canonical_skill_overlap');
    expect(evaluation.canRequestIntro).toBe(false);
    expect(evaluation.reasonDetails.map((reason) => reason.code)).toContain(
      'verification_gate_missing'
    );
    expect(evaluation.reasonDetails.map((reason) => reason.code)).not.toContain(
      'non_self_trust_anchor_present'
    );
  });
});
