import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignmentOutcomes } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import {
  verifyExplicitAssignmentAccess,
  verifyExplicitAssignmentMutationAccess,
} from '@/lib/assignments/access';
import {
  buildVisualAssignmentDetailResponse,
  getVisualAssignmentFixtureById,
  visualAssignmentFixturesEnabled,
} from '@/lib/assignments/visual-fixtures';

export const dynamic = 'force-dynamic';

const OutcomeSchema = z.object({
  outcomeType: z.enum(['continuous', 'milestone']),
  title: z.string().min(1),
  description: z.string().optional(),
  metrics: z
    .array(
      z.object({
        name: z.string(),
        target: z.string(),
        unit: z.string().optional(),
        current: z.string().optional(),
      })
    )
    .optional(),
  successCriteria: z.string().optional(),
  dependsOn: z.string().uuid().optional(),
});

const OutcomesArraySchema = z.array(OutcomeSchema);

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
 * POST /api/assignments/[id]/outcomes
 *
 * Save outcomes for an assignment to the assignmentOutcomes table
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const { id: assignmentId } = await params;
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const access = await verifyExplicitAssignmentMutationAccess(
      user.id,
      assignmentId,
      orgContextFromRequest(request, body)
    );
    const accessResponse = assignmentAccessResponse(access);
    if (accessResponse) {
      return accessResponse;
    }

    const validatedOutcomes = OutcomesArraySchema.parse(body.outcomes);

    if (visualAssignmentFixturesEnabled() && access.orgId) {
      const visualAssignment = getVisualAssignmentFixtureById(assignmentId, access.orgId);
      if (visualAssignment) {
        return NextResponse.json({ success: true, count: validatedOutcomes.length });
      }
    }

    // Delete existing outcomes for this assignment
    await db.delete(assignmentOutcomes).where(eq(assignmentOutcomes.assignmentId, assignmentId));

    // Insert new outcomes
    if (validatedOutcomes.length > 0) {
      const outcomesData = validatedOutcomes.map((outcome) => ({
        assignmentId,
        outcomeType: outcome.outcomeType,
        title: outcome.title,
        description: outcome.description,
        metrics: outcome.metrics || [],
        successCriteria: outcome.successCriteria,
        dependsOn: outcome.dependsOn,
      }));

      await db.insert(assignmentOutcomes).values(outcomesData);
    }

    log.info('assignment.outcomes.saved', {
      assignmentId,
      count: validatedOutcomes.length,
    });

    return NextResponse.json({ success: true, count: validatedOutcomes.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('assignment.outcomes.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: 'Invalid outcomes data', details: error.errors },
        { status: 400 }
      );
    }

    log.error('assignment.outcomes.save.failed', {
      error: sanitizeErrorForLog(error),
    });

    return NextResponse.json({ error: 'Failed to save outcomes' }, { status: 500 });
  }
}

/**
 * GET /api/assignments/[id]/outcomes
 *
 * Retrieve outcomes for an assignment
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

    if (visualAssignmentFixturesEnabled() && access.orgId) {
      const visualAssignment = getVisualAssignmentFixtureById(assignmentId, access.orgId);
      if (visualAssignment) {
        return NextResponse.json({
          outcomes: buildVisualAssignmentDetailResponse(visualAssignment).outcomes,
        });
      }
    }

    const outcomes = await db.query.assignmentOutcomes.findMany({
      where: eq(assignmentOutcomes.assignmentId, assignmentId),
    });

    return NextResponse.json({ outcomes });
  } catch (error) {
    log.error('assignment.outcomes.get.failed', {
      error: sanitizeErrorForLog(error),
    });

    return NextResponse.json({ error: 'Failed to retrieve outcomes' }, { status: 500 });
  }
}
