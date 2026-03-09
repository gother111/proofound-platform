import { eq, sql } from 'drizzle-orm';

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { getPreset } from '@/lib/core/matching/presets';
import { log } from '@/lib/log';
import {
  appendSystemReasonLedger,
  buildCanonicalMatchPersistenceFields,
  ensureMatchReviewState,
  persistFairnessEvaluationForAssignment,
} from '@/lib/matching/review-contract';

export async function generateMatchesForAssignment(
  assignmentId: string,
  options: { replaceExisting?: boolean } = {}
): Promise<number> {
  const { replaceExisting = false } = options;

  const assignment = await db.query.assignments.findFirst({
    where: eq(assignments.id, assignmentId),
  });

  if (!assignment) {
    log.error('generate.matches.assignment.not.found', { assignmentId });
    return 0;
  }

  if (replaceExisting) {
    await db.delete(matches).where(eq(matches.assignmentId, assignmentId));
  }

  const weights = (assignment.weights as Record<string, number>) || getPreset('balanced');
  const { items } = await computeAssignmentMatches({
    assignmentId,
    assignment,
    weights,
    k: 100,
    useTwoStage: false,
    annLimit: 100,
  });

  if (items.length === 0) {
    return 0;
  }

  const persisted = await db
    .insert(matches)
    .values(
      items.map((item) => ({
        assignmentId,
        profileId: item.profileId,
        ...buildCanonicalMatchPersistenceFields({
          artifact: item.artifact,
        }),
        vector: { hidden: false },
        weights,
      }))
    )
    .onConflictDoUpdate({
      target: [matches.assignmentId, matches.profileId],
      set: {
        score: sql`excluded.score`,
        scoreTotal: sql`excluded.score_total`,
        scoreState: sql`excluded.score_state`,
        scoreVersion: sql`excluded.score_version`,
        modelVersion: sql`excluded.model_version`,
        explanationVersion: sql`excluded.explanation_version`,
        fairnessCheckVersion: sql`excluded.fairness_check_version`,
        fairnessStatus: sql`excluded.fairness_status`,
        fairnessEvaluatedAt: sql`excluded.fairness_evaluated_at`,
        inputsHash: sql`excluded.inputs_hash`,
        reasonCodes: sql`excluded.reason_codes`,
        staleReasonCodes: sql`excluded.stale_reason_codes`,
        generatedAt: sql`excluded.generated_at`,
        staleAt: sql`excluded.stale_at`,
        recomputedAt: sql`excluded.recomputed_at`,
        hiddenDueToPolicyAt: sql`excluded.hidden_due_to_policy_at`,
        hiddenDueToPolicyReasonCodes: sql`excluded.hidden_due_to_policy_reason_codes`,
        subscoresJson: sql`excluded.subscores_json`,
        scoreSnapshotJson: sql`excluded.score_snapshot_json`,
        vector: sql`excluded.vector`,
        weights: sql`excluded.weights`,
      },
    })
    .returning({
      id: matches.id,
      assignmentId: matches.assignmentId,
      profileId: matches.profileId,
      generatedAt: matches.generatedAt,
      reasonCodes: matches.reasonCodes,
    });

  await Promise.all(
    persisted.map(async (row) => {
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
    })
  );

  await persistFairnessEvaluationForAssignment({
    assignmentId,
    actorType: 'system',
  });

  return persisted.length;
}
