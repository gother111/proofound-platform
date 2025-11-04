import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignmentOutcomes, assignments, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const OutcomeSchema = z.object({
  outcomeType: z.enum(['continuous', 'milestone']),
  title: z.string().min(1),
  description: z.string().optional(),
  metrics: z.array(z.object({
    name: z.string(),
    target: z.string(),
    unit: z.string().optional(),
    current: z.string().optional(),
  })).optional(),
  successCriteria: z.string().optional(),
  dependsOn: z.string().uuid().optional(),
});

const OutcomesArraySchema = z.array(OutcomeSchema);

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
 * POST /api/assignments/[id]/outcomes
 *
 * Save outcomes for an assignment to the assignmentOutcomes table
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
    const validatedOutcomes = OutcomesArraySchema.parse(body.outcomes);

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
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to save outcomes' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assignments/[id]/outcomes
 *
 * Retrieve outcomes for an assignment
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

    const outcomes = await db.query.assignmentOutcomes.findMany({
      where: eq(assignmentOutcomes.assignmentId, assignmentId),
    });

    return NextResponse.json({ outcomes });
  } catch (error) {
    log.error('assignment.outcomes.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to retrieve outcomes' },
      { status: 500 }
    );
  }
}
