import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignmentOutcomes, assignments } from '@/db/schema';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import { verifyAssignmentAccess, verifyAssignmentMutationAccess } from '@/lib/assignments/access';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assignments/[id]
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

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

    const outcomesRows = await db.query.assignmentOutcomes.findMany({
      where: eq(assignmentOutcomes.assignmentId, assignmentId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    const normalizedOutcomes = outcomesRows.map((outcome) => {
      const firstMetric = Array.isArray(outcome.metrics) ? outcome.metrics[0] : null;
      const timeframeMatch = outcome.description?.match(/in ([^.]*)$/i);
      return {
        id: outcome.id,
        metric: firstMetric?.name || outcome.title,
        target: firstMetric?.target || '',
        timeframe: timeframeMatch?.[1] || '',
      };
    });

    const weights = (assignment.weights as Record<string, number> | null) || {};
    const responseAssignment = {
      id: assignment.id,
      orgId: assignment.orgId,
      role: assignment.role,
      businessValue: assignment.businessValue ?? '',
      expectedImpact: assignment.expectedImpact ?? '',
      outcomes: normalizedOutcomes,
      missionWeight: weights.mission ?? 33,
      expertiseWeight: weights.expertise ?? 34,
      workModeWeight: weights.workMode ?? 33,
      compensationMin: assignment.compMin,
      compensationMax: assignment.compMax,
      compMin: assignment.compMin,
      compMax: assignment.compMax,
      currency: assignment.currency,
      hoursMin: assignment.hoursMin,
      hoursMax: assignment.hoursMax,
      locationMode: assignment.locationMode,
      city: assignment.city,
      country: assignment.country,
      startEarliest: assignment.startEarliest,
      startLatest: assignment.startLatest,
      weights,
      location: assignment.locationMode || assignment.city || assignment.country || '',
      requiredSkills: (assignment.mustHaveSkills as any) || [],
      niceToHaveSkills: (assignment.niceToHaveSkills as any) || [],
      verificationGates: assignment.verificationGates || [],
      status: assignment.status,
      creationStatus: assignment.creationStatus,
    };

    return NextResponse.json({ assignment: responseAssignment });
  } catch (error) {
    log.error('assignment.get.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to fetch assignment' }, { status: 500 });
  }
}

const AssignmentUpdateSchema = z.object({
  role: z.string().min(1).optional(),
  description: z.string().optional(),
  businessValue: z.string().optional(),
  expectedImpact: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  creationStatus: z
    .enum(['draft', 'pipeline_in_progress', 'pending_review', 'ready_to_publish', 'published'])
    .optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        level: z.number().min(0).max(5),
      })
    )
    .optional(),
  niceToHaveSkills: z
    .array(
      z.object({
        id: z.string(),
        level: z.number().min(0).max(5),
      })
    )
    .optional(),
  minLanguage: z
    .object({
      code: z.string(),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    })
    .optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  startEarliest: z.string().optional(),
  startLatest: z.string().optional(),
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).optional(),
});

/**
 * PUT /api/assignments/[id]
 *
 * Updates an assignment.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    const access = await verifyAssignmentMutationAccess(user.id, assignmentId);
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json(
        { error: 'Forbidden. Owner or admin role is required to update assignments.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = AssignmentUpdateSchema.parse(body);

    const updateData = {
      ...validatedData,
      startEarliest: validatedData.startEarliest,
      startLatest: validatedData.startLatest,
      updatedAt: new Date(),
    };

    const [updatedAssignment] = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, assignmentId))
      .returning();

    log.info('assignment.updated', {
      assignmentId,
      userId: user.id,
    });

    if (validatedData.status === 'active' || updatedAssignment.status === 'active') {
      await checkAndEmitAssignmentActivation({
        assignmentId,
        orgId: updatedAssignment.orgId,
        createdAt: updatedAssignment.createdAt,
        userId: user.id,
      });
    }

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('assignment.update.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

/**
 * DELETE /api/assignments/[id]
 *
 * Deletes an assignment.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let assignmentId: string | undefined;

  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    const access = await verifyAssignmentMutationAccess(user.id, assignmentId);
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json(
        { error: 'Forbidden. Owner or admin role is required to delete assignments.' },
        { status: 403 }
      );
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    log.info('assignment.deleted', {
      assignmentId,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('assignment.delete.failed', {
      assignmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
