import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import {
  assignmentExpertiseMatrix,
  assignments,
  canonicalEngagementTypeValues,
  matches,
  skillsTaxonomy,
} from '@/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { jsonErrorWithRequest, withApiObservability } from '@/lib/api/observability';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import { emitAnalyticsEvent } from '@/lib/analytics/events';
import { ASSIGNMENT_MUTATION_ROLES, resolveExplicitUserOrgContext } from '@/lib/assignments/access';
import { ensureOrganizationPrincipal, PrincipalContextSchema } from '@/lib/authz';
import {
  checkAndEmitAssignmentActivation,
  evaluateAssignmentActivationCriteria,
} from '@/lib/assignments/activation';
import {
  buildMatrixRowsFromRequirements,
  deriveRequirementsFromMatrix,
} from '@/lib/assignments/expertise-matrix';
import { triggerFirstAssignmentSurvey } from '@/lib/surveys/sus-triggers';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { isMockSupabaseEnabled } from '@/lib/env';

export const dynamic = 'force-dynamic';

const AssignmentStatusInputSchema = z
  .enum(['draft', 'active', 'hold', 'paused', 'closed'])
  .transform((value) => (value === 'paused' ? 'hold' : value));
const AssignmentCreationStatusSchema = z
  .enum(['draft', 'assignment_ready', 'review_ready', 'pending_review'])
  .transform((value) => (value === 'pending_review' ? 'review_ready' : value));

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

const EngagementTypeSchema = z.enum(canonicalEngagementTypeValues);
const OptionalDateStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());

const PracticalConstraintsSchema = z
  .object({
    locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
    radiusKm: z.number().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    compMin: z.number().optional(),
    compMax: z.number().optional(),
    currency: z.string().optional(),
    hoursMin: z.number().optional(),
    hoursMax: z.number().optional(),
    startEarliest: OptionalDateStringSchema,
    startLatest: OptionalDateStringSchema,
  })
  .partial();

const AssignmentBaseSchema = z.object({
  builderMode: z.enum(['basic', 'advanced']).optional(),
  title: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  engagementType: EngagementTypeSchema.optional(),
  rolePurpose: z.string().optional(),
  description: z.string().optional(),
  businessValue: z.string().optional(),
  proofExpectations: z.string().optional(),
  expectedImpact: z.string().optional(),
  creationStatus: AssignmentCreationStatusSchema.optional(),
  status: AssignmentStatusInputSchema.optional(),
  expectedOutcomes: z.array(z.any()).optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z.array(SkillRequirementSchema).optional(),
  niceToHaveSkills: z.array(SkillRequirementSchema).optional(),
  minLanguage: LanguageRequirementSchema.optional(),
  practicalConstraints: PracticalConstraintsSchema.optional(),
  locationMode: z.enum(['remote', 'onsite', 'hybrid']).optional(),
  radiusKm: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  compMin: z.number().optional(),
  compMax: z.number().optional(),
  currency: z.string().optional(),
  hoursMin: z.number().optional(),
  hoursMax: z.number().optional(),
  startEarliest: OptionalDateStringSchema, // ISO date string
  startLatest: OptionalDateStringSchema,
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).nullable().optional(),
});

const AssignmentSchema = AssignmentBaseSchema.superRefine((value, ctx) => {
  if (!value.title && !value.role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Assignment title is required',
      path: ['title'],
    });
  }
});

const AssignmentCreateSchema = AssignmentBaseSchema.extend({
  orgId: z.string().uuid().optional(),
  orgSlug: z.string().min(1).optional(),
  principalContext: PrincipalContextSchema.optional(),
}).superRefine((value, ctx) => {
  if (!value.title && !value.role) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Assignment title is required',
      path: ['title'],
    });
  }
  if (!value.orgId && !value.orgSlug && !value.principalContext?.orgId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Organization context is required',
      path: ['orgId'],
    });
  }
});

async function runAssignmentCreationSideEffects({
  requestId,
  userId,
  orgId,
  assignment,
}: {
  requestId: string;
  userId: string;
  orgId: string;
  assignment: any;
}) {
  try {
    const existingAssignments = await db
      .select({ id: assignments.id })
      .from(assignments)
      .where(eq(assignments.orgId, orgId))
      .limit(2);

    if (existingAssignments.length === 1) {
      await triggerFirstAssignmentSurvey(userId);
    }
  } catch (error) {
    log.error('sus_survey.first_assignment_check_failed', {
      requestId,
      error: sanitizeErrorForLog(error),
      userId,
      orgId,
    });
  }

  try {
    if (assignment.status === 'active') {
      const evaluation = evaluateAssignmentActivationCriteria(assignment);
      if (evaluation.canActivate) {
        await checkAndEmitAssignmentActivation({
          assignmentId: assignment.id,
          orgId,
          createdAt: assignment.createdAt,
          userId,
        });
      }
    }
  } catch (error) {
    log.error('assignment.activation_check_failed', {
      requestId,
      assignmentId: assignment.id,
      error: sanitizeErrorForLog(error),
      userId,
      orgId,
    });
  }
}

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

      if (!orgIdFilter && !orgSlugFilter) {
        return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
      }

      const orgId = await resolveExplicitUserOrgContext(user.id, {
        orgId: orgIdFilter,
        orgSlug: orgSlugFilter,
      });

      if (!orgId) {
        log.info('assignments.list.org_access_denied', {
          requestId: ctx.requestId,
          userId: user.id,
          orgIdProvided: Boolean(orgIdFilter),
          orgSlugProvided: Boolean(orgSlugFilter),
        });
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 403 }
        );
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
      const now = Date.now();
      const staleActiveAssignments = assignmentsToReturn.filter((assignment: any) => {
        if (assignment.status !== 'active') return false;
        const ageHours = (now - new Date(assignment.createdAt).getTime()) / (1000 * 60 * 60);
        return ageHours >= 72;
      });
      const assignmentIds = staleActiveAssignments.map((a: any) => a.id);

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

      const itemsWithWarnings = assignmentsToReturn.map((assignment: any) => {
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
          void emitAnalyticsEvent({
            eventType: 'ttfqi_warning_emitted',
            userId: user.id,
            organizationId: assignment.orgId,
            entityType: 'assignment',
            entityId: assignment.id,
            properties: warn,
          }).catch((e) => {
            log.warn('assignments.ttfqi_warning.emit_failed', {
              requestId: ctx.requestId,
              assignmentId: assignment.id,
              error: sanitizeErrorForLog(e),
            });
          });
        }

        return {
          ...assignment,
          ttfqiWarning: warn,
        };
      });

      return NextResponse.json({
        items: itemsWithWarnings,
        hasMore,
        nextOffset: hasMore ? offset + limit : null,
      });
    } catch (error) {
      log.error('assignments.list.failed', {
        requestId: ctx.requestId,
        error: sanitizeErrorForLog(error),
      });

      return safeApiErrorResponse({
        event: 'assignments.list.response_failed',
        error,
        status: 500,
        requestId: ctx.requestId,
        publicMessage: 'Failed to fetch assignments',
      });
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
    let userId: string | undefined;

    try {
      const authContext = await requireApiAuthContext();
      if (!authContext) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { user } = authContext;
      userId = user.id;

      const body = await request.json();

      // Validate input
      const validatedData = AssignmentCreateSchema.parse(body);

      if (isMockSupabaseEnabled()) {
        const resolvedRole = validatedData.title ?? validatedData.role ?? 'Mock assignment';
        const mockOrgId =
          validatedData.orgId ||
          validatedData.principalContext?.orgId ||
          '99999999-9999-4999-9999-999999999999';
        const now = new Date().toISOString();

        return NextResponse.json(
          {
            assignment: {
              id: '22222222-2222-4222-8222-222222222222',
              orgId: mockOrgId,
              role: resolvedRole,
              title: resolvedRole,
              engagementType: validatedData.engagementType ?? 'full_time',
              businessValue: validatedData.rolePurpose ?? validatedData.businessValue ?? null,
              expectedImpact:
                validatedData.proofExpectations ?? validatedData.expectedImpact ?? null,
              status: validatedData.status ?? 'draft',
              creationStatus: validatedData.creationStatus ?? 'draft',
              builderMode: validatedData.builderMode ?? 'basic',
              mustHaveSkills: validatedData.mustHaveSkills ?? [],
              niceToHaveSkills: validatedData.niceToHaveSkills ?? [],
              createdAt: now,
              updatedAt: now,
            },
          },
          { status: 201 }
        );
      }

      const principal = validatedData.principalContext
        ? ensureOrganizationPrincipal(validatedData.principalContext)
        : null;
      if (validatedData.principalContext && (!principal || !principal.ok)) {
        const principalError =
          principal && 'error' in principal ? principal.error : 'Invalid organization principal';
        return jsonErrorWithRequest(ctx.requestId, principalError, 403);
      }

      const orgId = await resolveExplicitUserOrgContext(
        user.id,
        {
          orgId: principal?.ok ? principal.context.orgId : validatedData.orgId,
          orgSlug: validatedData.orgSlug,
        },
        ASSIGNMENT_MUTATION_ROLES
      );

      if (!orgId) {
        return jsonErrorWithRequest(
          ctx.requestId,
          'Organization not found or access denied',
          403,
          'Only active organization managers or owners can create assignments.'
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
      const {
        principalContext: _principalContext,
        orgSlug: _orgSlug,
        title: _title,
        rolePurpose: _rolePurpose,
        proofExpectations: _proofExpectations,
        practicalConstraints: _practicalConstraints,
        expectedOutcomes: _expectedOutcomes,
        ...assignmentInput
      } = validatedData;
      const practicalConstraints = validatedData.practicalConstraints ?? {};
      const resolvedRole = validatedData.title ?? validatedData.role;

      if (!resolvedRole) {
        return jsonErrorWithRequest(ctx.requestId, 'Assignment title is required', 400);
      }

      const assignmentData = {
        orgId,
        ...assignmentInput,
        role: resolvedRole,
        engagementType: validatedData.engagementType ?? 'full_time',
        businessValue: validatedData.rolePurpose ?? validatedData.businessValue,
        expectedImpact: validatedData.proofExpectations ?? validatedData.expectedImpact,
        ...practicalConstraints,
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
        principalType: principal?.ok ? principal.context.principalType : 'organization',
      });

      const creationSideEffects = runAssignmentCreationSideEffects({
        requestId: ctx.requestId,
        userId: user.id,
        orgId,
        assignment: newAssignment,
      });
      if (process.env.NODE_ENV === 'test') {
        await creationSideEffects;
      } else {
        void creationSideEffects;
      }

      return NextResponse.json({ assignment: newAssignment }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('assignment.validation.failed', {
          errors: error.errors,
        });
        return safeValidationErrorResponse({
          error,
          requestId: ctx.requestId,
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
        return safeApiErrorResponse({
          event: 'assignment.db.connection.failed',
          error,
          status: 503,
          requestId: ctx.requestId,
          publicMessage: 'Unable to save assignment. Please try again later.',
          context: {
            userId,
          },
        });
      }

      return safeApiErrorResponse({
        event: 'assignment.create.failed',
        error,
        status: 500,
        requestId: ctx.requestId,
        publicMessage: 'Failed to create assignment',
        context: {
          userId,
        },
      });
    }
  });
}
