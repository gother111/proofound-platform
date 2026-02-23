import { describe, expect, it } from 'vitest';

import { getPreset, weightsFromMissionSkillsBias } from '@/lib/core/matching/presets';

function sumWeights(weights: Record<string, number>): number {
  return Object.values(weights).reduce((acc, value) => acc + value, 0);
}

function normalize(weights: Record<string, number>): Record<string, number> {
  const sum = sumWeights(weights);
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, value / sum]));
}

describe('weightsFromMissionSkillsBias', () => {
  const expectWeightsClose = (
    received: Record<string, number>,
    expected: Record<string, number>
  ) => {
    for (const [key, value] of Object.entries(expected)) {
      expect(received[key]).toBeCloseTo(value, 8);
    }
  };

  it('maps 0 to skills-first preset', () => {
    expectWeightsClose(weightsFromMissionSkillsBias(0), normalize(getPreset('skills-first')));
  });

  it('maps 50 to balanced preset', () => {
    expectWeightsClose(weightsFromMissionSkillsBias(50), normalize(getPreset('balanced')));
  });

  it('maps 100 to mission-first preset', () => {
    expectWeightsClose(weightsFromMissionSkillsBias(100), normalize(getPreset('mission-first')));
  });

  it('always normalizes to 1.0 total', () => {
    const weights = weightsFromMissionSkillsBias(23);
    expect(sumWeights(weights)).toBeCloseTo(1, 5);
  });
});
