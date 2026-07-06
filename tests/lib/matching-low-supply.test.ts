import { describe, expect, it } from 'vitest';

import { discoverPossibleMatches } from '@/lib/matching/discovery';
import { evaluateMatchEvidence } from '@/lib/matching/evidence-evaluation';

describe('low-supply matching discovery', () => {
  it('widens discovery with an explicit low-supply reason', () => {
    const [match] = discoverPossibleMatches({
      assignment: {
        id: 'assignment-1',
        mustHaveSkills: [{ id: 'workflow design', level: 4 }],
        expectedImpact: 'Reduce onboarding support load.',
      },
      candidates: [
        {
          id: 'candidate-1',
          skills: ['service design'],
          customWording: ['reduce onboarding support load'],
        },
      ],
      lowSupply: {
        introReadyCount: 0,
        introReadyThreshold: 2,
      },
    });

    expect(match.discoverySignals).toContain('adjacent_skill_overlap');
    expect(match.discoverySignals).toContain('custom_wording_overlap');
    expect(match.discoverySignals).toContain('low_supply_expanded_discovery');
    expect(match.lowSupplyExpanded).toBe(true);
  });

  it('keeps weak low-supply results out of intro-ready status', () => {
    const [match] = discoverPossibleMatches({
      assignment: {
        id: 'assignment-1',
        mustHaveSkills: [{ id: 'workflow design', level: 4 }],
      },
      candidates: [
        {
          id: 'candidate-1',
          skills: ['service design'],
          readiness: { matchVisible: false },
        },
      ],
      lowSupply: {
        introReadyCount: 0,
        introReadyThreshold: 2,
      },
    });
    const evaluation = evaluateMatchEvidence({ discoveredCandidate: match });

    expect(evaluation.discoveryStatus).toBe('possible_discovery_match');
    expect(evaluation.canRequestIntro).toBe(false);
    expect(evaluation.hasStrongEvidenceOverlap).toBe(false);
    expect(evaluation.fitBand).not.toBe('strong_evidence_overlap');
    expect(evaluation.reasonDetails.map((reason) => reason.code)).toContain(
      'low_supply_expanded_discovery'
    );
  });

  it('does not add low-supply expansion to direct evidence overlaps', () => {
    const [match] = discoverPossibleMatches({
      assignment: {
        id: 'assignment-1',
        mustHaveSkills: [{ id: 'frontend', level: 4 }],
      },
      candidates: [
        {
          id: 'candidate-1',
          skills: ['front-end'],
        },
      ],
      lowSupply: {
        introReadyCount: 0,
        introReadyThreshold: 2,
      },
    });

    expect(match.discoverySignals).toContain('canonical_skill_overlap');
    expect(match.discoverySignals).not.toContain('low_supply_expanded_discovery');
  });
});
