import { describe, expect, it } from 'vitest';

import { calculateFocusBoost } from '@/lib/core/matching/focus';

describe('calculateFocusBoost', () => {
  it('applies role-only boost', () => {
    const result = calculateFocusBoost(
      { desiredRoles: ['Software Engineer'] },
      { assignmentRole: 'Senior Software Engineer' }
    );

    expect(result.boost).toBeCloseTo(0.04, 5);
    expect(result.matched.role).toBe(true);
    expect(result.matched.industry).toBe(false);
    expect(result.matched.orgType).toBe(false);
  });

  it('applies industry-only boost', () => {
    const result = calculateFocusBoost(
      { desiredIndustries: ['Healthcare'] },
      { orgIndustry: 'healthcare' }
    );

    expect(result.boost).toBeCloseTo(0.025, 5);
  });

  it('applies org-type-only boost', () => {
    const result = calculateFocusBoost({ orgTypes: ['startup'] }, { orgType: 'company' });

    expect(result.boost).toBeCloseTo(0.015, 5);
  });

  it('caps combined boost at 0.08', () => {
    const result = calculateFocusBoost(
      {
        desiredRoles: ['Engineer'],
        desiredIndustries: ['Technology'],
        orgTypes: ['company'],
      },
      {
        assignmentRole: 'Software Engineer',
        orgIndustry: 'Technology',
        orgType: 'company',
      }
    );

    expect(result.boost).toBeCloseTo(0.08, 5);
  });

  it('returns zero boost with no focus inputs', () => {
    const result = calculateFocusBoost({}, { assignmentRole: 'Engineer' });
    expect(result.boost).toBe(0);
  });
});
