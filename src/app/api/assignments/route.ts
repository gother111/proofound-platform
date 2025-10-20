import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { MATCHING_ENABLED } from '@/lib/featureFlags';
import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

// Validation schemas
const SkillRequirementSchema = z.object({
  id: z.string(),
  level: z.number().min(0).max(5),
});

const LanguageRequirementSchema = z.object({
  code: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

const AssignmentSchema = z.object({
  role: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z.array(SkillRequirementSchema).optional(),
  niceToHaveSkills: z.array(SkillRequirementSchema).optional(),
  minLanguage: LanguageRequirementSchema.optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  startEarliest: z.string().optional(), // ISO date string
  startLatest: z.string().optional(),
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).optional(),
});

/**
 * Helper to get user's organization ID
 */
async function getUserOrgId(userId: string): Promise<string | null> {
  const membership = await db.query.organizationMembers.findFirst({
    where: and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, 'active')),
  });

  return membership?.orgId || null;
}

/**
 * GET /api/assignments
 *
 * Returns all assignments for the current user's organization.
 */
export async function GET() {
  try {
    if (!MATCHING_ENABLED) {
      return NextResponse.json({ items: [] });
    }

    const user = await requireAuth();

    // Check if user is a member of an organization
    const orgId = await getUserOrgId(user.id);

    if (!orgId) {
      return NextResponse.json({ items: [] });
    }

    // Fetch assignments for this organization
    const orgAssignments = await db.query.assignments.findMany({
      where: eq(assignments.orgId, orgId),
      orderBy: (assignments, { desc }) => [desc(assignments.createdAt)],
    });

    return NextResponse.json({ items: orgAssignments });
  } catch (error) {
    log.error('assignments.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

/**
 * POST /api/assignments
 *
 * Creates a new assignment for the current user's organization.
 */
export async function POST(request: NextRequest) {
  try {
    if (!MATCHING_ENABLED) {
      return NextResponse.json({ error: 'Matching feature is not enabled' }, { status: 403 });
    }

    const user = await requireAuth();

    // Check if user is a member of an organization
    const orgId = await getUserOrgId(user.id);

    if (!orgId) {
      return NextResponse.json(
        { error: 'You must be a member of an organization to create assignments' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validatedData = AssignmentSchema.parse(body);

    // Prepare assignment payload, keeping date strings for Drizzle's date columns
    const assignmentData = {
      orgId,
      ...validatedData,
      startEarliest: validatedData.startEarliest ?? undefined,
      startLatest: validatedData.startLatest ?? undefined,
    };

    // Insert assignment
    const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();

    log.info('assignment.created', {
      assignmentId: newAssignment.id,
      orgId,
      role: newAssignment.role,
    });

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('assignment.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
