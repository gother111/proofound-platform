import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { isActiveOrgMember, requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import {
  buildFairnessUiContract,
  getReasonLedgerEntries,
  normalizeFairnessStatus,
  renderExplanationFromReasonCodes,
} from '@/lib/matching/review-contract';
import { resolveEffectiveScoreState } from '@/lib/matching/match-score-contract';

export const dynamic = 'force-dynamic';

function parseJsonObject(value: unknown) {
  if (!value) {
    return {};
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value as Record<string, unknown>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const { matchId } = await params;
    const [row] = await db
      .select({
        id: matches.id,
        profileId: matches.profileId,
        assignmentId: matches.assignmentId,
        score: matches.score,
        scoreTotal: matches.scoreTotal,
        scoreState: matches.scoreState,
        scoreVersion: matches.scoreVersion,
        modelVersion: matches.modelVersion,
        explanationVersion: matches.explanationVersion,
        fairnessCheckVersion: matches.fairnessCheckVersion,
        fairnessStatus: matches.fairnessStatus,
        fairnessEvaluatedAt: matches.fairnessEvaluatedAt,
        inputsHash: matches.inputsHash,
        reasonCodes: matches.reasonCodes,
        generatedAt: matches.generatedAt,
        staleAt: matches.staleAt,
        subscoresJson: matches.subscoresJson,
        scoreSnapshotJson: matches.scoreSnapshotJson,
        assignmentOrgId: assignments.orgId,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .where(eq(matches.id, matchId))
      .limit(1);

    if (!row) {
      return mobileError('not_found', 'Match not found', 404);
    }

    const ownMatch = row.profileId === auth.user.id;
    const orgAccess = ownMatch
      ? true
      : await isActiveOrgMember(auth.user.id, row.assignmentOrgId, [
          'org_owner',
          'org_manager',
          'org_reviewer',
        ]);

    if (!ownMatch && !orgAccess) {
      return mobileError('forbidden', 'You do not have access to this match', 403);
    }

    const subscores = parseJsonObject(row.subscoresJson);
    const snapshot = parseJsonObject(row.scoreSnapshotJson);
    const fairnessStatus = normalizeFairnessStatus(row.fairnessStatus);
    const fairnessUi = buildFairnessUiContract(fairnessStatus);
    const ledgerEntries = await getReasonLedgerEntries(row.id);
    const renderedExplanation = renderExplanationFromReasonCodes({
      reasonCodes: row.reasonCodes || [],
      ledgerEntries: ledgerEntries.map((entry) => ({
        category: entry.category,
        reasonCode: entry.reasonCode,
        source: entry.source,
        payloadJson:
          entry.payloadJson && typeof entry.payloadJson === 'object'
            ? (entry.payloadJson as Record<string, unknown>)
            : {},
        createdAt: entry.createdAt,
        noteHash: entry.noteHash,
      })),
      fairnessStatus,
      audience: ownMatch ? 'candidate' : 'org',
    });

    return mobileSuccess({
      matchId: row.id,
      assignmentId: row.assignmentId,
      compositeScore: Number(row.score),
      scoreTotal: row.scoreTotal,
      scoreState: resolveEffectiveScoreState({
        scoreState: row.scoreState,
        generatedAt: row.generatedAt,
        staleAt: row.staleAt,
      }),
      scoreVersion: row.scoreVersion,
      modelVersion: row.modelVersion,
      explanationVersion: row.explanationVersion,
      fairnessCheckVersion: row.fairnessCheckVersion,
      inputsHash: row.inputsHash,
      reasonCodes: row.reasonCodes || [],
      generatedAt: row.generatedAt,
      fairness: {
        status: fairnessStatus,
        evaluatedAt: row.fairnessEvaluatedAt,
        warning: fairnessUi.warning,
      },
      reasonSummary: renderedExplanation.summary,
      reasonSections: renderedExplanation.sections,
      subscores: {
        skills: Number(subscores?.skills_fit ?? 0) / 10000,
        pac: Number(subscores?.purpose_fit ?? 0) / 10000,
        constraints: Number(subscores?.constraints_fit ?? 0) / 10000,
        verification: Number(subscores?.verification_fit ?? 0) / 10000,
        recency: Number(subscores?.proof_fit ?? 0) / 10000,
      },
      weights: (snapshot['component_weights'] as Record<string, number> | undefined) ?? null,
      missing: [],
      gaps: [],
      suggestions: [
        'Add more verified proof to strengthen top skills.',
        'Complete matching preferences for better logistics scoring.',
      ],
    });
  } catch (error) {
    console.error('[mobile.matching.explain.get] failed', error);
    return mobileError('internal_error', 'Failed to load match explanation', 500);
  }
}
