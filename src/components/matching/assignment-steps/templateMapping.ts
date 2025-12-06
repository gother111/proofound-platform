import { UseFormReturn } from 'react-hook-form';
import { AssignmentData } from '@/actions/assignment';
import type { AssignmentTemplate, TemplateStep } from '@/actions/assignmentTemplates';

export const TEMPLATE_STEP_LABELS: Record<TemplateStep, string> = {
  business_value: 'Business Value',
  target_outcomes: 'Target Outcomes',
  weight_matrix: 'Weight Matrix',
  practicals: 'Practicals',
  expertise: 'Expertise Mapping',
};

type ApplyResult = {
  appliedSteps: TemplateStep[];
  updatedFields: string[];
};

/**
 * Safely apply a template payload to the assignment form, only touching
 * fields that belong to the steps declared in appliesToSteps.
 */
export function applyTemplateToForm(
  form: UseFormReturn<AssignmentData>,
  template: AssignmentTemplate
): ApplyResult {
  const steps = new Set<TemplateStep>(template.appliesToSteps ?? []);
  const payload = (template.presetPayload ?? {}) as Record<string, any>;
  const updatedFields: string[] = [];

  const setField = (step: TemplateStep, path: string, value: unknown) => {
    if (!steps.has(step) || value === undefined || value === null) return;
    form.setValue(path as any, value as any, { shouldDirty: true, shouldTouch: false });
    updatedFields.push(path);
  };

  // Step 1: Business Value
  setField('business_value', 'role', payload.role ?? payload.title);
  setField('business_value', 'businessValue', payload.businessValue ?? payload.business_value);
  setField('business_value', 'expectedImpact', payload.expectedImpact ?? payload.expected_impact);
  setField('business_value', 'description', payload.description);

  // Step 2: Target Outcomes
  if (steps.has('target_outcomes') && Array.isArray(payload.outcomes)) {
    form.setValue('outcomes' as any, payload.outcomes, { shouldDirty: true });
    updatedFields.push('outcomes');
  }

  // Step 3: Weight Matrix
  if (steps.has('weight_matrix') && payload.weights) {
    form.setValue('weights' as any, payload.weights, { shouldDirty: true });
    updatedFields.push('weights');
  }
  setField('weight_matrix', 'workModeRequirement', payload.workModeRequirement);
  setField('weight_matrix', 'workModePreference', payload.workModePreference);

  // Step 4: Practicals
  setField('practicals', 'compMin', payload.compMin);
  setField('practicals', 'compMax', payload.compMax);
  setField('practicals', 'currency', payload.currency);
  setField('practicals', 'hoursMin', payload.hoursMin);
  setField('practicals', 'hoursMax', payload.hoursMax);
  setField('practicals', 'locationMode', payload.locationMode);
  setField('practicals', 'city', payload.city);
  setField('practicals', 'country', payload.country);
  setField('practicals', 'startEarliest', payload.startEarliest);
  setField('practicals', 'startLatest', payload.startLatest);
  setField('practicals', 'duration', payload.duration);
  if (steps.has('practicals') && Array.isArray(payload.verificationGates)) {
    form.setValue('verificationGates' as any, payload.verificationGates, { shouldDirty: true });
    updatedFields.push('verificationGates');
  }

  // Step 5: Expertise Mapping
  if (steps.has('expertise') && Array.isArray(payload.mustHaveSkills)) {
    form.setValue('mustHaveSkills' as any, payload.mustHaveSkills, { shouldDirty: true });
    updatedFields.push('mustHaveSkills');
  }
  if (steps.has('expertise') && Array.isArray(payload.niceToHaveSkills)) {
    form.setValue('niceToHaveSkills' as any, payload.niceToHaveSkills, { shouldDirty: true });
    updatedFields.push('niceToHaveSkills');
  }
  setField('expertise', 'minLanguage', payload.minLanguage);
  setField('expertise', 'educationRequired', payload.educationRequired);
  setField('expertise', 'educationJustification', payload.educationJustification);

  return { appliedSteps: Array.from(steps), updatedFields };
}
