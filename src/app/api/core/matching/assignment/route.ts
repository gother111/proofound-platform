import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches, organizationMembers } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import { log } from '@/lib/log';
import {
  buildMatchAuditFields,
  CANONICAL_MATCH_AUDIT_FIELDS_ENABLED,
  CANONICAL_MATCH_SCORE_VERSION,
} from '@/lib/canonical/repository';
import {
  appendSystemReasonLedger,
  buildCanonicalMatchPersistenceFields,
  canMutateReview,
  ensureMatchReviewState,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment,
} from '@/lib/matching/review-contract';

export const dynamic = 'force-dynamic';

// Validation schema
const MatchRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().positive().max(100).optional(), // Top k results
  useTwoStage: z.boolean().optional(), // Enable two-stage matching (ANN + re-rank)
  annLimit: z.number().positive().max(1000).optional(), // Stage-1 ANN retrieval limit
});

/**
 * POST /api/match/assignment
 *
 * Computes matches for an assignment.
 * Returns top k matching profiles (blind-first, PII scrubbed).
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    const validatedData = MatchRequestSchema.parse(body);
    const { assignmentId, mode, k = 20, useTwoStage = false, annLimit = 500 } = validatedData;

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const membership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.orgId, assignment.orgId),
        eq(organizationMembers.status, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const weights = validatedData.weights
      ? normalizeWeights(validatedData.weights)
      : mode
        ? getPreset(mode as PresetKey)
        : getPreset('balanced');

    const { items, meta } = await computeAssignmentMatches({
      assignmentId,
      assignment,
      weights,
      k,
      useTwoStage,
      annLimit,
      startTime,
    });

    const upserted = await Promise.all(
      items.map(async (item) => {
        const vectorPayload = {
          subscores: item.subscores,
          contributions: item.contributions,
          gaps: item.gaps,
          missing: item.missing,
          weights,
          pac: item.pac,
        };
        const auditFields = buildMatchAuditFields({
          scoreVersion: CANONICAL_MATCH_SCORE_VERSION,
          assignmentId,
          profileId: item.profileId,
          weights,
          subscores: item.subscores,
          missing: item.missing,
          gaps: item.gaps,
          verificationGates: assignment.verificationGates || [],
        });
        const persistenceFields = buildCanonicalMatchPersistenceFields({
          scoreVersion: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.scoreVersion : null,
          inputsHash: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.inputsHash : null,
          reasonCodes: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.reasonCodes : [],
          generatedAt: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.generatedAt : null,
        });

        const [row] = await db
          .insert(matches)
          .values({
            assignmentId,
            profileId: item.profileId,
            score: item.score.toString(),
            ...persistenceFields,
            vector: vectorPayload,
            weights,
          })
          .onConflictDoUpdate({
            target: [matches.assignmentId, matches.profileId],
            set: {
              score: item.score.toString(),
              scoreVersion: sql`excluded.score_version`,
              modelVersion: sql`excluded.model_version`,
              explanationVersion: sql`excluded.explanation_version`,
              fairnessCheckVersion: sql`excluded.fairness_check_version`,
              fairnessStatus: sql`excluded.fairness_status`,
              fairnessEvaluatedAt: sql`excluded.fairness_evaluated_at`,
              inputsHash: sql`excluded.inputs_hash`,
              reasonCodes: sql`excluded.reason_codes`,
              generatedAt: sql`excluded.generated_at`,
              vector: vectorPayload,
              weights,
            },
          })
          .returning({
            id: matches.id,
            profileId: matches.profileId,
            assignmentId: matches.assignmentId,
            generatedAt: matches.generatedAt,
            reasonCodes: matches.reasonCodes,
          });

        await ensureMatchReviewState({
          matchId: row.id,
          assignmentId: row.assignmentId,
          profileId: row.profileId,
          orgId: assignment.orgId,
        });

        await appendSystemReasonLedger({
          matchId: row.id,
          assignmentId: row.assignmentId,
          profileId: row.profileId,
          reasonCodes: (row.reasonCodes || []) as Array<
            Parameters<typeof appendSystemReasonLedger>[0]['reasonCodes'][number]
          >,
          createdAt: row.generatedAt,
        });

        return row;
      })
    );

    const fairnessEvaluation = await persistFairnessEvaluationForAssignment({
      assignmentId,
      actorId: user.id,
      actorType: 'user_account',
    });
    const fairnessStatus = normalizeFairnessStatus(fairnessEvaluation.status);
    const canViewExactRank = canMutateReview(membership.role);
    const matchIdByProfileId = new Map(upserted.map((row) => [row.profileId, row.id]));

    return NextResponse.json({
      items: items.map((item, index) => ({
        ...item,
        id: matchIdByProfileId.get(item.profileId) ?? null,
        reviewStage: 'blind_review',
        revealScope: 'blind',
        visibleIdentityFields: getVisibleIdentityFields('blind'),
        fairness: {
          status: fairnessStatus,
        },
        rank: canViewExactRank && fairnessStatus === 'pass' ? index + 1 : null,
        rankBand: getRankBand(index + 1, items.length),
      })),
      meta: {
        ...meta,
        fairness: {
          status: fairnessStatus,
          evaluationId: fairnessEvaluation.id,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('match.assignment.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
