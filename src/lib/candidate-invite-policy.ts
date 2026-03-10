import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, organizations } from '@/db/schema';
import { evaluateAssignmentPolicy } from '@/lib/assignments/policy';

export async function resolveCandidateInvitePolicyContext(
  orgId: string,
  assignmentId?: string | null
) {
  const [organization] = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      displayName: organizations.displayName,
      logoUrl: organizations.logoUrl,
      trustStatus: organizations.trustStatus,
      orgTrustTier: organizations.orgTrustTier,
      verified: organizations.verified,
    })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!organization) {
    return {
      organization: null,
      assignment: null,
      policyEvaluation: evaluateAssignmentPolicy({
        organization: null,
        assignment: null,
      }),
    };
  }

  const assignment = assignmentId
    ? ((
        await db
          .select({
            id: assignments.id,
            orgId: assignments.orgId,
            role: assignments.role,
            status: assignments.status,
            createdAt: assignments.createdAt,
            policyAuditState: assignments.policyAuditState,
            policyReasonCodes: assignments.policyReasonCodes,
            creatorRightsPolicy: assignments.creatorRightsPolicy,
            orgUsageRightsPolicy: assignments.orgUsageRightsPolicy,
            alternateTermsRecordedAt: assignments.alternateTermsRecordedAt,
            compensationType: assignments.compensationType,
            commerciality: assignments.commerciality,
            sponsorCommercialStatus: assignments.sponsorCommercialStatus,
            crossBorderStatus: assignments.crossBorderStatus,
            jurisdictionStatus: assignments.jurisdictionStatus,
            sensitiveDomain: assignments.sensitiveDomain,
            sensitiveDomainReviewStatus: assignments.sensitiveDomainReviewStatus,
          })
          .from(assignments)
          .where(and(eq(assignments.id, assignmentId), eq(assignments.orgId, orgId)))
          .limit(1)
      )[0] ?? null)
    : null;

  return {
    organization,
    assignment,
    policyEvaluation: evaluateAssignmentPolicy({
      organization,
      assignment,
    }),
  };
}

export function buildCandidateInvitePolicyError(
  decision: 'hold' | 'blocked',
  flowType: 'proof_card' | 'test_match'
) {
  if (decision === 'blocked') {
    return flowType === 'test_match'
      ? 'This invite is unavailable because the organization or assignment is currently restricted.'
      : 'This invite is unavailable because the organization is currently restricted.';
  }

  return flowType === 'test_match'
    ? 'This invite is temporarily on hold pending policy review.'
    : 'This invite is temporarily unavailable pending policy review.';
}
