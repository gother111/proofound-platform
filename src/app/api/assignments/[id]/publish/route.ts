import { and, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { assignmentOutcomes, assignments, organizations } from '@/db/schema';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import { verifyExplicitAssignmentMutationAccess } from '@/lib/assignments/access';
import { emitAssignmentPublishSucceeded } from '@/lib/analytics/events';
import { validateAssignmentPublishReadiness } from '@/lib/assignments/publish-validation';
import { requireApiAuthContext } from '@/lib/auth';
import { ensureOrganizationPrincipal } from '@/lib/authz';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';

export const dynamic = 'force-dynamic';

const PUBLISHABLE_CREATION_STATUSES = ['review_ready'] as const;
const PUBLISHABLE_WORKFLOW_STATUSES = ['draft', 'active'] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const resolved = await params;
    assignmentId = resolved.id;

    let body: Record<string, unknown> = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const principal = ensureOrganizationPrincipal(body.principalContext);
    if (!principal.ok) {
      return NextResponse.json({ error: principal.error }, { status: 403 });
    }

    const access = await verifyExplicitAssignmentMutationAccess(user.id, assignmentId, {
      orgId: principal.context.orgId,
    });
    if (access.status === 'missing_org_context') {
      return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
    }
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json(
        {
          error:
            'Forbidden. Organization manager or owner role is required to publish assignments.',
        },
        { status: 403 }
      );
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!PUBLISHABLE_CREATION_STATUSES.includes(assignment.creationStatus as any)) {
      return NextResponse.json(
        {
          error: 'ASSIGNMENT_INTERNAL_REVIEW_REQUIRED',
          message: 'Assignment must reach internal review before it can be published.',
          details: {
            currentCreationStatus: assignment.creationStatus,
            allowedCreationStatuses: PUBLISHABLE_CREATION_STATUSES,
          },
        },
        { status: 409 }
      );
    }

    const currentWorkflowStatus = assignment.status ?? 'draft';
    if (!PUBLISHABLE_WORKFLOW_STATUSES.includes(currentWorkflowStatus as any)) {
      return NextResponse.json(
        {
          error: 'ASSIGNMENT_NOT_PUBLISHABLE',
          message:
            'Assignment must be in draft or already active state before it can be published.',
          details: {
            currentStatus: currentWorkflowStatus,
            allowedStatuses: PUBLISHABLE_WORKFLOW_STATUSES,
          },
        },
        { status: 409 }
      );
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, assignment.orgId),
      columns: {
        id: true,
        slug: true,
        orgReadiness: true,
        trustStatus: true,
        orgTrustTier: true,
        verified: true,
      },
    });

    const orgSlug = request.nextUrl.searchParams.get('orgSlug');
    if (orgSlug && (!org || org.slug !== orgSlug)) {
      return NextResponse.json({ error: 'Organization context mismatch' }, { status: 403 });
    }

    if (!org || org.orgReadiness !== 'org_ready') {
      return NextResponse.json(
        {
          error: 'ORG_NOT_READY',
          message:
            'Organization trust basics must be complete and domain-verified before an assignment can be published.',
          details: {
            currentOrgReadiness: org?.orgReadiness ?? 'draft',
            requiredOrgReadiness: 'org_ready',
          },
        },
        { status: 409 }
      );
    }

    const outcomes = await db.query.assignmentOutcomes.findMany({
      where: eq(assignmentOutcomes.assignmentId, assignmentId),
      columns: { id: true },
    });

    const assignmentBasicModeEnabled = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE,
      { userId: user.id, orgId: assignment.orgId },
      true
    );

    const readiness = validateAssignmentPublishReadiness({
      assignment,
      outcomesCount: outcomes.length,
      assignmentBasicModeEnabled,
      organization: org ?? null,
    });
    if (!readiness.canPublish) {
      const hasPolicyBlock = readiness.blocks.some((block) =>
        [
          'org_trust_restricted',
          'assignment_policy_blocked',
          'unpaid_commercial_assignment_blocked',
          'sponsor_commercial_path_required',
          'restricted_jurisdiction',
          'cross_border_restricted',
        ].includes(block.blockCode)
      );
      const hasPolicyHold =
        !hasPolicyBlock &&
        readiness.blocks.some((block) =>
          [
            'assignment_policy_hold',
            'alternate_terms_record_required',
            'sensitive_domain_review_required',
            'cross_border_review_required',
          ].includes(block.blockCode)
        );

      return NextResponse.json(
        {
          error: hasPolicyBlock
            ? 'ASSIGNMENT_PUBLISH_BLOCKED'
            : hasPolicyHold
              ? 'ASSIGNMENT_PUBLISH_ON_HOLD'
              : 'Assignment is not ready to publish',
          message: hasPolicyBlock
            ? 'Publishing is blocked by trust or policy requirements.'
            : hasPolicyHold
              ? 'Publishing is on hold pending trust or policy review.'
              : 'Complete all required sections before publishing.',
          details: {
            builderMode: readiness.builderMode,
            blocks: readiness.blocks,
            missing: readiness.missing,
          },
        },
        { status: hasPolicyBlock ? 403 : hasPolicyHold ? 409 : 400 }
      );
    }

    const [publishedAssignment] = await db
      .update(assignments)
      .set({
        status: 'active',
        creationStatus: 'review_ready',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(assignments.id, assignmentId),
          eq(assignments.creationStatus, 'review_ready'),
          inArray(assignments.status, [...PUBLISHABLE_WORKFLOW_STATUSES])
        )
      )
      .returning();

    if (!publishedAssignment) {
      return NextResponse.json(
        {
          error: 'ASSIGNMENT_PUBLISH_STATE_CHANGED',
          message: 'Assignment publish state changed. Refresh and try again.',
        },
        { status: 409 }
      );
    }

    void emitAssignmentPublishSucceeded(user.id, assignmentId, publishedAssignment.orgId, {
      builderMode: publishedAssignment.builderMode || 'basic',
      source: 'assignments_publish_route',
    });

    void checkAndEmitAssignmentActivation({
      assignmentId,
      orgId: publishedAssignment.orgId,
      createdAt: publishedAssignment.createdAt,
      userId: user.id,
    });

    log.info('assignment.published', {
      assignmentId,
      orgId: publishedAssignment.orgId,
      userId: user.id,
      principalType: principal.context.principalType,
      membershipId: access.membershipId,
    });

    return NextResponse.json({ assignment: publishedAssignment });
  } catch (error) {
    log.error('assignment.publish.failed', {
      assignmentId,
      error: sanitizeErrorForLog(error),
    });
    return NextResponse.json({ error: 'Failed to publish assignment' }, { status: 500 });
  }
}
