import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { assignmentOutcomes, assignments, organizations } from '@/db/schema';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import { verifyAssignmentMutationAccess } from '@/lib/assignments/access';
import { emitAssignmentPublishSucceeded } from '@/lib/analytics/events';
import { requireAuth } from '@/lib/auth';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

type PublishValidationResult = {
  canPublish: boolean;
  missing: string[];
};

function validatePublishReadiness(
  assignment: typeof assignments.$inferSelect,
  outcomesCount: number,
  assignmentBasicModeEnabled: boolean
): PublishValidationResult {
  const builderMode =
    assignmentBasicModeEnabled && assignment.builderMode === 'basic' ? 'basic' : 'advanced';
  const enforceAdvancedWeights =
    assignment.builderMode === 'advanced' || !assignmentBasicModeEnabled;
  const missing: string[] = [];

  if (!assignment.role?.trim()) missing.push('role');
  if (!assignment.businessValue?.trim()) missing.push('businessValue');

  const mustHaveSkills = Array.isArray(assignment.mustHaveSkills) ? assignment.mustHaveSkills : [];
  const minimumSkills = builderMode === 'basic' ? 3 : 1;
  if (mustHaveSkills.length < minimumSkills) missing.push('mustHaveSkills');

  if (!assignment.locationMode && !assignment.city && !assignment.country) {
    missing.push('location');
  }

  if (
    assignment.compMin == null ||
    assignment.compMax == null ||
    assignment.compMax <= assignment.compMin
  ) {
    missing.push('compensation');
  }

  if (outcomesCount === 0) missing.push('outcomes');

  if (builderMode === 'advanced' && enforceAdvancedWeights) {
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
      missing.push('weights');
    }
  }

  return {
    canPublish: missing.length === 0,
    missing,
  };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const user = await requireAuth();
    const resolved = await params;
    assignmentId = resolved.id;

    const access = await verifyAssignmentMutationAccess(user.id, assignmentId);
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json(
        { error: 'Forbidden. Owner or admin role is required to publish assignments.' },
        { status: 403 }
      );
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const orgSlug = request.nextUrl.searchParams.get('orgSlug');
    if (orgSlug) {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.slug, orgSlug),
      });

      if (!org || org.id !== assignment.orgId) {
        return NextResponse.json({ error: 'Organization context mismatch' }, { status: 403 });
      }
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

    const readiness = validatePublishReadiness(
      assignment,
      outcomes.length,
      assignmentBasicModeEnabled
    );
    if (!readiness.canPublish) {
      return NextResponse.json(
        {
          error: 'Assignment is not ready to publish',
          message: 'Complete all required sections before publishing.',
          details: { missing: readiness.missing, builderMode: assignment.builderMode || 'basic' },
        },
        { status: 400 }
      );
    }

    const [publishedAssignment] = await db
      .update(assignments)
      .set({
        status: 'active',
        creationStatus: 'published',
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignmentId))
      .returning();

    await emitAssignmentPublishSucceeded(user.id, assignmentId, publishedAssignment.orgId, {
      builderMode: publishedAssignment.builderMode || 'basic',
      source: 'assignments_publish_route',
    });

    await checkAndEmitAssignmentActivation({
      assignmentId,
      orgId: publishedAssignment.orgId,
      createdAt: publishedAssignment.createdAt,
      userId: user.id,
    });

    log.info('assignment.published', {
      assignmentId,
      orgId: publishedAssignment.orgId,
      userId: user.id,
    });

    return NextResponse.json({ assignment: publishedAssignment });
  } catch (error) {
    log.error('assignment.publish.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to publish assignment' }, { status: 500 });
  }
}
