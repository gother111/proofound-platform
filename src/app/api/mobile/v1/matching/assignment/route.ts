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
  appendSystemReasonLedger,
  buildVisibilitySafeWhy,
  buildCanonicalMatchPersistenceFields,
  ensureMatchReviewState,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment,
  resolveCanonicalCorridor,
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
      'org_owner',
      'org_manager',
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
        const persistenceFields = buildCanonicalMatchPersistenceFields({
          artifact: item.artifact,
        });
        const vectorPayload = {
          hidden: false,
        };

        const [row] = await db
          .insert(matches)
          .values({
            assignmentId,
            profileId: item.profileId,
            ...persistenceFields,
            vector: vectorPayload,
            weights,
          })
          .onConflictDoUpdate({
            target: [matches.assignmentId, matches.profileId],
            set: {
              ...persistenceFields,
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
      profileId: item.profileId,
      score: item.score,
      scoreTotal: item.scoreTotal,
      subscoresJson: item.subscoresJson,
      scoreSnapshotJson: item.scoreSnapshotJson,
      reasonCodes: item.reasonCodes,
      profile: item.profile,
      matchId: matchIdByProfileId.get(item.profileId) ?? null,
      reviewStage: 'blind_review',
      revealScope: 'blind',
      visibleIdentityFields: getVisibleIdentityFields('blind'),
      ...resolveCanonicalCorridor({
        reviewStage: 'blind_review',
        revealScope: 'blind',
        surface: 'assignment_card',
        fairnessStatus,
        operationalFallbackMode: fairnessStatus === 'pass' ? null : 'fairness_suppressed_ranking',
      }),
      fairness: {
        status: fairnessStatus,
      },
      rankBand: getRankBand(index + 1, items.length),
      why: buildVisibilitySafeWhy({
        reasonCodes: item.reasonCodes,
        fairnessStatus,
        fallbackState: fairnessStatus === 'pass' ? null : 'fairness_suppressed_ranking',
        rankBand: getRankBand(index + 1, items.length),
      }),
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
