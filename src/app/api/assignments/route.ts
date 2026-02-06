import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { assignments, organizationMembers, matches, organizations } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { jsonErrorWithRequest, withApiObservability } from '@/lib/api/observability';
import { emitAssignmentPublished, emitAnalyticsEvent } from '@/lib/analytics/events';
import { notifyAssignmentPublished } from '@/lib/notifications';
import { triggerFirstAssignmentSurvey } from '@/lib/surveys/sus-triggers';
import { generateMatchesForAssignment } from '@/lib/matching/generate-matches-for-assignment';

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
  return withApiObservability(request, '/api/assignments', async (ctx) => {
    try {
      const user = await requireAuth();

      // Check if user is a member of an organization
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        log.info('assignments.list.no_org', { requestId: ctx.requestId, userId: user.id });
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

      log.info('assignments.list.fetched', {
        requestId: ctx.requestId,
        userId: user.id,
        orgId,
        count: orgAssignments.length,
        limit,
        offset,
        status: statusFilter,
      });

      // Check if there are more results
      const hasMore = orgAssignments.length > limit;
      const assignmentsToReturn = hasMore ? orgAssignments.slice(0, limit) : orgAssignments;

      // -----------------------------------------------------------------------
      // PRD safeguard: TTFQI 72h warning if <5 matches after 72 hours
      // -----------------------------------------------------------------------
      const activeAssignments = assignmentsToReturn.filter((a: any) => a.status === 'active');
      const assignmentIds = activeAssignments.map((a: any) => a.id);

      let matchCounts: Record<string, number> = {};

      if (assignmentIds.length > 0) {
        const rows = await db
          .select({
            assignmentId: matches.assignmentId,
            count: sql<number>`count(*)::int`,
          })
          .from(matches)
          .where(inArray(matches.assignmentId, assignmentIds))
          .groupBy(matches.assignmentId);

        matchCounts = rows.reduce(
          (acc, row) => {
            acc[row.assignmentId] = row.count;
            return acc;
          },
          {} as Record<string, number>
        );
      }

      const now = Date.now();
      const itemsWithWarnings = await Promise.all(
        assignmentsToReturn.map(async (assignment: any) => {
          const ageHours = (now - new Date(assignment.createdAt).getTime()) / (1000 * 60 * 60);
          const count = matchCounts[assignment.id] ?? 0;
          const warn =
            assignment.status === 'active' && ageHours >= 72 && count < 5
              ? {
                  code: 'ttfqi_warning',
                  message: 'Fewer than 5 matches after 72h. Broaden constraints or relax gates.',
                  matchesCount: count,
                  ageHours: Math.round(ageHours),
                }
              : null;

          if (warn) {
            try {
              await emitAnalyticsEvent({
                eventType: 'ttfqi_warning_emitted',
                userId: user.id,
                organizationId: assignment.orgId,
                entityType: 'assignment',
                entityId: assignment.id,
                properties: warn,
              });
            } catch (e) {
              log.warn('assignments.ttfqi_warning.emit_failed', {
                requestId: ctx.requestId,
                assignmentId: assignment.id,
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }

          return {
            ...assignment,
            ttfqiWarning: warn,
          };
        })
      );

      return NextResponse.json({
        items: itemsWithWarnings,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      });
    } catch (error) {
      log.error('assignments.list.failed', {
        requestId: ctx.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return jsonErrorWithRequest(ctx.requestId, 'Failed to fetch assignments', 500);
    }
  });
}

/**
 * POST /api/assignments
 *
 * Creates a new assignment for the current user's organization.
 */
export async function POST(request: NextRequest) {
  return withApiObservability(request, '/api/assignments', async (ctx) => {
    try {
      const user = await requireAuth();

      // Check if user is a member of an organization
      const orgId = await getUserOrgId(user.id);

      if (!orgId) {
        return jsonErrorWithRequest(
          ctx.requestId,
          'You must be a member of an organization to create assignments',
          403
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

      // Insert assignment in a transaction (though this is a single operation,
      // we wrap it for consistency and potential future multi-step operations)
      const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();

      log.info('assignment.created', {
        assignmentId: newAssignment.id,
        orgId,
        role: newAssignment.role,
      });

      // Check if this is the organization's first assignment and trigger SUS survey
      try {
        const existingAssignments = await db
          .select({ id: assignments.id })
          .from(assignments)
          .where(eq(assignments.orgId, orgId))
          .limit(2); // Just need to know if there are 1 or more

        if (existingAssignments.length === 1) {
          // This is the first assignment - trigger SUS survey for the user who created it
          await triggerFirstAssignmentSurvey(user.id);
        }
      } catch (error) {
        log.error('sus_survey.first_assignment_check_failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          orgId,
        });
        // Don't let survey trigger failure break assignment creation
      }

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
          await emitAssignmentPublished(user.id, newAssignment.id, orgId, {
            hasCompleteDetails,
            hasMinimumSkills,
            mustHaveSkillsCount: mustHaveSkills.length,
            hasLocationAndComp,
            publishTimeMinutes,
            publishedWithinTimeTarget: true, // Immediate publish
          });

          // Generate matches for this assignment
          const matchStartTime = Date.now();
          const matchesGenerated = await generateMatchesForAssignment(newAssignment.id);
          log.info('assignment.matches.generated', {
            requestId: ctx.requestId,
            assignmentId: newAssignment.id,
            orgId,
            matchesGenerated,
            durationMs: Date.now() - matchStartTime,
          });

          // Get organization name for notifications
          const org = await db.query.organizations.findFirst({
            where: eq(organizations.id, orgId),
          });
          const orgName = org?.displayName || 'An organization';

          // Send notifications to top 10 matching candidates
          if (matchesGenerated > 0) {
            const topMatches = await db.query.matches.findMany({
              where: eq(matches.assignmentId, newAssignment.id),
              orderBy: (t: any, { desc }) => [desc(t.score)],
              limit: 10,
            });

            for (const match of topMatches) {
              try {
                await notifyAssignmentPublished(
                  match.profileId,
                  newAssignment.id,
                  newAssignment.role,
                  orgName
                );
              } catch (notifyError) {
                log.error('assignment.notification.failed', {
                  profileId: match.profileId,
                  assignmentId: newAssignment.id,
                  error: notifyError instanceof Error ? notifyError.message : 'Unknown error',
                });
                // Continue with other notifications even if one fails
              }
            }

            log.info('assignment.notifications.sent', {
              assignmentId: newAssignment.id,
              notificationsSent: topMatches.length,
            });
          }
        }
      }

      return NextResponse.json({ assignment: newAssignment }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('assignment.validation.failed', {
          errors: error.errors,
        });
        return jsonErrorWithRequest(ctx.requestId, 'Invalid input', 400, {
          details: error.errors,
          message:
            'Some required fields are missing or invalid. Please review your assignment details.',
        });
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
        return jsonErrorWithRequest(
          ctx.requestId,
          'Database connection failed',
          503,
          'Unable to save assignment. Please check your connection and try again.'
        );
      }

      log.error('assignment.create.failed', {
        requestId: ctx.requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return jsonErrorWithRequest(
        ctx.requestId,
        'Failed to create assignment',
        500,
        error instanceof Error ? error.message : 'An unexpected error occurred.'
      );
    }
  });
}
