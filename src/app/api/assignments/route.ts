import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches, organizationMembers, organizations } from '@/db/schema';
import { emitAnalyticsEvent } from '@/lib/analytics/events';
import {
  checkAndEmitAssignmentActivation,
  evaluateAssignmentActivationCriteria,
} from '@/lib/assignments/activation';
import { jsonErrorWithRequest, withApiObservability } from '@/lib/api/observability';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { triggerFirstAssignmentSurvey } from '@/lib/surveys/sus-triggers';

export const dynamic = 'force-dynamic';

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

const CreationStatusSchema = z.enum([
  'draft',
  'pipeline_in_progress',
  'pending_review',
  'ready_to_publish',
  'published',
]);

const AssignmentSchema = z.object({
  role: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  creationStatus: CreationStatusSchema.optional(),
  businessValue: z.string().optional(),
  expectedImpact: z.string().optional(),
  organizationSlug: z.string().optional(),
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
  startEarliest: z.string().optional(),
  startLatest: z.string().optional(),
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).optional(),
});

type ResolveOrgResult =
  | { ok: true; orgId: string }
  | { ok: false; status: number; code: string; message: string };

async function resolveOrgForUser(
  userId: string,
  orgSlug?: string | null
): Promise<ResolveOrgResult> {
  if (orgSlug) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, orgSlug),
    });

    if (!org) {
      return {
        ok: false,
        status: 404,
        code: 'org_not_found',
        message: 'Organization not found',
      };
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.orgId, org.id),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return {
        ok: false,
        status: 403,
        code: 'org_access_denied',
        message: 'You do not have access to this organization',
      };
    }

    return { ok: true, orgId: org.id };
  }

  const memberships = await db.query.organizationMembers.findMany({
    where: and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, 'active')),
    limit: 2,
  });

  if (memberships.length === 0) {
    return {
      ok: false,
      status: 403,
      code: 'org_membership_required',
      message: 'You must be a member of an organization to create assignments',
    };
  }

  if (memberships.length > 1) {
    return {
      ok: false,
      status: 409,
      code: 'org_context_required',
      message: 'Multiple organizations found. Provide orgSlug to disambiguate.',
    };
  }

  return { ok: true, orgId: memberships[0].orgId };
}

async function resolveOrgForList(
  userId: string,
  orgSlug?: string | null
): Promise<ResolveOrgResult | { ok: true; orgId: null }> {
  if (orgSlug) {
    return resolveOrgForUser(userId, orgSlug);
  }

  const memberships = await db.query.organizationMembers.findMany({
    where: and(eq(organizationMembers.userId, userId), eq(organizationMembers.status, 'active')),
    limit: 2,
  });

  if (memberships.length === 0) {
    return { ok: true, orgId: null };
  }

  if (memberships.length > 1) {
    return {
      ok: false,
      status: 409,
      code: 'org_context_required',
      message: 'Multiple organizations found. Provide orgSlug to disambiguate.',
    };
  }

  return { ok: true, orgId: memberships[0].orgId };
}

export async function GET(request: NextRequest) {
  return withApiObservability(request, '/api/assignments', async (ctx) => {
    try {
      const user = await requireAuth();
      const searchParams = request.nextUrl.searchParams;
      const orgSlug = searchParams.get('orgSlug');

      const orgResult = await resolveOrgForList(user.id, orgSlug);
      if (!orgResult.ok) {
        return jsonErrorWithRequest(ctx.requestId, orgResult.message, orgResult.status, {
          code: orgResult.code,
        });
      }

      if (!orgResult.orgId) {
        return NextResponse.json({ items: [], hasMore: false });
      }

      const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const statusFilter = searchParams.get('status');

      let query = db
        .select()
        .from(assignments)
        .where(eq(assignments.orgId, orgResult.orgId))
        .$dynamic();

      if (statusFilter && ['draft', 'active', 'paused', 'closed'].includes(statusFilter)) {
        query = query.where(
          and(eq(assignments.orgId, orgResult.orgId), eq(assignments.status, statusFilter as any))
        );
      }

      const orgAssignments = await query
        .orderBy((table: any) => table.createdAt)
        .limit(limit + 1)
        .offset(offset);

      log.info('assignments.list.fetched', {
        requestId: ctx.requestId,
        userId: user.id,
        orgId: orgResult.orgId,
        count: orgAssignments.length,
        limit,
        offset,
        status: statusFilter,
      });

      const hasMore = orgAssignments.length > limit;
      const assignmentsToReturn = hasMore ? orgAssignments.slice(0, limit) : orgAssignments;
      const activeAssignments = assignmentsToReturn.filter(
        (assignment) => assignment.status === 'active'
      );
      const assignmentIds = activeAssignments.map((assignment) => assignment.id);

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

        matchCounts = rows.reduce<Record<string, number>>((acc, row) => {
          acc[row.assignmentId] = row.count;
          return acc;
        }, {});
      }

      const now = Date.now();
      const itemsWithWarnings = await Promise.all(
        assignmentsToReturn.map(async (assignment) => {
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
            } catch (error) {
              log.warn('assignments.ttfqi_warning.emit_failed', {
                requestId: ctx.requestId,
                assignmentId: assignment.id,
                error: error instanceof Error ? error.message : String(error),
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

export async function POST(request: NextRequest) {
  return withApiObservability(request, '/api/assignments', async (ctx) => {
    try {
      const user = await requireAuth();
      const body = await request.json();
      const validatedData = AssignmentSchema.parse(body);

      const orgResult = await resolveOrgForUser(user.id, validatedData.organizationSlug);
      if (!orgResult.ok) {
        return jsonErrorWithRequest(ctx.requestId, orgResult.message, orgResult.status, {
          code: orgResult.code,
        });
      }

      const { organizationSlug: _organizationSlug, ...assignmentFields } = validatedData;
      const assignmentData: typeof assignments.$inferInsert = {
        orgId: orgResult.orgId,
        ...assignmentFields,
      };

      const [newAssignment] = await db.insert(assignments).values(assignmentData).returning();

      log.info('assignment.created', {
        assignmentId: newAssignment.id,
        orgId: orgResult.orgId,
        role: newAssignment.role,
      });

      try {
        const existingAssignments = await db
          .select({ id: assignments.id })
          .from(assignments)
          .where(eq(assignments.orgId, orgResult.orgId))
          .limit(2);

        if (existingAssignments.length === 1) {
          await triggerFirstAssignmentSurvey(user.id);
        }
      } catch (error) {
        log.error('sus_survey.first_assignment_check_failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: user.id,
          orgId: orgResult.orgId,
        });
      }

      if (newAssignment.status === 'active') {
        const evaluation = evaluateAssignmentActivationCriteria(newAssignment);
        if (evaluation.canActivate) {
          await checkAndEmitAssignmentActivation({
            assignmentId: newAssignment.id,
            orgId: orgResult.orgId,
            createdAt: newAssignment.createdAt,
            userId: user.id,
          });
        }
      }

      return NextResponse.json({ assignment: newAssignment }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        log.error('assignment.validation.failed', { errors: error.errors });
        return jsonErrorWithRequest(ctx.requestId, 'Invalid input', 400, {
          details: error.errors,
          message:
            'Some required fields are missing or invalid. Please review your assignment details.',
        });
      }

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
