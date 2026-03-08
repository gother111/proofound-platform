import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { assignmentExpertiseMatrix, assignments, matches, skillsTaxonomy } from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { jsonErrorWithRequest, withApiObservability } from '@/lib/api/observability';
import { emitAnalyticsEvent } from '@/lib/analytics/events';
import { ASSIGNMENT_MUTATION_ROLES, resolveUserOrgContext } from '@/lib/assignments/access';
import {
  checkAndEmitAssignmentActivation,
  evaluateAssignmentActivationCriteria,
} from '@/lib/assignments/activation';
import {
  buildMatrixRowsFromRequirements,
  deriveRequirementsFromMatrix,
} from '@/lib/assignments/expertise-matrix';
import { triggerFirstAssignmentSurvey } from '@/lib/surveys/sus-triggers';
import { AssignmentStatusSchema } from '@/lib/contracts/domain';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';

export const dynamic = 'force-dynamic';

// Validation schemas
const SkillRequirementSchema = z.object({
  id: z.string(),
  level: z.number().min(0).max(5),
  label: z.string().optional(),
  catId: z.number().optional(),
  subcatId: z.number().optional(),
  l3Id: z.number().optional(),
  l1Label: z.string().optional(),
  l2Label: z.string().optional(),
  l3Label: z.string().optional(),
  linkedToBV: z.boolean().optional(),
  linkedToTO: z.boolean().optional(),
});

const LanguageRequirementSchema = z.object({
  code: z.string(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
});

const AssignmentSchema = z.object({
  builderMode: z.enum(['basic', 'advanced']).optional(),
  role: z.string().min(1),
  description: z.string().optional(),
  businessValue: z.string().optional(),
  expectedImpact: z.string().optional(),
  creationStatus: z
    .enum(['draft', 'pipeline_in_progress', 'pending_review', 'ready_to_publish', 'published'])
    .optional(),
  status: AssignmentStatusSchema.optional(),
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

const AssignmentCreateSchema = AssignmentSchema.extend({
  orgId: z.string().uuid().optional(),
  orgSlug: z.string().min(1).optional(),
}).superRefine((value, ctx) => {
  if (!value.orgId && !value.orgSlug) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Organization context is required',
      path: ['orgId'],
    });
  }
});

/**
 * GET /api/assignments
 *
 * Returns assignments for the current user's organization with pagination.
 * Query params:
 * - limit: Number of items to return (default: 20, max: 100)
 * - offset: Number of items to skip (default: 0)
 * - status: Filter by status (draft, active, hold, closed)
 */

export async function GET(request: NextRequest) {
  return withApiObservability(request, '/api/assignments', async (ctx) => {
    try {
      const authContext = await requireApiAuthContext();
      if (!authContext) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { user } = authContext;

      const searchParams = request.nextUrl.searchParams;
      const orgIdFilter = searchParams.get('orgId');
      const orgSlugFilter = searchParams.get('orgSlug');
      const orgId = await resolveUserOrgContext(user.id, {
        orgId: orgIdFilter,
        orgSlug: orgSlugFilter,
      });

      if (!orgId) {
        log.info('assignments.list.no_org', { requestId: ctx.requestId, userId: user.id });
        return NextResponse.json({ items: [], hasMore: false });
      }

      // Get pagination parameters
      const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const statusFilter = searchParams.get('status');

      // Build query
      let query = db.select().from(assignments).where(eq(assignments.orgId, orgId)).$dynamic();

      // Add status filter if provided
      const normalizedStatusFilter = statusFilter === 'paused' ? 'hold' : statusFilter;
      if (
        normalizedStatusFilter &&
        ['draft', 'active', 'hold', 'closed'].includes(normalizedStatusFilter)
      ) {
        query = query.where(
          and(eq(assignments.orgId, orgId), eq(assignments.status, normalizedStatusFilter as any))
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
        status: normalizedStatusFilter ?? statusFilter,
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
      const authContext = await requireApiAuthContext();
      if (!authContext) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { user } = authContext;

      const body = await request.json();

      // Validate input
      const validatedData = AssignmentCreateSchema.parse(body);
      const orgId = await resolveUserOrgContext(
        user.id,
        {
          orgId: validatedData.orgId,
          orgSlug: validatedData.orgSlug,
        },
        ASSIGNMENT_MUTATION_ROLES
      );

      if (!orgId) {
        return jsonErrorWithRequest(
          ctx.requestId,
          'Organization not found or access denied',
          403,
          'Only organization owner/admin members can create assignments.'
        );
      }

      // Convert date strings to Date objects
      const matrixTemplateRows = buildMatrixRowsFromRequirements(
        'pending',
        validatedData.mustHaveSkills || [],
        validatedData.niceToHaveSkills || []
      );
      const matrixSkillCodes = Array.from(
        new Set(
          matrixTemplateRows
            .map((row) => row.skillCode)
            .filter((skillCode): skillCode is string => Boolean(skillCode))
        )
      );
      let matrixRowsForInsert = matrixTemplateRows;

      if (matrixSkillCodes.length > 0) {
        const taxonomyRows = await db
          .select({ code: skillsTaxonomy.code })
          .from(skillsTaxonomy)
          .where(inArray(skillsTaxonomy.code, matrixSkillCodes));

        const knownSkillCodes = new Set(taxonomyRows.map((row) => row.code));
        const unknownSkillCodes = matrixSkillCodes.filter(
          (skillCode) => !knownSkillCodes.has(skillCode)
        );

        if (unknownSkillCodes.length > 0) {
          log.warn('assignment.create.unknown_matrix_skills', {
            requestId: ctx.requestId,
            userId: user.id,
            orgId,
            unknownSkillCodes,
          });
        }

        matrixRowsForInsert = matrixTemplateRows.filter((row) =>
          knownSkillCodes.has(row.skillCode)
        );
      }

      const derivedRequirements = deriveRequirementsFromMatrix(matrixTemplateRows);

      const assignmentData = {
        orgId,
        ...validatedData,
        builderMode: (await isFeatureEnabled(
          FEATURE_FLAG_KEYS.ASSIGNMENT_BASIC_MODE,
          { userId: user.id, orgId },
          true
        ))
          ? (validatedData.builderMode ?? 'basic')
          : 'advanced',
        mustHaveSkills: derivedRequirements.mustHaveSkills,
        niceToHaveSkills: derivedRequirements.niceToHaveSkills,
        startEarliest: validatedData.startEarliest,
        startLatest: validatedData.startLatest,
      };

      const newAssignment = await db.transaction(async (tx) => {
        const [insertedAssignment] = await tx
          .insert(assignments)
          .values(assignmentData)
          .returning();

        if (matrixRowsForInsert.length > 0) {
          await tx.insert(assignmentExpertiseMatrix).values(
            matrixRowsForInsert.map((row) => ({
              assignmentId: insertedAssignment.id,
              skillCode: row.skillCode,
              requiredLevel: row.requiredLevel,
              stakeholderRole: row.stakeholderRole,
              linkedOutcomeId: row.linkedOutcomeId ?? null,
              outcomeRationale: row.outcomeRationale ?? null,
            }))
          );
        }

        return insertedAssignment;
      });

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
        const evaluation = evaluateAssignmentActivationCriteria(newAssignment);
        if (evaluation.canActivate) {
          await checkAndEmitAssignmentActivation({
            assignmentId: newAssignment.id,
            orgId,
            createdAt: newAssignment.createdAt,
            userId: user.id,
          });
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
