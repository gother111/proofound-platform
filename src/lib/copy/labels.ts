const ACRONYM_OVERRIDES: Record<string, string> = {
  ngo: 'NGO',
  url: 'URL',
};

function titleCaseToken(token: string): string {
  const lower = token.toLowerCase();
  return ACRONYM_OVERRIDES[lower] ?? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}`;
}

export function internalValueLabel(value: string | null | undefined, fallback = 'Not specified') {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  return trimmed.split(/[_-]+/g).filter(Boolean).map(titleCaseToken).join(' ');
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_TAXONOMY_CODE_PATTERN = /^\d{1,3}(?:\.\d{1,4}){2,}$/;
const INTERNAL_KEY_PATTERN = /^[a-z][a-z0-9]*_[a-z0-9_]+$/i;

function isOpaqueMachineIdentifier(value: string) {
  return UUID_PATTERN.test(value) || NUMERIC_TAXONOMY_CODE_PATTERN.test(value);
}

export function isMachineIdentifier(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  return isOpaqueMachineIdentifier(trimmed) || INTERNAL_KEY_PATTERN.test(trimmed);
}

export function humanizeIdentifierLabel(
  value: string | null | undefined,
  fallback = 'Not specified'
) {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  const customSkillName = trimmed.match(/^custom[-_](.+)$/i)?.[1];
  if (customSkillName) {
    return internalValueLabel(customSkillName, fallback);
  }

  if (isMachineIdentifier(trimmed)) {
    return fallback;
  }

  return internalValueLabel(trimmed, fallback);
}

type SkillLabelInput = {
  label?: string | null;
  name?: string | null;
  skillName?: string | null;
  customSkillName?: string | null;
  taxonomyName?: string | null;
  id?: string | null;
  code?: string | null;
};

export function skillDisplayLabel(input: SkillLabelInput, fallback = 'Skill name unavailable') {
  const preferred = [
    input.label,
    input.name,
    input.skillName,
    input.customSkillName,
    input.taxonomyName,
  ];

  for (const value of preferred) {
    const trimmed = value?.trim();
    if (trimmed && !isOpaqueMachineIdentifier(trimmed)) {
      return INTERNAL_KEY_PATTERN.test(trimmed) ? internalValueLabel(trimmed) : trimmed;
    }
  }

  for (const value of [input.id, input.code]) {
    const label = humanizeIdentifierLabel(value, fallback);
    if (label !== fallback) {
      return label;
    }
  }

  return fallback;
}

const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Open',
  assignment_ready: 'Assignment ready',
  closed: 'Closed',
  draft: 'Draft',
  hold: 'On hold',
  pending_review: 'Ready for review',
  review_ready: 'Ready for review',
};

export function assignmentStatusLabel(value: string | null | undefined) {
  return value ? (ASSIGNMENT_STATUS_LABELS[value] ?? internalValueLabel(value)) : 'Not specified';
}

const CANDIDATE_INVITE_STATUS_LABELS: Record<string, string> = {
  claimed: 'Claimed',
  expired: 'Expired',
  pending: 'Pending',
  proof_submitted: 'Proof submitted',
  revoked: 'Revoked',
};

export function candidateInviteStatusLabel(value: string | null | undefined) {
  return value ? (CANDIDATE_INVITE_STATUS_LABELS[value] ?? internalValueLabel(value)) : 'Not set';
}

const ENGAGEMENT_TYPE_LABELS: Record<string, string> = {
  contract_consulting: 'Contract / consulting',
  fractional_project: 'Fractional / project',
  full_time: 'Full-time',
  part_time: 'Part-time',
};

export function engagementTypeLabel(value: string | null | undefined) {
  return value ? (ENGAGEMENT_TYPE_LABELS[value] ?? internalValueLabel(value)) : 'Not specified';
}

const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  academic: 'Academic institution',
  company: 'Company',
  cooperative: 'Cooperative',
  government: 'Government / public sector',
  individual: 'Individual',
  network: 'Network',
  ngo: 'Non-profit / NGO',
  other: 'Organization',
  startup: 'Startup',
};

export function organizationTypeLabel(value: string | null | undefined) {
  return value ? (ORGANIZATION_TYPE_LABELS[value] ?? internalValueLabel(value)) : 'Organization';
}

const PROOF_TYPE_LABELS: Record<string, string> = {
  certification: 'Certification',
  document: 'Document',
  link: 'Link',
  media: 'Media',
  project: 'Project',
  reference: 'Reference',
};

export function proofTypeLabel(value: string | null | undefined) {
  return value ? (PROOF_TYPE_LABELS[value] ?? internalValueLabel(value)) : 'Proof';
}

const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  accepted: 'Accepted',
  cancelled: 'Cancelled',
  contradicted: 'Contradicted',
  corrected: 'Corrected',
  declined: 'Declined',
  disputed: 'Disputed',
  expired: 'Expired',
  failed: 'Failed',
  pending: 'Pending',
  revoked: 'Revoked',
  verified: 'Verified',
};

export function verificationStatusLabel(value: string | null | undefined) {
  return value ? (VERIFICATION_STATUS_LABELS[value] ?? internalValueLabel(value)) : 'Not set';
}

const PERSONA_LABELS: Record<string, string> = {
  individual: 'Individual',
  org_member: 'Organization member',
  organization: 'Organization',
};

export function personaLabel(value: string | null | undefined) {
  return value ? (PERSONA_LABELS[value] ?? internalValueLabel(value)) : 'Not set';
}
