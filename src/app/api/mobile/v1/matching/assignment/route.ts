import { eq } from 'drizzle-orm';
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

        const [row] = await db
          .insert(matches)
          .values({
            assignmentId,
            profileId: item.profileId,
            score: item.score.toString(),
            scoreVersion: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.scoreVersion : null,
            inputsHash: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.inputsHash : null,
            reasonCodes: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.reasonCodes : [],
            generatedAt: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.generatedAt : null,
            vector: vectorPayload,
            weights,
          })
          .onConflictDoUpdate({
            target: [matches.assignmentId, matches.profileId],
            set: {
              score: item.score.toString(),
              scoreVersion: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.scoreVersion : null,
              inputsHash: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.inputsHash : null,
              reasonCodes: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.reasonCodes : [],
              generatedAt: CANONICAL_MATCH_AUDIT_FIELDS_ENABLED ? auditFields.generatedAt : null,
              vector: vectorPayload,
              weights,
            },
          })
          .returning({ id: matches.id, profileId: matches.profileId });

        return row;
      })
    );

    const matchIdByProfileId = new Map(upserted.map((row) => [row.profileId, row.id]));
    const itemsWithIds = items.map((item) => ({
      ...item,
      matchId: matchIdByProfileId.get(item.profileId) ?? null,
    }));

    return mobileSuccess({ items: itemsWithIds, count: itemsWithIds.length, meta });
  } catch (error) {
    console.error('[mobile.matching.assignment.post] failed', error);
    return mobileError('internal_error', 'Failed to compute assignment matches', 500);
  }
}
