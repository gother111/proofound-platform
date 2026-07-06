import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import {
  assignments,
  matches,
  matchingProfiles,
  matchReviewStates,
  organizationMembers,
} from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { normalizeAuthorizedOrgRole } from '@/lib/authz';
import { scrubDisallowedFields } from '@/lib/core/matching/firewall';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { getPreset, normalizeWeights } from '@/lib/core/matching/presets';
import { FEATURE_FLAG_KEYS, MATCHING_ENABLED } from '@/lib/featureFlags';
import { resolveFeatureFlags } from '@/lib/feature-flags/server';
import { evaluateIntroGate } from '@/lib/matching/intro-gates';
import { describeReasonCodes } from '@/lib/matching/reason-codes';
import { getMatchingVisualState, buildVisualOrgMatches } from '@/lib/matching/visual-fixtures';
import type { DiscoveryStatus, FitBand, IntroGate, MatchReasonDetail } from '@/lib/matching/types';
import {
  VISUAL_ASSIGNMENT_FIXTURE_IDS,
  visualAssignmentFixturesEnabled,
} from '@/lib/assignments/visual-fixtures';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';
import { log } from '@/lib/log';
import {
  appendSystemReasonLedger,
  buildCanonicalMatchPersistenceFields,
  buildProofFirstReviewCard,
  buildVisibilitySafeWhy,
  ensureMatchReviewState,
  getReviewCardProofPackMapForMatchedOrg,
  getRankBand,
  getVisibleIdentityFields,
  normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
} from '@/lib/matching/review-contract';

export const dynamic = 'force-dynamic';

function toVisibilitySafeAssignmentMatchItem<T extends Record<string, unknown>>(item: T) {
  const {
    score: _score,
    scoreTotal: _scoreTotal,
    subscores: _subscores,
    subscoresJson: _subscoresJson,
    scoreSnapshotJson: _scoreSnapshotJson,
    contributions: _contributions,
    focusBoost: _focusBoost,
    ...safeItem
  } = item;

  return safeItem;
}

// Validation schema
const MatchRequestSchema = z.object({
  assignmentId: z.string().uuid(),
  weights: z.record(z.number()).optional(),
  mode: z.string().optional(),
  k: z.number().positive().max(100).optional(), // Top k results
  useTwoStage: z.boolean().optional(), // Enable two-stage matching (ANN + re-rank)
  annLimit: z.number().positive().max(1000).optional(), // Stage-1 ANN retrieval limit
  refresh: z.boolean().optional(), // Force recomputation instead of returning saved matches
});

const DISCOVERY_STATUS_SET = new Set<DiscoveryStatus>([
  'possible_discovery_match',
  'review_ready_match',
  'intro_ready_match',
]);
const FIT_BAND_SET = new Set<FitBand>([
  'strong_evidence_overlap',
  'relevant_partial',
  'adjacent_exploratory',
  'needs_more_proof',
  'constraint_or_trust_hold',
]);

function readSnapshotString(snapshot: unknown, field: string): string | null {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  const value = (snapshot as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : null;
}

function resolveDiscoveryStatus(snapshot: unknown, reasonCodes: string[]): DiscoveryStatus {
  const fromSnapshot = readSnapshotString(snapshot, 'discovery_status');
  if (fromSnapshot && DISCOVERY_STATUS_SET.has(fromSnapshot as DiscoveryStatus)) {
    return fromSnapshot as DiscoveryStatus;
  }

  if (reasonCodes.includes('low_supply_expanded_discovery')) {
    return 'possible_discovery_match';
  }

  if (reasonCodes.some((code) => code.endsWith('_overlap'))) {
    return 'review_ready_match';
  }

  return 'review_ready_match';
}

function resolveFitBand(snapshot: unknown, reasonCodes: string[]): FitBand {
  const fromSnapshot = readSnapshotString(snapshot, 'fit_band');
  if (fromSnapshot && FIT_BAND_SET.has(fromSnapshot as FitBand)) {
    return fromSnapshot as FitBand;
  }

  if (
    reasonCodes.includes('privacy_or_policy_hold') ||
    reasonCodes.includes('constraint_mismatch')
  ) {
    return 'constraint_or_trust_hold';
  }

  if (
    reasonCodes.includes('fresh_proof_missing') ||
    reasonCodes.includes('verification_gate_missing')
  ) {
    return 'needs_more_proof';
  }

  if (
    reasonCodes.includes('adjacent_skill_overlap') ||
    reasonCodes.includes('custom_wording_overlap') ||
    reasonCodes.includes('low_supply_expanded_discovery')
  ) {
    return 'adjacent_exploratory';
  }

  if (
    reasonCodes.includes('canonical_skill_overlap') ||
    reasonCodes.includes('alias_skill_overlap') ||
    reasonCodes.includes('proof_text_overlap') ||
    reasonCodes.includes('role_relevant_outcome')
  ) {
    return 'relevant_partial';
  }

  return 'needs_more_proof';
}

function buildProofSummaries(reviewCard: ReturnType<typeof buildProofFirstReviewCard>) {
  const strongestProof = reviewCard.strongestProof;
  if (!strongestProof) return [];

  return [
    {
      summary: strongestProof.summary ?? null,
      outcome: strongestProof.outcome ?? null,
      ownership: strongestProof.ownership ?? null,
      freshnessLabel: strongestProof.freshnessLabel ?? null,
    },
  ];
}

function buildSkillClusters(reasonDetails: MatchReasonDetail[]) {
  return reasonDetails
    .filter((reason) =>
      [
        'canonical_skill_overlap',
        'alias_skill_overlap',
        'adjacent_skill_overlap',
        'custom_wording_overlap',
      ].includes(reason.code)
    )
    .map((reason) => ({
      reasonCode: reason.code,
      label: reason.code.replace(/_/g, ' '),
      strength: reason.strength,
    }));
}

function buildSafeReviewMetadata(params: {
  reasonCodes: string[];
  scoreSnapshotJson?: unknown;
  reviewCard: ReturnType<typeof buildProofFirstReviewCard>;
  reviewStage: string;
  revealScope: string;
  fallbackState: string | null;
}) {
  const discoveryStatus = resolveDiscoveryStatus(params.scoreSnapshotJson, params.reasonCodes);
  const fitBand = resolveFitBand(params.scoreSnapshotJson, params.reasonCodes);
  const introGate = evaluateIntroGate({
    discoveryStatus,
    candidate: {
      matchVisible: discoveryStatus !== 'possible_discovery_match',
      hasFreshRoleRelevantProof: params.reasonCodes.includes('fresh_proof_present'),
      activeNonSelfTrustAnchorCount: params.reasonCodes.includes('non_self_trust_anchor_present')
        ? 1
        : 0,
    },
    assignment: {
      hardConstraintsSatisfied: !params.reasonCodes.includes('constraint_mismatch'),
    },
    privacy: {
      privacySafeReviewAvailable:
        params.reviewCard.privacy?.reviewState !== 'held_for_manual_review',
      policyBlock: params.reasonCodes.includes('privacy_or_policy_hold'),
      privacyOrRedactionHold: params.reviewCard.privacy?.reviewState === 'held_for_manual_review',
    },
    workflow: {
      matchVisibleForWorkflow:
        params.reviewStage === 'shortlisted' ? params.revealScope === 'shortlist_identity' : true,
      existingWorkflowAllowsIntroRequest: params.fallbackState !== 'intro_hold',
    },
  });
  const canRequestIntro =
    introGate.canRequestIntro &&
    params.reviewStage === 'shortlisted' &&
    params.revealScope === 'shortlist_identity';
  const reasonDetails = describeReasonCodes(params.reasonCodes);
  const supplyState = params.reasonCodes.includes('low_supply_expanded_discovery')
    ? 'browse_only_low_candidate_supply'
    : params.fallbackState === 'intro_hold'
      ? 'intro_hold_insufficient_qualified_intros'
      : null;

  return {
    anonymousCandidateLabel: params.reviewCard.candidateLabel,
    discoveryStatus,
    fitBand,
    introGate: (canRequestIntro ? 'intro_ready' : introGate.introGate) as IntroGate,
    canRequestIntro,
    proofSummaries: buildProofSummaries(params.reviewCard),
    skillClusters: buildSkillClusters(reasonDetails),
    reasonDetails,
    missingGates: canRequestIntro ? [] : introGate.missingGates,
    supplyState,
  };
}

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
    if (!MATCHING_ENABLED) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'matching_disabled',
        failureClass: 'dependency_unavailable',
      });
      return NextResponse.json(
        { error: 'Matching disabled', message: 'Matching is temporarily unavailable.' },
        { status: 503 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'shortlist_validation_failed',
        failureClass: 'invalid_json_body',
      });
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validatedData = MatchRequestSchema.parse(body);
    const { assignmentId, k = 20, annLimit = 500 } = validatedData;
    const useTwoStage = false;
    const refresh = validatedData.refresh === true;
    trace.objectRefs.assignmentId = assignmentId;

    if (visualAssignmentFixturesEnabled() && VISUAL_ASSIGNMENT_FIXTURE_IDS.has(assignmentId)) {
      const visualState = getMatchingVisualState(request.url);
      if (visualState === 'empty') {
        emitLaunchTrace(trace, {
          outcome: 'fallback',
          state: 'browse_only_low_candidate_supply',
          details: {
            resultCount: 0,
            cached: true,
            fixture: true,
          },
        });

        return NextResponse.json({
          items: [],
          meta: {
            total: 0,
            returned: 0,
            durationMs: Date.now() - startTime,
            weights: {},
            twoStage: false,
            hasMissionVisionScores: false,
            cached: true,
            fairness: {
              status: 'not_evaluated',
              evaluationId: null,
            },
            launchFallback: {
              mode: 'browse_only_low_candidate_supply',
              activeModes: ['browse_only_low_candidate_supply'],
              introCorridorLive: null,
              exactRankLive: null,
            },
          },
        });
      }

      // Default: Return the 7 visual mock matches with the same public-safe review
      // contract as live matching results.
      const mockItems = buildVisualOrgMatches(assignmentId).map((item) => {
        const reasonCodes = Array.isArray(item.reasonCodes) ? item.reasonCodes : [];
        const reviewCard = item.reviewCard as ReturnType<typeof buildProofFirstReviewCard>;
        const visualReviewSignals = item.scoreSnapshotJson;
        const safeReview = buildSafeReviewMetadata({
          reasonCodes,
          scoreSnapshotJson: visualReviewSignals,
          reviewCard,
          reviewStage: typeof item.reviewStage === 'string' ? item.reviewStage : 'blind_review',
          revealScope: typeof item.revealScope === 'string' ? item.revealScope : 'blind',
          fallbackState:
            typeof item.operationalFallbackMode === 'string' ? item.operationalFallbackMode : null,
        });

        return toVisibilitySafeAssignmentMatchItem({
          ...item,
          anonymousCandidateLabel: safeReview.anonymousCandidateLabel,
          discoveryStatus: safeReview.discoveryStatus,
          fitBand: safeReview.fitBand,
          introGate: safeReview.introGate,
          canRequestIntro: safeReview.canRequestIntro,
          proofSummaries: safeReview.proofSummaries,
          skillClusters: safeReview.skillClusters,
          reasonDetails: safeReview.reasonDetails,
          missingGates: safeReview.missingGates,
          supplyState: safeReview.supplyState,
        });
      });
      emitLaunchTrace(trace, {
        outcome: 'success',
        state: 'shortlist_generated',
        details: {
          resultCount: mockItems.length,
          cached: true,
          fixture: true,
        },
      });

      return NextResponse.json({
        items: mockItems,
        meta: {
          total: mockItems.length,
          returned: mockItems.length,
          durationMs: Date.now() - startTime,
          weights: {},
          twoStage: false,
          hasMissionVisionScores: false,
          cached: true,
          scoreVisibility: 'internal_ordering_only',
          fairness: {
            status: 'pass',
            evaluationId: 'visual-evaluation-id',
          },
          launchFallback: {
            mode: null,
            activeModes: [],
            introCorridorLive: null,
            exactRankLive: null,
          },
        },
      });
    }

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
        eq(organizationMembers.state, 'active')
      ),
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const membershipRole = normalizeAuthorizedOrgRole(membership.role);
    if (!membershipRole) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!refresh && typeof (db as { select?: unknown }).select === 'function') {
      const existingMatches = await db
        .select({
          id: matches.id,
          profileId: matches.profileId,
          assignmentId: matches.assignmentId,
          score: matches.score,
          scoreTotal: matches.scoreTotal,
          subscoresJson: matches.subscoresJson,
          scoreSnapshotJson: matches.scoreSnapshotJson,
          reasonCodes: matches.reasonCodes,
          generatedAt: matches.generatedAt,
          fairnessStatus: matches.fairnessStatus,
        })
        .from(matches)
        .where(eq(matches.assignmentId, assignmentId))
        .orderBy(desc(matches.scoreTotal), desc(matches.score), desc(matches.createdAt))
        .limit(k);

      if (existingMatches.length > 0) {
        await Promise.all(
          existingMatches.map((row) =>
            ensureMatchReviewState({
              matchId: row.id,
              assignmentId: row.assignmentId,
              profileId: row.profileId,
              orgId: assignment.orgId,
            })
          )
        );

        const matchIds = existingMatches.map((row) => row.id);
        const profileIds = existingMatches.map((row) => row.profileId);
        const [reviewStateRows, profileRows, proofPackByProfileId] = await Promise.all([
          db.query.matchReviewStates.findMany({
            where: inArray(matchReviewStates.matchId, matchIds),
            columns: {
              matchId: true,
              reviewStage: true,
              revealScope: true,
              operationalFallbackMode: true,
            },
          }),
          db.query.matchingProfiles.findMany({
            where: inArray(matchingProfiles.profileId, profileIds),
          }),
          getReviewCardProofPackMapForMatchedOrg(profileIds),
        ]);
        const reviewStateByMatchId = new Map(reviewStateRows.map((row) => [row.matchId, row]));
        const profileById = new Map(profileRows.map((row) => [row.profileId, row]));
        const cachedFairnessStatus = normalizeFairnessStatus(existingMatches[0]?.fairnessStatus);
        const cachedFallbackState = resolveCanonicalFallbackState({
          operationalFallbackMode: null,
          fairnessStatus: cachedFairnessStatus,
        });

        emitLaunchTrace(trace, {
          outcome: 'success',
          state: 'shortlist_generated',
          details: {
            resultCount: existingMatches.length,
            cached: true,
            fairnessStatus: cachedFairnessStatus,
          },
        });

        return NextResponse.json({
          items: existingMatches.map((row, index) => {
            const profile = profileById.get(row.profileId) ?? null;
            const reviewState =
              reviewStateByMatchId.get(row.id) ??
              ({
                reviewStage: 'blind_review',
                revealScope: 'blind',
                operationalFallbackMode: null,
              } as const);
            const fairnessStatus = normalizeFairnessStatus(
              row.fairnessStatus ?? cachedFairnessStatus
            );
            const rankBand = getRankBand(index + 1, existingMatches.length);
            const corridor = resolveCanonicalCorridor({
              reviewStage: reviewState.reviewStage,
              revealScope: reviewState.revealScope,
              surface: 'assignment_card',
              fairnessStatus,
              operationalFallbackMode: reviewState.operationalFallbackMode,
            });
            const verificationCount =
              profile &&
              typeof profile === 'object' &&
              'verified' in profile &&
              profile.verified &&
              typeof profile.verified === 'object'
                ? Object.values(profile.verified as Record<string, unknown>).filter(Boolean).length
                : 0;
            const reasonCodes = (row.reasonCodes || []) as Array<
              Parameters<typeof buildVisibilitySafeWhy>[0]['reasonCodes'][number]
            >;
            const reviewCard = buildProofFirstReviewCard({
              profileId: row.profileId,
              reasonCodes,
              fairnessStatus,
              verificationCount,
              proofPack: proofPackByProfileId.get(row.profileId) ?? null,
              fitBand: rankBand,
            });
            const cachedReviewSignals = row.scoreSnapshotJson;
            const safeReview = buildSafeReviewMetadata({
              reasonCodes,
              scoreSnapshotJson: cachedReviewSignals,
              reviewCard,
              reviewStage: reviewState.reviewStage,
              revealScope: reviewState.revealScope,
              fallbackState: cachedFallbackState,
            });

            return {
              profileId: row.profileId,
              reasonCodes,
              reasonDetails: safeReview.reasonDetails,
              profile: profile ? scrubDisallowedFields(profile) : null,
              id: row.id,
              reviewStage: reviewState.reviewStage,
              revealScope: reviewState.revealScope,
              visibleIdentityFields: getVisibleIdentityFields(reviewState.revealScope),
              anonymousCandidateLabel: safeReview.anonymousCandidateLabel,
              discoveryStatus: safeReview.discoveryStatus,
              fitBand: safeReview.fitBand,
              introGate: safeReview.introGate,
              canRequestIntro: safeReview.canRequestIntro,
              proofSummaries: safeReview.proofSummaries,
              skillClusters: safeReview.skillClusters,
              missingGates: safeReview.missingGates,
              supplyState: safeReview.supplyState,
              ...corridor,
              fairness: {
                status: fairnessStatus,
              },
              rank: null,
              rankBand,
              why: buildVisibilitySafeWhy({
                reasonCodes,
                fairnessStatus,
                fallbackState: cachedFallbackState,
                rankBand,
              }),
              reviewCard,
            };
          }),
          meta: {
            total: existingMatches.length,
            returned: existingMatches.length,
            durationMs: Date.now() - startTime,
            weights: {},
            twoStage: false,
            hasMissionVisionScores: false,
            cached: true,
            scoreVisibility: 'internal_ordering_only',
            fairness: {
              status: cachedFairnessStatus,
              evaluationId: null,
            },
            launchFallback: {
              mode: null,
              activeModes: [],
              introCorridorLive: null,
              exactRankLive: null,
            },
          },
        });
      }
    }

    const weights = validatedData.weights
      ? normalizeWeights(validatedData.weights)
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
    const exactRankLive = false;
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
    const reviewStateRows = upserted.length
      ? await db.query.matchReviewStates.findMany({
          where: sql`${matchReviewStates.matchId} IN (${sql.join(
            upserted.map((row) => sql`${row.id}`),
            sql`, `
          )})`,
          columns: {
            matchId: true,
            reviewStage: true,
            revealScope: true,
            operationalFallbackMode: true,
          },
        })
      : [];
    const reviewStateByMatchId = new Map(reviewStateRows.map((row) => [row.matchId, row]));
    const proofPackByProfileId = await getReviewCardProofPackMapForMatchedOrg(
      items.map((item) => item.profileId)
    );
    emitLaunchTrace(trace, {
      outcome: primaryFallbackMode ? 'fallback' : 'success',
      state: primaryFallbackMode ?? 'shortlist_generated',
      details: {
        resultCount: items.length,
        fairnessStatus,
      },
    });

    return NextResponse.json({
      items: items.map((item, index) => {
        const matchId = matchIdByProfileId.get(item.profileId) ?? null;
        const reviewState =
          (matchId ? reviewStateByMatchId.get(matchId) : null) ??
          ({
            reviewStage: 'blind_review',
            revealScope: 'blind',
            operationalFallbackMode: primaryFallbackMode,
          } as const);
        const rankBand = getRankBand(index + 1, items.length);
        const corridor = resolveCanonicalCorridor({
          reviewStage: reviewState.reviewStage,
          revealScope: reviewState.revealScope,
          surface: 'assignment_card',
          fairnessStatus,
          operationalFallbackMode: reviewState.operationalFallbackMode ?? primaryFallbackMode,
        });
        const verificationCount =
          item.profile &&
          typeof item.profile === 'object' &&
          'verified' in item.profile &&
          item.profile.verified &&
          typeof item.profile.verified === 'object'
            ? Object.values(item.profile.verified as Record<string, unknown>).filter(Boolean).length
            : 0;
        const reviewCard = buildProofFirstReviewCard({
          profileId: item.profileId,
          reasonCodes: item.reasonCodes,
          fairnessStatus,
          verificationCount,
          proofPack: proofPackByProfileId.get(item.profileId) ?? null,
          fitBand: rankBand,
        });
        const computedReviewSignals = item.scoreSnapshotJson;
        const safeReview = buildSafeReviewMetadata({
          reasonCodes: item.reasonCodes,
          scoreSnapshotJson: computedReviewSignals,
          reviewCard,
          reviewStage: reviewState.reviewStage,
          revealScope: reviewState.revealScope,
          fallbackState: canonicalFallbackState,
        });

        return {
          profileId: item.profileId,
          reasonCodes: item.reasonCodes,
          reasonDetails: safeReview.reasonDetails,
          profile: item.profile,
          id: matchId,
          reviewStage: reviewState.reviewStage,
          revealScope: reviewState.revealScope,
          visibleIdentityFields: getVisibleIdentityFields(reviewState.revealScope),
          anonymousCandidateLabel: safeReview.anonymousCandidateLabel,
          discoveryStatus: safeReview.discoveryStatus,
          fitBand: safeReview.fitBand,
          introGate: safeReview.introGate,
          canRequestIntro: safeReview.canRequestIntro,
          proofSummaries: safeReview.proofSummaries,
          skillClusters: safeReview.skillClusters,
          missingGates: safeReview.missingGates,
          supplyState: safeReview.supplyState,
          ...corridor,
          fairness: {
            status: fairnessStatus,
          },
          rank: null,
          rankBand,
          why: buildVisibilitySafeWhy({
            reasonCodes: item.reasonCodes,
            fairnessStatus,
            fallbackState: canonicalFallbackState,
            rankBand,
          }),
          reviewCard,
        };
      }),
      meta: {
        ...meta,
        weights: {},
        scoreVisibility: 'internal_ordering_only',
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
