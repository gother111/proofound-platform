import type { assignments, organizations } from '@/db/schema';
import { evaluateAssignmentPolicy } from '@/lib/assignments/policy';

const ALLOWED_VERIFICATION_GATES = new Set([
  'identity',
  'work_email',
  'linkedin',
  'background_check',
  'education',
]);

export type AssignmentPublishBlock = {
  blockCode:
    | 'role_required'
    | 'business_value_required'
    | 'outcomes_required'
    | 'must_have_skills_required'
    | 'must_have_skills_minimum_basic'
    | 'constraints_required'
    | 'weights_required'
    | 'invalid_trust_requirements'
    | 'org_trust_restricted'
    | 'assignment_policy_hold'
    | 'assignment_policy_blocked'
    | 'alternate_terms_record_required'
    | 'sensitive_domain_review_required'
    | 'unpaid_commercial_assignment_blocked'
    | 'sponsor_commercial_path_required'
    | 'cross_border_review_required'
    | 'restricted_jurisdiction'
    | 'cross_border_restricted';
  field:
    | 'role'
    | 'businessValue'
    | 'outcomes'
    | 'mustHaveSkills'
    | 'constraints'
    | 'weights'
    | 'trustRequirements';
  message: string;
  details?: Record<string, unknown>;
};

export type AssignmentPublishValidationResult = {
  canPublish: boolean;
  builderMode: 'basic' | 'advanced';
  blocks: AssignmentPublishBlock[];
  missing: string[];
};

type AssignmentPublishValidationInput = {
  assignment: typeof assignments.$inferSelect;
  outcomesCount: number;
  assignmentBasicModeEnabled: boolean;
  organization?: Partial<typeof organizations.$inferSelect> | null;
};

export function validateAssignmentPublishReadiness({
  assignment,
  outcomesCount,
  assignmentBasicModeEnabled,
  organization,
}: AssignmentPublishValidationInput): AssignmentPublishValidationResult {
  const builderMode: 'basic' | 'advanced' = assignmentBasicModeEnabled
    ? assignment.builderMode === 'advanced'
      ? 'advanced'
      : 'basic'
    : 'advanced';
  const blocks: AssignmentPublishBlock[] = [];

  if (!assignment.role?.trim()) {
    blocks.push({
      blockCode: 'role_required',
      field: 'role',
      message: 'Add a clear role title before publishing this assignment.',
    });
  }

  if (!assignment.businessValue?.trim()) {
    blocks.push({
      blockCode: 'business_value_required',
      field: 'businessValue',
      message: 'Add the business value or mission need before publishing this assignment.',
    });
  }

  if (outcomesCount === 0) {
    blocks.push({
      blockCode: 'outcomes_required',
      field: 'outcomes',
      message: 'Add at least one target outcome before publishing this assignment.',
    });
  }

  const mustHaveSkills = Array.isArray(assignment.mustHaveSkills) ? assignment.mustHaveSkills : [];
  if (mustHaveSkills.length === 0) {
    blocks.push({
      blockCode: 'must_have_skills_required',
      field: 'mustHaveSkills',
      message: 'Add must-have skills before publishing this assignment.',
    });
  } else if (builderMode === 'basic' && mustHaveSkills.length < 3) {
    blocks.push({
      blockCode: 'must_have_skills_minimum_basic',
      field: 'mustHaveSkills',
      message: 'Basic mode requires at least 3 must-have skills before publishing.',
      details: { minimumRequired: 3, currentCount: mustHaveSkills.length },
    });
  }

  const constraintIssues: string[] = [];
  if (!assignment.locationMode && !assignment.city && !assignment.country) {
    constraintIssues.push('location');
  }
  if (
    assignment.compMin == null ||
    assignment.compMax == null ||
    assignment.compMax <= assignment.compMin
  ) {
    constraintIssues.push('compensation');
  }
  if (constraintIssues.length > 0) {
    blocks.push({
      blockCode: 'constraints_required',
      field: 'constraints',
      message: 'Complete the practical constraints before publishing this assignment.',
      details: { missing: constraintIssues },
    });
  }

  if (builderMode === 'advanced') {
    const weights = assignment.weights as Record<string, unknown> | null;
    const mission = typeof weights?.mission === 'number' ? weights.mission : null;
    const expertise = typeof weights?.expertise === 'number' ? weights.expertise : null;
    const workMode = typeof weights?.workMode === 'number' ? weights.workMode : null;

    if (
      mission === null ||
      expertise === null ||
      workMode === null ||
      mission + expertise + workMode !== 100
    ) {
      blocks.push({
        blockCode: 'weights_required',
        field: 'weights',
        message:
          'Advanced mode requires a complete weight matrix that totals exactly 100 before publishing.',
      });
    }
  }

  const verificationGates = Array.isArray(assignment.verificationGates)
    ? assignment.verificationGates
    : [];
  const invalidGates = verificationGates.filter((gate) => !ALLOWED_VERIFICATION_GATES.has(gate));
  if (invalidGates.length > 0) {
    blocks.push({
      blockCode: 'invalid_trust_requirements',
      field: 'trustRequirements',
      message: 'Remove unsupported trust requirements before publishing this assignment.',
      details: { invalidGates },
    });
  }

  const policyEvaluation = evaluateAssignmentPolicy({ assignment, organization });
  for (const reason of policyEvaluation.reasons) {
    blocks.push({
      blockCode: reason.code,
      field: 'trustRequirements',
      message: reason.message,
      details: {
        ...(reason.details ?? {}),
        orgTrustTier: policyEvaluation.orgTrustTier,
        decision: reason.decision,
      },
    });
  }

  return {
    canPublish: blocks.length === 0,
    builderMode,
    blocks,
    missing: Array.from(new Set(blocks.map((block) => block.field))),
  };
}
