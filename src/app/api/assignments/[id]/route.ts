import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import {
  assignmentExpertiseMatrix,
  assignmentOutcomes,
  assignments,
  canonicalEngagementTypeValues,
} from '@/db/schema';
import {
  buildMatrixRowsFromRequirements,
  deriveRequirementsFromMatrix,
} from '@/lib/assignments/expertise-matrix';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';
import {
  verifyExplicitAssignmentAccess,
  verifyExplicitAssignmentMutationAccess,
} from '@/lib/assignments/access';
import { requireApiAuthContext } from '@/lib/auth';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { ensureOrganizationPrincipal, PrincipalContextSchema } from '@/lib/authz';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import {
  buildVisualAssignmentDetailResponse,
  buildVisualAssignmentMutationResponse,
  getVisualAssignmentFixtureById,
  visualAssignmentFixturesEnabled,
} from '@/lib/assignments/visual-fixtures';

export const dynamic = 'force-dynamic';

const AssignmentStatusUpdateSchema = z
  .enum(['draft', 'active', 'hold', 'paused', 'closed'])
  .transform((value) => (value === 'paused' ? 'hold' : value));
const AssignmentCreationStatusSchema = z
  .enum(['draft', 'assignment_ready', 'review_ready', 'pending_review'])
  .transform((value) => (value === 'pending_review' ? 'review_ready' : value));

const EngagementTypeSchema = z.enum(canonicalEngagementTypeValues);
const OptionalDateStringSchema = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().optional());
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

function buildAssignmentResponse(
  assignment: typeof assignments.$inferSelect,
  input: {
    outcomes: Array<{ id: string; metric: string; target: string; timeframe: string }>;
    requiredSkills: unknown[];
    niceToHaveSkills: unknown[];
  }
) {
  const weights = (assignment.weights as Record<string, number> | null) || {};

  return {
    id: assignment.id,
    orgId: assignment.orgId,
    title: assignment.role,
    role: assignment.role,
    engagementType: assignment.engagementType,
    rolePurpose: assignment.businessValue ?? '',
    businessValue: assignment.businessValue ?? '',
    workSummary: assignment.description ?? '',
    description: assignment.description ?? '',
    proofExpectations: assignment.expectedImpact ?? '',
    expectedImpact: assignment.expectedImpact ?? '',
    expectedOutcomes: input.outcomes,
    outcomes: input.outcomes,
    missionWeight: weights.mission ?? 33,
    expertiseWeight: weights.expertise ?? 34,
    workModeWeight: weights.workMode ?? 33,
    compensationMin: assignment.compMin,
    compensationMax: assignment.compMax,
    compMin: assignment.compMin,
    compMax: assignment.compMax,
    currency: assignment.currency,
    hoursMin: assignment.hoursMin,
    hoursMax: assignment.hoursMax,
    locationMode: assignment.locationMode,
    city: assignment.city,
    country: assignment.country,
    startEarliest: assignment.startEarliest,
    startLatest: assignment.startLatest,
    practicalConstraints: {
      locationMode: assignment.locationMode,
      city: assignment.city,
      country: assignment.country,
      compMin: assignment.compMin,
      compMax: assignment.compMax,
      currency: assignment.currency,
      hoursMin: assignment.hoursMin,
      hoursMax: assignment.hoursMax,
      startEarliest: assignment.startEarliest,
      startLatest: assignment.startLatest,
    },
    weights,
    location: assignment.locationMode || assignment.city || assignment.country || '',
    mustHaveSkills: input.requiredSkills,
    requiredSkills: input.requiredSkills,
    niceToHaveSkills: input.niceToHaveSkills,
    verificationGates: assignment.verificationGates || [],
    status: assignment.status,
    creationStatus: assignment.creationStatus,
    builderMode: assignment.builderMode || 'basic',
  };
}

/**
 * GET /api/assignments/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    const orgId = request.nextUrl.searchParams.get('orgId');
    const orgSlug = request.nextUrl.searchParams.get('orgSlug');
    const access = await verifyExplicitAssignmentAccess(user.id, assignmentId, {
      orgId,
      orgSlug,
    });
    if (access.status === 'missing_org_context') {
      return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
    }
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (visualAssignmentFixturesEnabled() && access.orgId) {
      const visualAssignment = getVisualAssignmentFixtureById(assignmentId, access.orgId);
      if (visualAssignment) {
        return NextResponse.json({
          assignment: buildVisualAssignmentDetailResponse(visualAssignment),
        });
      }
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const outcomesRows = await db.query.assignmentOutcomes.findMany({
      where: eq(assignmentOutcomes.assignmentId, assignmentId),
      orderBy: (t, { asc }) => [asc(t.createdAt)],
    });
    const matrixRows = await db.query.assignmentExpertiseMatrix.findMany({
      where: eq(assignmentExpertiseMatrix.assignmentId, assignmentId),
    });
    const derivedRequirements =
      matrixRows.length > 0
        ? deriveRequirementsFromMatrix(
            matrixRows.map((row) => ({
              skillCode: row.skillCode,
              requiredLevel: row.requiredLevel,
              stakeholderRole: row.stakeholderRole,
            }))
          )
        : null;

    const normalizedOutcomes = outcomesRows.map((outcome) => {
      const firstMetric = Array.isArray(outcome.metrics) ? outcome.metrics[0] : null;
      const timeframeMatch = outcome.description?.match(/in ([^.]*)$/i);
      return {
        id: outcome.id,
        metric: firstMetric?.name || outcome.title,
        target: firstMetric?.target || '',
        timeframe: timeframeMatch?.[1] || '',
      };
    });

    return NextResponse.json({
      assignment: buildAssignmentResponse(assignment, {
        outcomes: normalizedOutcomes,
        requiredSkills:
          derivedRequirements?.mustHaveSkills ?? ((assignment.mustHaveSkills as any) || []),
        niceToHaveSkills:
          derivedRequirements?.niceToHaveSkills ?? ((assignment.niceToHaveSkills as any) || []),
      }),
    });
  } catch (error) {
    log.error('assignment.get.failed', {
      assignmentId,
      error: sanitizeErrorForLog(error),
    });
    return safeApiErrorResponse({
      event: 'assignment.get.response_failed',
      error,
      status: 500,
      publicMessage: 'Failed to fetch assignment',
      context: { assignmentId },
    });
  }
}

const AssignmentUpdateSchema = z.object({
  principalContext: PrincipalContextSchema.optional(),
  orgId: z.string().uuid().optional(),
  orgSlug: z.string().min(1).optional(),
  builderMode: z.enum(['basic', 'advanced']).optional(),
  title: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  engagementType: EngagementTypeSchema.optional(),
  rolePurpose: z.string().optional(),
  description: z.string().optional(),
  businessValue: z.string().optional(),
  proofExpectations: z.string().optional(),
  expectedImpact: z.string().optional(),
  expectedOutcomes: z.array(z.any()).optional(),
  status: AssignmentStatusUpdateSchema.optional(),
  creationStatus: AssignmentCreationStatusSchema.optional(),
  valuesRequired: z.array(z.string()).optional(),
  causeTags: z.array(z.string()).optional(),
  mustHaveSkills: z.array(SkillRequirementSchema).optional(),
  niceToHaveSkills: z.array(SkillRequirementSchema).optional(),
  minLanguage: z
    .object({
      code: z.string(),
      level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    })
    .optional(),
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
  startEarliest: OptionalDateStringSchema,
  startLatest: OptionalDateStringSchema,
  verificationGates: z.array(z.string()).optional(),
  weights: z.record(z.number()).nullable().optional(),
});

/**
 * PUT /api/assignments/[id]
 *
 * Updates an assignment.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let assignmentId: string | undefined;

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const validatedData = AssignmentUpdateSchema.parse(body);

    const principal = validatedData.principalContext
      ? ensureOrganizationPrincipal(validatedData.principalContext)
      : null;
    if (validatedData.principalContext && (!principal || !principal.ok)) {
      const principalError =
        principal && 'error' in principal ? principal.error : 'Invalid organization principal';
      return NextResponse.json({ error: principalError }, { status: 403 });
    }

    const access = await verifyExplicitAssignmentMutationAccess(user.id, assignmentId, {
      orgId: principal?.ok ? principal.context.orgId : validatedData.orgId,
      orgSlug: validatedData.orgSlug,
    });
    if (access.status === 'missing_org_context') {
      return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
    }
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json(
        {
          error: 'Forbidden. Organization manager or owner role is required to update assignments.',
        },
        { status: 403 }
      );
    }
    const targetAssignmentId = assignmentId;

    if (!targetAssignmentId) {
      return NextResponse.json({ error: 'Invalid assignment id' }, { status: 400 });
    }

    if (visualAssignmentFixturesEnabled() && access.orgId) {
      const visualAssignment = getVisualAssignmentFixtureById(targetAssignmentId, access.orgId);
      if (visualAssignment) {
        return NextResponse.json({
          assignment: buildVisualAssignmentMutationResponse(
            targetAssignmentId,
            access.orgId,
            validatedData
          ),
        });
      }
    }

    const shouldSyncMatrix =
      validatedData.mustHaveSkills !== undefined || validatedData.niceToHaveSkills !== undefined;
    const matrixRows = shouldSyncMatrix
      ? buildMatrixRowsFromRequirements(
          targetAssignmentId,
          validatedData.mustHaveSkills || [],
          validatedData.niceToHaveSkills || []
        )
      : [];
    const derivedRequirements = shouldSyncMatrix ? deriveRequirementsFromMatrix(matrixRows) : null;

    const {
      principalContext: _principalContext,
      orgId: _orgId,
      orgSlug: _orgSlug,
      title: _title,
      rolePurpose: _rolePurpose,
      proofExpectations: _proofExpectations,
      practicalConstraints: _practicalConstraints,
      expectedOutcomes: _expectedOutcomes,
      ...updatePayload
    } = validatedData;
    const practicalConstraints = validatedData.practicalConstraints ?? {};
    const updateData = {
      ...updatePayload,
      role: validatedData.title ?? validatedData.role,
      engagementType: validatedData.engagementType,
      businessValue: validatedData.rolePurpose ?? validatedData.businessValue,
      expectedImpact: validatedData.proofExpectations ?? validatedData.expectedImpact,
      ...practicalConstraints,
      status: updatePayload.status,
      ...(derivedRequirements
        ? {
            mustHaveSkills: derivedRequirements.mustHaveSkills,
            niceToHaveSkills: derivedRequirements.niceToHaveSkills,
          }
        : {}),
      startEarliest: validatedData.startEarliest,
      startLatest: validatedData.startLatest,
      updatedAt: new Date(),
    };

    const updatedAssignment = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(assignments)
        .set(updateData)
        .where(eq(assignments.id, targetAssignmentId))
        .returning();

      if (shouldSyncMatrix) {
        await tx
          .delete(assignmentExpertiseMatrix)
          .where(eq(assignmentExpertiseMatrix.assignmentId, targetAssignmentId));

        if (matrixRows.length > 0) {
          await tx.insert(assignmentExpertiseMatrix).values(
            matrixRows.map((row) => ({
              assignmentId: targetAssignmentId,
              skillCode: row.skillCode,
              requiredLevel: row.requiredLevel,
              stakeholderRole: row.stakeholderRole,
              linkedOutcomeId: row.linkedOutcomeId ?? null,
              outcomeRationale: row.outcomeRationale ?? null,
            }))
          );
        }
      }

      return updated;
    });

    log.info('assignment.updated', {
      assignmentId,
      userId: user.id,
      principalType: principal?.ok ? principal.context.principalType : 'organization',
      orgId: access.orgId,
      membershipId: access.membershipId,
    });

    if (validatedData.status === 'active' || updatedAssignment.status === 'active') {
      await checkAndEmitAssignmentActivation({
        assignmentId,
        orgId: updatedAssignment.orgId,
        createdAt: updatedAssignment.createdAt,
        userId: user.id,
      });
    }

    return NextResponse.json({
      assignment: buildAssignmentResponse(updatedAssignment, {
        outcomes: [],
        requiredSkills:
          derivedRequirements?.mustHaveSkills ?? ((updatedAssignment.mustHaveSkills as any) || []),
        niceToHaveSkills:
          derivedRequirements?.niceToHaveSkills ??
          ((updatedAssignment.niceToHaveSkills as any) || []),
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: 'Invalid input',
      });
    }

    return safeApiErrorResponse({
      event: 'assignment.update.failed',
      error,
      status: 500,
      publicMessage: 'Failed to update assignment',
      context: { assignmentId },
    });
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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const resolvedParams = await params;
    assignmentId = resolvedParams.id;

    let principalPayload: unknown = null;
    try {
      principalPayload = await request.json();
    } catch {
      principalPayload = null;
    }

    const principal = ensureOrganizationPrincipal(
      principalPayload && typeof principalPayload === 'object'
        ? (principalPayload as Record<string, unknown>).principalContext
        : null
    );
    if (!principal.ok) {
      return NextResponse.json({ error: principal.error }, { status: 403 });
    }

    const access = await verifyExplicitAssignmentMutationAccess(user.id, assignmentId, {
      orgId: principal.context.orgId,
    });
    if (access.status === 'missing_org_context') {
      return NextResponse.json({ error: 'Organization context is required' }, { status: 400 });
    }
    if (access.status === 'assignment_not_found' || access.status === 'membership_not_found') {
      return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 });
    }
    if (access.status === 'insufficient_role') {
      return NextResponse.json(
        {
          error: 'Forbidden. Organization manager or owner role is required to delete assignments.',
        },
        { status: 403 }
      );
    }

    await db.delete(assignments).where(eq(assignments.id, assignmentId));

    log.info('assignment.deleted', {
      assignmentId,
      userId: user.id,
      principalType: principal.context.principalType,
      orgId: access.orgId,
      membershipId: access.membershipId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'assignment.delete.failed',
      error,
      status: 500,
      publicMessage: 'Failed to delete assignment',
      context: { assignmentId },
    });
  }
}
