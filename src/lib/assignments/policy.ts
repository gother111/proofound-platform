import type { assignments, organizations } from '@/db/schema';

export type OrgTrustTier = 'unreviewed' | 'basic_trusted' | 'reviewed' | 'restricted';

export type AssignmentPolicyDecision = 'allow' | 'hold' | 'blocked';

export type AssignmentPolicyReasonCode =
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

export type AssignmentPolicyReason = {
  code: AssignmentPolicyReasonCode;
  decision: Exclude<AssignmentPolicyDecision, 'allow'>;
  message: string;
  details?: Record<string, unknown>;
};

export type AssignmentPolicyEvaluation = {
  decision: AssignmentPolicyDecision;
  orgTrustTier: OrgTrustTier;
  reasons: AssignmentPolicyReason[];
};

type AssignmentRow = typeof assignments.$inferSelect;
type OrganizationRow = typeof organizations.$inferSelect;

function coerceOrgTrustTier(org?: Partial<OrganizationRow> | null): OrgTrustTier {
  const explicitTier = org?.orgTrustTier;
  if (
    explicitTier === 'unreviewed' ||
    explicitTier === 'basic_trusted' ||
    explicitTier === 'reviewed' ||
    explicitTier === 'restricted'
  ) {
    return explicitTier;
  }

  if (org?.trustStatus === 'platform_reviewed' || org?.verified === true) {
    return 'reviewed';
  }

  if (org?.trustStatus === 'domain_verified') {
    return 'basic_trusted';
  }

  return 'unreviewed';
}

function decisionWeight(decision: AssignmentPolicyDecision) {
  switch (decision) {
    case 'blocked':
      return 2;
    case 'hold':
      return 1;
    case 'allow':
    default:
      return 0;
  }
}

function pickDecision(reasons: AssignmentPolicyReason[]): AssignmentPolicyDecision {
  const strongest = reasons.reduce<AssignmentPolicyDecision>(
    (current, reason) =>
      decisionWeight(reason.decision) > decisionWeight(current) ? reason.decision : current,
    'allow'
  );

  return strongest;
}

export function evaluateAssignmentPolicy(input: {
  assignment: Partial<AssignmentRow> | null | undefined;
  organization?: Partial<OrganizationRow> | null;
}): AssignmentPolicyEvaluation {
  const assignment = input.assignment ?? {};
  const orgTrustTier = coerceOrgTrustTier(input.organization);
  const reasons: AssignmentPolicyReason[] = [];

  if (orgTrustTier === 'restricted') {
    reasons.push({
      code: 'org_trust_restricted',
      decision: 'blocked',
      message:
        'This organization is currently restricted, so publishing and introductions are paused.',
      details: { orgTrustTier },
    });
  }

  if (assignment.policyAuditState === 'blocked') {
    reasons.push({
      code: 'assignment_policy_blocked',
      decision: 'blocked',
      message: 'This assignment is blocked by policy review until the flagged issue is resolved.',
      details: { policyReasonCodes: assignment.policyReasonCodes ?? [] },
    });
  }

  if (assignment.policyAuditState === 'hold') {
    reasons.push({
      code: 'assignment_policy_hold',
      decision: 'hold',
      message: 'This assignment is on hold pending policy review.',
      details: { policyReasonCodes: assignment.policyReasonCodes ?? [] },
    });
  }

  const alternateTermsRequired =
    assignment.creatorRightsPolicy === 'alternate_terms' ||
    assignment.orgUsageRightsPolicy === 'alternate_terms';
  if (alternateTermsRequired && !assignment.alternateTermsRecordedAt) {
    reasons.push({
      code: 'alternate_terms_record_required',
      decision: 'hold',
      message: 'Alternate assignment terms must be recorded before this workflow can continue.',
    });
  }

  const unpaidCommercial =
    (assignment.compensationType === 'unpaid' || assignment.compensationType === 'volunteer') &&
    (assignment.commerciality === 'commercial' ||
      assignment.commerciality === 'operationally_significant');
  if (unpaidCommercial) {
    reasons.push({
      code: 'unpaid_commercial_assignment_blocked',
      decision: 'blocked',
      message: 'Unpaid commercial or operationally significant work is blocked by policy.',
      details: {
        compensationType: assignment.compensationType,
        commerciality: assignment.commerciality,
      },
    });
  }

  if (assignment.sponsorCommercialStatus === 'required') {
    reasons.push({
      code: 'sponsor_commercial_path_required',
      decision: 'blocked',
      message:
        'A sponsor or commercial approval path is required before this assignment can proceed.',
    });
  }

  if (assignment.crossBorderStatus === 'restricted') {
    reasons.push({
      code: 'cross_border_restricted',
      decision: 'blocked',
      message: 'This assignment is blocked because the cross-border flow is restricted.',
    });
  } else if (assignment.crossBorderStatus === 'required') {
    reasons.push({
      code: 'cross_border_review_required',
      decision: 'hold',
      message: 'Cross-border review is required before this assignment can proceed.',
    });
  }

  if (assignment.jurisdictionStatus === 'restricted') {
    reasons.push({
      code: 'restricted_jurisdiction',
      decision: 'blocked',
      message: 'This assignment is blocked in the current jurisdiction.',
    });
  }

  const sensitiveDomain = assignment.sensitiveDomain ?? 'standard';
  const requiresSensitiveReview =
    sensitiveDomain !== 'standard' &&
    (assignment.sensitiveDomainReviewStatus !== 'approved' || orgTrustTier !== 'reviewed');

  if (requiresSensitiveReview) {
    reasons.push({
      code: 'sensitive_domain_review_required',
      decision: 'hold',
      message:
        'This assignment is in a sensitive domain and requires reviewed organization trust plus policy approval.',
      details: {
        sensitiveDomain,
        sensitiveDomainReviewStatus: assignment.sensitiveDomainReviewStatus ?? 'not_required',
        orgTrustTier,
      },
    });
  }

  return {
    decision: pickDecision(reasons),
    orgTrustTier,
    reasons,
  };
}
