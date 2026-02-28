import { describe, expect, it } from 'vitest';

import { scoreCompensation } from '@/lib/core/matching/scorers';
import { toAnnualCompensationRange } from '@/lib/matching/compensation';

describe('compensation period normalization', () => {
  it('normalizes monthly profile ranges before annual overlap scoring', () => {
    const assignmentAnnual = { min: 60000, max: 120000 };
    const normalizedProfile = toAnnualCompensationRange({
      min: 5000,
      max: 10000,
      period: 'monthly',
    });

    expect(normalizedProfile).toEqual({ min: 60000, max: 120000 });
    expect(scoreCompensation(assignmentAnnual, normalizedProfile!)).toBe(1);
  });

  it('normalizes hourly profile ranges before annual overlap scoring', () => {
    const assignmentAnnual = { min: 80000, max: 120000 };
    const normalizedProfile = toAnnualCompensationRange({
      min: 40,
      max: 60,
      period: 'hourly',
    });

    expect(normalizedProfile).toEqual({ min: 80000, max: 120000 });
    expect(scoreCompensation(assignmentAnnual, normalizedProfile!)).toBe(1);
  });

  it('defaults to annual when period is missing', () => {
    const normalized = toAnnualCompensationRange({
      min: 90000,
      max: 120000,
    });

    expect(normalized).toEqual({ min: 90000, max: 120000 });
  });
});
