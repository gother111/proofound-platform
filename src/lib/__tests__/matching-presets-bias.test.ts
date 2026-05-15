import { describe, expect, it } from 'vitest';

import {
  getPreset,
  normalizeWeights,
  resolvePresetKey,
  weightsFromProofSkillsBias,
} from '@/lib/core/matching/presets';

function sumWeights(weights: Record<string, number>): number {
  return Object.values(weights).reduce((acc, value) => acc + value, 0);
}

function normalize(weights: Record<string, number>): Record<string, number> {
  const sum = sumWeights(weights);
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / sum]));
}

describe('weightsFromProofSkillsBias', () => {
  const expectWeightsClose = (
    received: Record<string, number>,
    expected: Record<string, number>
  ) => {
    for (const [key, value] of Object.entries(expected)) {
      expect(received[key]).toBeCloseTo(value, 8);
    }
  };

  it('maps 0 to skills-emphasis preset', () => {
    expectWeightsClose(weightsFromProofSkillsBias(0), normalize(getPreset('skills-first')));
  });

  it('maps 50 to balanced preset', () => {
    expectWeightsClose(weightsFromProofSkillsBias(50), normalize(getPreset('balanced')));
  });

  it('maps 100 to the proof-emphasis preset', () => {
    expectWeightsClose(weightsFromProofSkillsBias(100), normalize(getPreset('proof-first')));
  });

  it('always normalizes to 1.0 total', () => {
    const weights = weightsFromProofSkillsBias(23);
    expect(sumWeights(weights)).toBeCloseTo(1, 5);
  });

  it('maps legacy mission mode payloads to proof-first weights with purpose weights disabled', () => {
    expect(resolvePresetKey('mission-first')).toBe('proof-first');
    expect(getPreset('mission-first')).toMatchObject({ values: 0, causes: 0, pac: 0 });
  });

  it('zeros legacy purpose weights from custom payloads', () => {
    const weights = normalizeWeights({
      values: 0.8,
      causes: 0.2,
      pac: 0.4,
      skills: 0.6,
      evidence: 0.4,
    });

    expect(weights.values).toBe(0);
    expect(weights.causes).toBe(0);
    expect(weights.pac).toBe(0);
    expect(sumWeights(weights)).toBeCloseTo(1, 5);
  });
});
