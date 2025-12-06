import { describe, it, expect, vi } from 'vitest';
import { applyTemplateToForm } from '@/components/matching/assignment-steps/templateMapping';
import type { AssignmentTemplate } from '@/actions/assignmentTemplates';
import type { AssignmentData } from '@/actions/assignment';

function createMockForm(initial: Partial<AssignmentData> = {}) {
  const values: Record<string, any> = { ...initial };
  const setValue = vi.fn((path: string, value: any) => {
    values[path] = value;
  });

  return { values, setValue } as any;
}

describe('applyTemplateToForm', () => {
  it('applies only the steps declared in appliesToSteps', () => {
    const form = createMockForm();
    const template: AssignmentTemplate = {
      id: 'tmpl-1',
      orgId: null,
      name: 'Backend',
      roleFamily: 'Engineering',
      description: null,
      appliesToSteps: ['business_value', 'practicals'],
      presetPayload: {
        role: 'Senior Backend Engineer',
        businessValue: 'Improve platform reliability',
        outcomes: [{ metric: 'Uptime', target: '99.95%', timeframe: '6mo' }],
        compMin: 120000,
        compMax: 150000,
      },
      isGlobal: true,
      createdBy: null,
      createdAt: null,
      updatedAt: null,
    };

    const result = applyTemplateToForm(form, template);

    expect(result.appliedSteps).toEqual(['business_value', 'practicals']);
    expect(form.values.role).toBe('Senior Backend Engineer');
    expect(form.values.businessValue).toBe('Improve platform reliability');
    expect(form.values.compMin).toBe(120000);
    expect(form.values.compMax).toBe(150000);
    // Outcomes should not be applied because target_outcomes is not in appliesToSteps
    expect(form.values.outcomes).toBeUndefined();
  });

  it('applies array payloads when the matching step is enabled', () => {
    const form = createMockForm();
    const template: AssignmentTemplate = {
      id: 'tmpl-2',
      orgId: null,
      name: 'Sales',
      roleFamily: 'Sales',
      description: null,
      appliesToSteps: ['target_outcomes', 'expertise'],
      presetPayload: {
        outcomes: [{ metric: 'Pipeline', target: '$1M', timeframe: '6mo' }],
        mustHaveSkills: [{ id: 'enterprise_sales', label: 'Enterprise Sales', level: 4 }],
        niceToHaveSkills: [{ id: 'security_domain', label: 'Security', level: 2 }],
      },
      isGlobal: true,
      createdBy: null,
      createdAt: null,
      updatedAt: null,
    };

    applyTemplateToForm(form, template);

    expect(form.values.outcomes).toEqual([{ metric: 'Pipeline', target: '$1M', timeframe: '6mo' }]);
    expect(form.values.mustHaveSkills).toHaveLength(1);
    expect(form.values.niceToHaveSkills).toHaveLength(1);
    // Practicals not included, so compMin should stay undefined
    expect(form.values.compMin).toBeUndefined();
  });
});
