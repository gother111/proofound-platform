import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignmentExpertiseMatrix, assignments, organizationMembers, assignmentOutcomes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const ExpertiseMatrixItemSchema = z.object({
  skillCode: z.string(),
  requiredLevel: z.number().min(1).max(5),
  stakeholderRole: z.string().optional().default('creator'),
  linkedOutcomeId: z.string().uuid().optional(),
  outcomeRationale: z.string().optional(),
});

const ExpertiseMatrixArraySchema = z.array(ExpertiseMatrixItemSchema);

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
 * POST /api/assignments/[id]/expertise-matrix
 *
 * Save expertise matrix (skills linked to outcomes) for an assignment
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const assignmentId = params.id;

    // Verify ownership
    const hasAccess = await verifyAssignmentOwnership(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this assignment' },
        { status: 403 }
      );
    }

    const body = await request.json();
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
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to save expertise matrix' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/[id]/expertise-matrix
 *
 * Retrieve expertise matrix for an assignment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const assignmentId = params.id;

    // Verify ownership
    const hasAccess = await verifyAssignmentOwnership(user.id, assignmentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view this assignment' },
        { status: 403 }
      );
    }

    const matrix = await db.query.assignmentExpertiseMatrix.findMany({
      where: eq(assignmentExpertiseMatrix.assignmentId, assignmentId),
    });

    return NextResponse.json({ expertiseMatrix: matrix });
  } catch (error) {
    log.error('assignment.expertise-matrix.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to retrieve expertise matrix' },
      { status: 500 }
    );
  }
}
