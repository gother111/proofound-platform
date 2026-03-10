import { and, eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches, organizationMembers } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { getPreset, normalizeWeights, type PresetKey } from '@/lib/core/matching/presets';
import { FEATURE_FLAG_KEYS } from '@/lib/featureFlags';
import { resolveFeatureFlags } from '@/lib/feature-flags/server';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';
import { log } from '@/lib/log';
import {
  appendSystemReasonLedger,
  buildVisibilitySafeWhy,
  buildCanonicalMatchPersistenceFields,
  canMutateReview,
  ensureMatchReviewState,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
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
  const trace = startLaunchTrace({
    flow: 'shortlist_generation',
    requestId: request.headers.get('x-request-id'),
    actorType: 'anonymous',
  });

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'shortlist_unauthorized',
        failureClass: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    trace.actorId = user.id;
    trace.actorType = 'organization_member';
    const body = await request.json();

    const validatedData = MatchRequestSchema.parse(body);
    const { assignmentId, mode, k = 20, useTwoStage = false, annLimit = 500 } = validatedData;
    trace.objectRefs.assignmentId = assignmentId;

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

    const membershipRole = normalizeAuthorizedOrgRole(membership.role);
    if (!membershipRole) {
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
      actorId: user.id,
      actorType: 'user_account',
    });
    const fairnessStatus = normalizeFairnessStatus(fairnessEvaluation.status);
    const canViewExactRank = canMutateReview(membershipRole);
    const flags = await resolveFeatureFlags(
      [
        FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR,
        FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE,
        FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS,
        FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK,
      ],
      {
        userId: user.id,
        orgId: assignment.orgId,
        roles: [membership.role],
      },
      true
    );
    const introCorridorLive =
      flags[FEATURE_FLAG_KEYS.QUALIFIED_INTRO_CORRIDOR] &&
      !flags[FEATURE_FLAG_KEYS.KILL_SWITCH_INTROS];
    const exactRankLive =
      flags[FEATURE_FLAG_KEYS.EXACT_RANK_EXPOSURE] &&
      !flags[FEATURE_FLAG_KEYS.KILL_SWITCH_EXACT_RANK];
    const fallbackModes = [
      ...(items.length === 0 ? (['browse_only_low_candidate_supply'] as const) : []),
      ...(!introCorridorLive ? (['intro_hold_insufficient_qualified_intros'] as const) : []),
      ...(!exactRankLive || fairnessStatus !== 'pass'
        ? (['fairness_suppressed_ranking'] as const)
        : []),
    ];
    const primaryFallbackMode = fallbackModes[0] ?? null;
    const canonicalFallbackState = resolveCanonicalFallbackState({
      operationalFallbackMode: primaryFallbackMode,
      fairnessStatus,
    });
    const matchIdByProfileId = new Map(upserted.map((row) => [row.profileId, row.id]));
    const showExactRank = canViewExactRank && fairnessStatus === 'pass' && exactRankLive;

    emitLaunchTrace(trace, {
      outcome: primaryFallbackMode ? 'fallback' : 'success',
      state: primaryFallbackMode ?? 'shortlist_generated',
      details: {
        resultCount: items.length,
        fairnessStatus,
      },
    });

    return NextResponse.json({
      items: items.map((item, index) => ({
        profileId: item.profileId,
        score: item.score,
        scoreTotal: item.scoreTotal,
        subscoresJson: item.subscoresJson,
        scoreSnapshotJson: item.scoreSnapshotJson,
        reasonCodes: item.reasonCodes,
        profile: item.profile,
        id: matchIdByProfileId.get(item.profileId) ?? null,
        reviewStage: 'blind_review',
        revealScope: 'blind',
        visibleIdentityFields: getVisibleIdentityFields('blind'),
        ...resolveCanonicalCorridor({
          reviewStage: 'blind_review',
          revealScope: 'blind',
          surface: 'assignment_card',
          fairnessStatus,
          operationalFallbackMode: primaryFallbackMode,
        }),
        fairness: {
          status: fairnessStatus,
        },
        rank: showExactRank ? index + 1 : null,
        rankBand: getRankBand(index + 1, items.length),
        why: buildVisibilitySafeWhy({
          reasonCodes: item.reasonCodes,
          fairnessStatus,
          fallbackState: canonicalFallbackState,
          rankBand: getRankBand(index + 1, items.length),
        }),
      })),
      meta: {
        ...meta,
        fairness: {
          status: fairnessStatus,
          evaluationId: fairnessEvaluation.id,
        },
        launchFallback: {
          mode: primaryFallbackMode,
          activeModes: fallbackModes,
          introCorridorLive,
          exactRankLive,
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'shortlist_validation_failed',
        failureClass: 'invalid_shortlist_request',
      });
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    log.error('match.assignment.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'shortlist_generation_failed',
      failureClass: error instanceof Error ? error.message : 'shortlist_generation_failed',
    });

    return NextResponse.json({ error: 'Failed to compute matches' }, { status: 500 });
  }
}
