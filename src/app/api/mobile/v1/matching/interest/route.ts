import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matchInterest, matchReviewStates, matches } from '@/db/schema';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import {
  buildVisibilitySafeWhy,
  normalizeFairnessStatus,
  resolveCanonicalCorridor,
  resolveCanonicalFallbackState,
} from '@/lib/matching/review-contract';

export const dynamic = 'force-dynamic';

const InterestSchema = z.object({
  assignmentId: z.string().uuid(),
  targetProfileId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = InterestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid interest payload',
        400,
        parsed.error.flatten()
      );
    }

    const { assignmentId, targetProfileId } = parsed.data;
    const [assignment] = await db
      .select({
        id: assignments.id,
      })
      .from(assignments)
      .where(eq(assignments.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return mobileError('not_found', 'Assignment not found', 404);
    }

    // Idempotent insert attempt.
    try {
      await db.insert(matchInterest).values({
        actorProfileId: auth.user.id,
        assignmentId,
        targetProfileId: targetProfileId ?? null,
      });
    } catch {
      // Ignore unique conflicts.
    }

    let mutual = false;
    let orgRepresentativeId: string | null = null;

    if (targetProfileId) {
      // Org -> Candidate: mutual when candidate previously expressed interest (targetProfileId is null).
      const reciprocal = await db.query.matchInterest.findFirst({
        where: and(
          eq(matchInterest.actorProfileId, targetProfileId),
          eq(matchInterest.assignmentId, assignmentId),
          isNull(matchInterest.targetProfileId)
        ),
        columns: {
          actorProfileId: true,
        },
      });

      mutual = !!reciprocal;
      orgRepresentativeId = auth.user.id;
    } else {
      // Individual -> Assignment: mutual when any org member expressed interest in this candidate.
      const reciprocal = await db.query.matchInterest.findFirst({
        where: and(
          eq(matchInterest.assignmentId, assignmentId),
          eq(matchInterest.targetProfileId, auth.user.id)
        ),
        columns: {
          actorProfileId: true,
        },
      });

      mutual = !!reciprocal;
      orgRepresentativeId = reciprocal?.actorProfileId ?? null;
    }

    if (!mutual) {
      return mobileSuccess({ revealed: false, mutual: false });
    }

    const profileId = targetProfileId || auth.user.id;
    const [match] = await db
      .select({
        id: matches.id,
        assignmentId: matches.assignmentId,
        profileId: matches.profileId,
        fairnessStatus: matches.fairnessStatus,
        reviewStage: matchReviewStates.reviewStage,
        revealScope: matchReviewStates.revealScope,
        operationalFallbackMode: matchReviewStates.operationalFallbackMode,
      })
      .from(matches)
      .leftJoin(matchReviewStates, eq(matchReviewStates.matchId, matches.id))
      .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, profileId)))
      .limit(1);

    const fairnessStatus = normalizeFairnessStatus(match?.fairnessStatus);
    const fallbackState = resolveCanonicalFallbackState({
      operationalFallbackMode: match?.operationalFallbackMode,
      fairnessStatus,
    });

    return mobileSuccess({
      revealed: false,
      mutual: true,
      introApproved: false,
      requiresIntroApproval: true,
      ...(match
        ? {
            matchId: match.id,
            ...resolveCanonicalCorridor({
              reviewStage: match.reviewStage ?? 'blind_review',
              revealScope: match.revealScope ?? 'blind',
              surface: 'review_detail',
              fairnessStatus,
              operationalFallbackMode: match.operationalFallbackMode,
              introRequested: true,
            }),
            why: buildVisibilitySafeWhy({
              reasonCodes: ['shortlist_selected'],
              fairnessStatus,
              fallbackState,
            }),
          }
        : {}),
      message:
        'Interest is mutual. The organization still needs to approve the introduction from the shortlist corridor.',
    });
  } catch (error) {
    console.error('[mobile.matching.interest.post] failed', error);
    return mobileError('internal_error', 'Failed to record interest', 500);
  }
}
