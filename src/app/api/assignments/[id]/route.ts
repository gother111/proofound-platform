import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments } from '@/db/schema';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import { verifyAssignmentAccess } from '@/lib/assignments/access';
import { requireAuth } from '@/lib/auth';
import { AssignmentStatusSchema } from '@/lib/contracts/domain';
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

    const weights = (assignment.weights as Record<string, number> | null) || {};
    const responseAssignment = {
      id: assignment.id,
      role: assignment.role,
      businessValue: (assignment as any).businessValue ?? assignment.businessValue ?? '',
      expectedImpact: (assignment as any).expectedImpact ?? assignment.expectedImpact ?? '',
      outcomes: (assignment as any).outcomes ?? [],
      missionWeight: weights.mission ?? 33,
      expertiseWeight: weights.expertise ?? 34,
      compensationMin: assignment.compMin,
      compensationMax: assignment.compMax,
      currency: assignment.currency,
      location: assignment.locationMode || assignment.city || assignment.country || '',
      requiredSkills: (assignment.mustHaveSkills as any) || [],
      niceToHaveSkills: (assignment.niceToHaveSkills as any) || [],
      verificationGates: assignment.verificationGates || [],
      status: assignment.status,
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
  status: AssignmentStatusSchema.optional(),
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

    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
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

    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
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
