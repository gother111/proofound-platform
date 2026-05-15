import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignmentCreationPipeline } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import {
  verifyExplicitAssignmentAccess,
  verifyExplicitAssignmentMutationAccess,
} from '@/lib/assignments/access';

export const dynamic = 'force-dynamic';

const PipelineStepSchema = z.object({
  stepOrder: z.number(),
  stepName: z.string(),
  stakeholderRole: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'skipped', 'rejected']),
  stepData: z.record(z.any()).optional(),
});

function orgContextFromRequest(request: NextRequest, body?: Record<string, unknown>) {
  return {
    orgId:
      request.nextUrl.searchParams.get('orgId') ??
      (typeof body?.orgId === 'string' ? body.orgId : null),
    orgSlug:
      request.nextUrl.searchParams.get('orgSlug') ??
      (typeof body?.orgSlug === 'string' ? body.orgSlug : null),
  };
}

function assignmentAccessResponse(
  access: Awaited<ReturnType<typeof verifyExplicitAssignmentAccess>>
) {
  if (access.status === 'missing_org_context') {
    return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
  }
  if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
    return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
  }
  if (access.status === 'insufficient_role') {
    return NextResponse.json(
      { error: 'Forbidden. Organization manager or owner role is required.' },
      { status: 403 }
    );
  }

  return null;
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
    const body = await request.json();

    const access = await verifyExplicitAssignmentMutationAccess(
      user.id,
      assignmentId,
      orgContextFromRequest(request, body)
    );
    const accessResponse = assignmentAccessResponse(access);
    if (accessResponse) {
      return accessResponse;
    }

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
      error: sanitizeErrorForLog(error),
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

    const access = await verifyExplicitAssignmentAccess(
      user.id,
      assignmentId,
      orgContextFromRequest(request)
    );
    const accessResponse = assignmentAccessResponse(access);
    if (accessResponse) {
      return accessResponse;
    }

    const steps = await db.query.assignmentCreationPipeline.findMany({
      where: eq(assignmentCreationPipeline.assignmentId, assignmentId),
      orderBy: (t, { asc }) => [asc(t.stepOrder)],
    });

    return NextResponse.json({ steps });
  } catch (error) {
    log.error('assignment.pipeline.get.failed', {
      error: sanitizeErrorForLog(error),
    });

    return NextResponse.json({ error: 'Failed to get pipeline status' }, { status: 500 });
  }
}
