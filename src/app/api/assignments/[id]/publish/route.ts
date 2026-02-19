import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/db';
import { assignmentOutcomes, assignments, organizations } from '@/db/schema';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import { verifyAssignmentAccess } from '@/lib/assignments/access';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

type PublishValidationResult = {
  canPublish: boolean;
  missing: string[];
};

function validatePublishReadiness(
  assignment: typeof assignments.$inferSelect,
  outcomesCount: number
): PublishValidationResult {
  const missing: string[] = [];

  if (!assignment.role?.trim()) missing.push('role');
  if (!assignment.businessValue?.trim()) missing.push('businessValue');

  const mustHaveSkills = Array.isArray(assignment.mustHaveSkills) ? assignment.mustHaveSkills : [];
  if (mustHaveSkills.length === 0) missing.push('mustHaveSkills');

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

    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
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

    const readiness = validatePublishReadiness(assignment, outcomes.length);
    if (!readiness.canPublish) {
      return NextResponse.json(
        {
          error: 'Assignment is not ready to publish',
          message: 'Complete all required sections before publishing.',
          details: { missing: readiness.missing },
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
