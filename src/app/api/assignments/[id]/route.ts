import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitAssignmentPublished } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

/**
 * Track if assignment was already activated (to avoid duplicate events)
 */
const activatedAssignments = new Set<string>();

/**
 * Check if assignment meets PRD-strict activation criteria and emit event
 * Criteria:
 * - Role & description complete
 * - ≥5 must-have L4 skills defined
 * - Location & compensation set
 * - Status = 'active'
 */
async function checkAndEmitAssignmentActivation(
  assignmentId: string,
  orgId: string,
  createdAt: Date
): Promise<void> {
  if (activatedAssignments.has(assignmentId)) return;

  try {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment || assignment.status !== 'active') return;

    // Check 1: Role & description complete
    const hasCompleteDetails = !!assignment.role && !!assignment.description;
    if (!hasCompleteDetails) return;

    // Check 2: ≥5 must-have skills defined
    const mustHaveSkills = (assignment.mustHaveSkills as any[]) || [];
    const hasMinimumSkills = mustHaveSkills.length >= 5;
    if (!hasMinimumSkills) return;

    // Check 3: Location & compensation set
    const hasLocationAndComp =
      (assignment.locationMode || assignment.country) &&
      (assignment.compMin !== null || assignment.compMax !== null);
    if (!hasLocationAndComp) return;

    // Calculate publish time (time from creation to activation)
    const publishTime = Date.now() - createdAt.getTime();
    const publishTimeMinutes = Math.floor(publishTime / (1000 * 60));
    const publishedWithinTimeTarget = publishTimeMinutes <= 15; // ≤15 minutes

    await emitAssignmentPublished(orgId, assignmentId, {
      hasCompleteDetails,
      hasMinimumSkills,
      mustHaveSkillsCount: mustHaveSkills.length,
      hasLocationAndComp,
      publishTimeMinutes,
      publishedWithinTimeTarget,
    });

    activatedAssignments.add(assignmentId);
  } catch (error) {
    log.error('assignment-activation-check.failed', {
      assignmentId,
      orgId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Validation schema (same as POST, but all fields optional for PATCH)
const AssignmentUpdateSchema = z.object({
  role: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
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
 * Helper to verify user owns the assignment's organization
 */
async function verifyAssignmentAccess(userId: string, assignmentId: string): Promise<boolean> {
  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
  });

  if (!assignment) {
    return false;
  }

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

    // Verify access
    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = AssignmentUpdateSchema.parse(body);

    // Convert date strings to Date objects
    const updateData = {
      ...validatedData,
      startEarliest: validatedData.startEarliest,
      startLatest: validatedData.startLatest,
      updatedAt: new Date(),
    };

    // Update assignment
    const [updatedAssignment] = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, assignmentId))
      .returning();

    log.info('assignment.updated', {
      assignmentId,
      userId: user.id,
    });

    // Check if assignment now meets activation criteria
    if (validatedData.status === 'active' || updatedAssignment.status === 'active') {
      await checkAndEmitAssignmentActivation(
        assignmentId,
        updatedAssignment.orgId,
        updatedAssignment.createdAt
      );
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let assignmentId: string | undefined;
  try {
    const user = await requireAuth();
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    // Verify access
    const hasAccess = await verifyAssignmentAccess(user.id, assignmentId);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    // Delete assignment (cascade will delete related matches and interests)
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
