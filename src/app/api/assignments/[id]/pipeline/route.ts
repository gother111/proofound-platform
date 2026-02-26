import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignmentCreationPipeline, assignments, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const PipelineStepSchema = z.object({
  stepOrder: z.number(),
  stepName: z.string(),
  stakeholderRole: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'rejected']),
  stepData: z.record(z.any()).optional(),
});

/**
 * Helper to verify user owns the assignment
 */
async function verifyAssignmentOwnership(userId: string, assignmentId: string): Promise<boolean> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
  });

  if (!assignment) return false;

  const membership = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.userId, userId),
      eq(organizationMembers.orgId, assignment.orgId),
      eq(organizationMembers.status, 'active')
    ),
  });

  return !!membership;
}

/**
 * POST /api/assignments/[id]/pipeline
 *
 * Update pipeline step status
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id: assignmentId } = await params;

    // Verify ownership
    const hasAccess = await verifyAssignmentOwnership(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this assignment' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedStep = PipelineStepSchema.parse(body);

    // Check if step already exists
    const existingStep = await db.query.assignmentCreationPipeline.findFirst({
      where: and(
        eq(assignmentCreationPipeline.assignmentId, assignmentId),
        eq(assignmentCreationPipeline.stepOrder, validatedStep.stepOrder)
      ),
    });

    if (existingStep) {
      // Update existing step
      await db
        .update(assignmentCreationPipeline)
        .set({
          status: validatedStep.status,
          stepData: validatedStep.stepData,
          completedAt: validatedStep.status === 'completed' ? new Date() : null,
          completedBy: validatedStep.status === 'completed' ? user.id : null,
          updatedAt: new Date(),
        })
        .where(eq(assignmentCreationPipeline.id, existingStep.id));
    } else {
      // Create new step
      await db.insert(assignmentCreationPipeline).values({
        assignmentId,
        stepOrder: validatedStep.stepOrder,
        stepName: validatedStep.stepName,
        stakeholderRole: validatedStep.stakeholderRole,
        status: validatedStep.status,
        stepData: validatedStep.stepData,
        completedAt: validatedStep.status === 'completed' ? new Date() : null,
        completedBy: validatedStep.status === 'completed' ? user.id : null,
      });
    }

    log.info('assignment.pipeline.step.updated', {
      assignmentId,
      stepOrder: validatedStep.stepOrder,
      status: validatedStep.status,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('assignment.pipeline.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: 'Invalid pipeline data', details: error.errors },
        { status: 400 }
      );
    }

    log.error('assignment.pipeline.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
  }
}

/**
 * GET /api/assignments/[id]/pipeline
 *
 * Get pipeline status for an assignment
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id: assignmentId } = await params;

    // Verify ownership
    const hasAccess = await verifyAssignmentOwnership(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view this assignment' },
        { status: 403 }
      );
    }

    const steps = await db.query.assignmentCreationPipeline.findMany({
      where: eq(assignmentCreationPipeline.assignmentId, assignmentId),
      orderBy: (t, { asc }) => [asc(t.stepOrder)],
    });

    return NextResponse.json({ steps });
  } catch (error) {
    log.error('assignment.pipeline.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to get pipeline status' }, { status: 500 });
  }
}
