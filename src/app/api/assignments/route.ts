import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, organizationMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';
import { emitAssignmentPublished } from '@/lib/analytics/events';

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
 * Returns assignments for the current user's organization with pagination.
 * Query params:
 * - limit: Number of items to return (default: 20, max: 100)
 * - offset: Number of items to skip (default: 0)
 * - status: Filter by status (draft, active, paused, closed)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    // Check if user is a member of an organization
    const orgId = await getUserOrgId(user.id);

    if (!orgId) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const statusFilter = searchParams.get('status');

    // Build query
    let query = db.select().from(assignments).where(eq(assignments.orgId, orgId)).$dynamic();

    // Add status filter if provided
    if (statusFilter && ['draft', 'active', 'paused', 'closed'].includes(statusFilter)) {
      query = query.where(
        and(eq(assignments.orgId, orgId), eq(assignments.status, statusFilter as any))
      );
    }

    // Fetch assignments with pagination (fetch one extra to check if there are more)
    const orgAssignments = await query
      .orderBy((t: any) => t.createdAt)
      .limit(limit + 1)
      .offset(offset);

    // Check if there are more results
    const hasMore = orgAssignments.length > limit;
    const assignmentsToReturn = hasMore ? orgAssignments.slice(0, limit) : orgAssignments;

    return NextResponse.json({
      items: assignmentsToReturn,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
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

    // Convert date strings to Date objects
    const assignmentData = {
      orgId,
      ...validatedData,
      startEarliest: validatedData.startEarliest,
      startLatest: validatedData.startLatest,
    };

    // Insert assignment
    const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();

    log.info('assignment.created', {
      assignmentId: newAssignment.id,
      orgId,
      role: newAssignment.role,
    });

    // Check if assignment was created with 'active' status and meets activation criteria
    if (newAssignment.status === 'active') {
      const hasCompleteDetails = !!newAssignment.role && !!newAssignment.description;
      const mustHaveSkills = (newAssignment.mustHaveSkills as any[]) || [];
      const hasMinimumSkills = mustHaveSkills.length >= 5;
      const hasLocationAndComp =
        (newAssignment.locationMode || newAssignment.country) &&
        (newAssignment.compMin !== null || newAssignment.compMax !== null);

      if (hasCompleteDetails && hasMinimumSkills && hasLocationAndComp) {
        const publishTimeMinutes = 0; // Created and published simultaneously
        await emitAssignmentPublished(orgId, newAssignment.id, {
          hasCompleteDetails,
          hasMinimumSkills,
          mustHaveSkillsCount: mustHaveSkills.length,
          hasLocationAndComp,
          publishTimeMinutes,
          publishedWithinTimeTarget: true, // Immediate publish
        });
      }
    }

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('assignment.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: error.errors,
          message:
            'Some required fields are missing or invalid. Please review your assignment details.',
        },
        { status: 400 }
      );
    }

    // Database connection errors
    if (
      error instanceof Error &&
      (error.message.includes('connect') ||
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('timeout'))
    ) {
      log.error('assignment.db.connection.failed', {
        error: error.message,
        stack: error.stack,
      });
      return NextResponse.json(
        {
          error: 'Database connection failed',
          message: 'Unable to save assignment. Please check your connection and try again.',
        },
        { status: 503 }
      );
    }

    log.error('assignment.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to create assignment',
        message: error instanceof Error ? error.message : 'An unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}
