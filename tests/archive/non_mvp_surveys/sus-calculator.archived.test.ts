import { describe, expect, it } from 'vitest';

import { calculateSUSScore, type SUSResponse } from '@/lib/surveys/sus-calculator';

function buildResponse(value: number): SUSResponse {
  return {
    q1: value,
    q2: value,
    q3: value,
    q4: value,
    q5: value,
    q6: value,
    q7: value,
    q8: value,
    q9: value,
    q10: value,
  };
}

describe('calculateSUSScore', () => {
  it('scores fully positive responses at the top of the scale', () => {
    const result = calculateSUSScore({
      q1: 5,
      q2: 1,
      q3: 5,
      q4: 1,
      q5: 5,
      q6: 1,
      q7: 5,
      q8: 1,
      q9: 5,
      q10: 1,
    });

    expect(result).toMatchObject({
      rawScore: 100,
      percentile: 95,
      grade: 'A',
      adjective: 'Best Imaginable',
      meetsTarget: true,
    });
  });

  it('scores neutral responses in the lower middle band consistently', () => {
    const result = calculateSUSScore(buildResponse(3));

    expect(result).toMatchObject({
      rawScore: 50,
      percentile: 20,
      grade: 'D',
      adjective: 'Poor',
      meetsTarget: false,
      interpretation:
        'Below average usability. Users experience notable difficulties and frustrations.',
    });
  });

  it('throws when any response is out of range', () => {
    expect(() => calculateSUSScore({ ...buildResponse(3), q7: 6 })).toThrow(
      'All SUS responses must be between 1 and 5'
    );
  });
});
