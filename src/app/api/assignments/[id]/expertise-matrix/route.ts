import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignmentExpertiseMatrix, assignments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { deriveRequirementsFromMatrix } from '@/lib/assignments/expertise-matrix';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import {
  verifyExplicitAssignmentAccess,
  verifyExplicitAssignmentMutationAccess,
} from '@/lib/assignments/access';

export const dynamic = 'force-dynamic';

const ExpertiseMatrixItemSchema = z.object({
  skillCode: z.string(),
  requiredLevel: z.number().min(1).max(5),
  stakeholderRole: z.string().optional().default('must'),
  linkedOutcomeId: z.string().uuid().optional(),
  outcomeRationale: z.string().optional(),
});

const ExpertiseMatrixArraySchema = z.array(ExpertiseMatrixItemSchema);

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
 * POST /api/assignments/[id]/expertise-matrix
 *
 * Save expertise matrix (skills linked to outcomes) for an assignment
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

    const validatedMatrix = ExpertiseMatrixArraySchema.parse(body.expertiseMatrix);

    // Delete existing expertise matrix entries for this assignment
    await db
      .delete(assignmentExpertiseMatrix)
      .where(eq(assignmentExpertiseMatrix.assignmentId, assignmentId));

    // Insert new expertise matrix entries
    if (validatedMatrix.length > 0) {
      const matrixData = validatedMatrix.map((item) => ({
        assignmentId,
        skillCode: item.skillCode,
        requiredLevel: item.requiredLevel,
        stakeholderRole: item.stakeholderRole,
        linkedOutcomeId: item.linkedOutcomeId,
        outcomeRationale: item.outcomeRationale,
      }));

      await db.insert(assignmentExpertiseMatrix).values(matrixData);
    }

    const derivedRequirements = deriveRequirementsFromMatrix(
      validatedMatrix.map((item) => ({
        skillCode: item.skillCode,
        requiredLevel: item.requiredLevel,
        stakeholderRole: item.stakeholderRole,
      }))
    );

    await db
      .update(assignments)
      .set({
        mustHaveSkills: derivedRequirements.mustHaveSkills,
        niceToHaveSkills: derivedRequirements.niceToHaveSkills,
        updatedAt: new Date(),
      })
      .where(eq(assignments.id, assignmentId));

    log.info('assignment.expertise-matrix.saved', {
      assignmentId,
      count: validatedMatrix.length,
    });

    return NextResponse.json({ success: true, count: validatedMatrix.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('assignment.expertise-matrix.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: 'Invalid expertise matrix data', details: error.errors },
        { status: 400 }
      );
    }

    log.error('assignment.expertise-matrix.save.failed', {
      error: sanitizeErrorForLog(error),
    });

    return NextResponse.json({ error: 'Failed to save expertise matrix' }, { status: 500 });
  }
}

/**
 * GET /api/assignments/[id]/expertise-matrix
 *
 * Retrieve expertise matrix for an assignment
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

    const matrix = await db.query.assignmentExpertiseMatrix.findMany({
      where: eq(assignmentExpertiseMatrix.assignmentId, assignmentId),
    });

    return NextResponse.json({ expertiseMatrix: matrix });
  } catch (error) {
    log.error('assignment.expertise-matrix.get.failed', {
      error: sanitizeErrorForLog(error),
    });

    return NextResponse.json({ error: 'Failed to retrieve expertise matrix' }, { status: 500 });
  }
}
