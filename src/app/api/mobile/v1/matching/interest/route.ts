import { and, eq, isNull } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, conversations, matchInterest, matches } from '@/db/schema';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { requireMobileAuth } from '@/lib/api/mobile/auth';

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
      return mobileSuccess({ revealed: false });
    }

    const profileId = targetProfileId || auth.user.id;
    const [match] = await db
      .select({
        id: matches.id,
        assignmentId: matches.assignmentId,
        profileId: matches.profileId,
      })
      .from(matches)
      .where(and(eq(matches.assignmentId, assignmentId), eq(matches.profileId, profileId)))
      .limit(1);

    if (!match) {
      return mobileSuccess({ revealed: true, conversationId: null });
    }

    const [existingConversation] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(eq(conversations.matchId, match.id))
      .limit(1);

    if (existingConversation) {
      return mobileSuccess({
        revealed: true,
        conversationId: existingConversation.id,
        matchId: match.id,
      });
    }

    const individualId = match.profileId;
    const representativeId = orgRepresentativeId ?? auth.user.id;
    const [createdConversation] = await db
      .insert(conversations)
      .values({
        matchId: match.id,
        assignmentId: match.assignmentId,
        participantOneId: individualId,
        participantTwoId: representativeId,
        stage: 'masked',
        maskedHandleOne: `Candidate #${nanoid(6).toUpperCase()}`,
        maskedHandleTwo: `Organization #${nanoid(6).toUpperCase()}`,
        lastMessageAt: new Date(),
      })
      .returning();

    return mobileSuccess({
      revealed: true,
      conversationId: createdConversation.id,
      matchId: match.id,
    });
  } catch (error) {
    console.error('[mobile.matching.interest.post] failed', error);
    return mobileError('internal_error', 'Failed to record interest', 500);
  }
}
