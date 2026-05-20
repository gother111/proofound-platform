import type { assignments, organizations } from '@/db/schema';
import { evaluateAssignmentPolicy } from '@/lib/assignments/policy';

const ALLOWED_VERIFICATION_GATES = new Set([
  'identity',
  'work_email',
  'background_check',
  'education',
]);

export type AssignmentPublishBlock = {
  blockCode:
    | 'role_required'
    | 'role_purpose_required'
    | 'work_summary_required'
    | 'proof_expectations_required'
    | 'outcomes_required'
    | 'must_have_skills_required'
    | 'must_have_skills_minimum_basic'
    | 'constraints_required'
    | 'generic_assignment_language'
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
    | 'rolePurpose'
    | 'description'
    | 'proofExpectations'
    | 'outcomes'
    | 'mustHaveSkills'
    | 'constraints'
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

const GENERIC_ASSIGNMENT_PATTERNS = [
  'join our team',
  'make an impact',
  'fast-paced',
  'wear many hats',
  'other duties as assigned',
  'rockstar',
  'ninja',
  'self-starter',
];

function getSpecificityIssue(
  value: string | null | undefined
): 'too_short' | 'generic_phrase' | null {
  const normalized = value?.trim().toLowerCase() || '';
  if (!normalized) {
    return 'too_short';
  }

  const words = normalized.match(/[a-z0-9]+/g) || [];
  if (normalized.length < 40 || words.length < 6) {
    return 'too_short';
  }

  if (GENERIC_ASSIGNMENT_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return 'generic_phrase';
  }

  return null;
}

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
      message: 'Add a clear assignment title before publishing this assignment.',
    });
  }

  if (!assignment.businessValue?.trim()) {
    blocks.push({
      blockCode: 'role_purpose_required',
      field: 'rolePurpose',
      message: 'Add the role purpose before publishing this assignment.',
    });
  }

  if (!assignment.description?.trim()) {
    blocks.push({
      blockCode: 'work_summary_required',
      field: 'description',
      message: 'Explain what work will actually be done before publishing this assignment.',
    });
  }

  if (!assignment.expectedImpact?.trim()) {
    blocks.push({
      blockCode: 'proof_expectations_required',
      field: 'proofExpectations',
      message: 'Explain what proof would convince the organization before publishing.',
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

  const specificityChecks: Array<{
    field: 'rolePurpose' | 'description' | 'proofExpectations';
    value: string | null | undefined;
    message: string;
  }> = [
    {
      field: 'rolePurpose',
      value: assignment.businessValue,
      message:
        'Explain why this role exists in concrete terms. Generic recruiting language is not enough.',
    },
    {
      field: 'description',
      value: assignment.description,
      message:
        'Describe the actual work in concrete terms. Generic job-description filler is not enough.',
    },
    {
      field: 'proofExpectations',
      value: assignment.expectedImpact,
      message:
        'Describe what proof would count in concrete terms before publishing this assignment.',
    },
  ];

  for (const check of specificityChecks) {
    const issue = getSpecificityIssue(check.value);
    if (!issue) continue;
    blocks.push({
      blockCode: 'generic_assignment_language',
      field: check.field,
      message: check.message,
      details: { issue },
    });
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
