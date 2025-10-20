import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { MATCHING_ENABLED } from '@/lib/featureFlags';
import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

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
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    if (!MATCHING_ENABLED) {
      return NextResponse.json({ error: 'Matching feature is not enabled' }, { status: 403 });
    }

    const user = await requireAuth();

    // Verify access
    const hasAccess = await verifyAssignmentAccess(user.id, id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = AssignmentUpdateSchema.parse(body);

    // Prepare update payload, keeping date strings for Drizzle date columns
    const updateData = {
      ...validatedData,
      startEarliest: validatedData.startEarliest ?? undefined,
      startLatest: validatedData.startLatest ?? undefined,
      updatedAt: new Date(),
    };

    // Update assignment
    const [updatedAssignment] = await db
      .update(assignments)
      .set(updateData)
      .where(eq(assignments.id, id))
      .returning();

    log.info('assignment.updated', {
      assignmentId: id,
      userId: user.id,
    });

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('assignment.update.failed', {
      assignmentId: id,
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
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    if (!MATCHING_ENABLED) {
      return NextResponse.json({ error: 'Matching feature is not enabled' }, { status: 403 });
    }

    const user = await requireAuth();

    // Verify access
    const hasAccess = await verifyAssignmentAccess(user.id, id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }

    // Delete assignment (cascade will delete related matches and interests)
    await db.delete(assignments).where(eq(assignments.id, id));

    log.info('assignment.deleted', {
      assignmentId: id,
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('assignment.delete.failed', {
      assignmentId: id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}
