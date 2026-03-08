import { eq, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { isActiveOrgMember, requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import {
  buildMatchAuditFields,
  CANONICAL_MATCH_AUDIT_FIELDS_ENABLED,
  CANONICAL_MATCH_SCORE_VERSION,
} from '@/lib/canonical/repository';
import {
  appendSystemReasonLedger,
  buildCanonicalMatchPersistenceFields,
  ensureMatchReviewState,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment,
} from '@/lib/matching/review-contract';

export const dynamic = 'force-dynamic';

const MatchRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  weights: z.record(z.number()).optional(),
  mode: z.enum(['mission-first', 'skills-first', 'balanced']).optional(),
  k: z.number().int().min(1).max(50).optional().default(20),
  useTwoStage: z.boolean().optional().default(false),
  annLimit: z.number().int().min(1).max(1000).optional().default(500),
});

/**
 * POST /api/mobile/v1/matching/assignment
 *
 * Org-side candidate matching for a given assignment.
 * Requires an active org membership for the assignment org.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = MatchRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid assignment match payload',
        400,
        parsed.error.flatten()
      );
    }

    const { assignmentId, mode, k, useTwoStage, annLimit } = parsed.data;

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
    });

    if (!assignment) {
      return mobileError('not_found', 'Assignment not found', 404);
    }

    const canAccess = await isActiveOrgMember(auth.user.id, assignment.orgId, [
      'owner',
      'admin',
      'member',
      'viewer',
    ]);

    if (!canAccess) {
      return mobileError('forbidden', 'Organization membership required', 403);
    }

    const weights = parsed.data.weights
      ? normalizeWeights(parsed.data.weights)
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
      actorId: auth.user.id,
      actorType: 'user_account',
    });
    const fairnessStatus = normalizeFairnessStatus(fairnessEvaluation.status);

    const matchIdByProfileId = new Map(upserted.map((row) => [row.profileId, row.id]));
    const itemsWithIds = items.map((item, index) => ({
      ...item,
      matchId: matchIdByProfileId.get(item.profileId) ?? null,
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: getVisibleIdentityFields('blind'),
      fairness: {
        status: fairnessStatus,
      },
      rankBand: getRankBand(index + 1, items.length),
    }));

    return mobileSuccess({
      items: itemsWithIds,
      count: itemsWithIds.length,
      meta: {
        ...meta,
        fairness: {
          status: fairnessStatus,
          evaluationId: fairnessEvaluation.id,
        },
      },
    });
  } catch (error) {
    console.error('[mobile.matching.assignment.post] failed', error);
    return mobileError('internal_error', 'Failed to compute assignment matches', 500);
  }
}
