import { describe, expect, it } from 'vitest';

import { evaluateAssignmentActivationCriteria } from '@/lib/assignments/activation';

function makeBaseAssignment() {
  return {
    status: 'active' as const,
    role: 'Senior Engineer',
    description: null,
    businessValue: null,
    expectedImpact: null,
    mustHaveSkills: [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }, { id: 's5' }],
    locationMode: 'remote',
    country: null,
    compMin: 100000,
    compMax: null,
  };
}

describe('evaluateAssignmentActivationCriteria', () => {
  it('accepts narrative context from business value when description is empty', () => {
    const assignment = {
      ...makeBaseAssignment(),
      businessValue: 'Improve retention in strategic accounts',
    };

    const result = evaluateAssignmentActivationCriteria(assignment);
    expect(result.hasCompleteDetails).toBe(true);
    expect(result.canActivate).toBe(true);
  });

  it('accepts narrative context from expected impact when description is empty', () => {
    const assignment = {
      ...makeBaseAssignment(),
      expectedImpact: 'Reduce churn by 20% in 6 months',
    };

    const result = evaluateAssignmentActivationCriteria(assignment);
    expect(result.hasCompleteDetails).toBe(true);
    expect(result.canActivate).toBe(true);
  });

  it('requires at least one narrative field (description/businessValue/expectedImpact)', () => {
    const assignment = makeBaseAssignment();
    const result = evaluateAssignmentActivationCriteria(assignment);

    expect(result.hasCompleteDetails).toBe(false);
    expect(result.canActivate).toBe(false);
  });
});
