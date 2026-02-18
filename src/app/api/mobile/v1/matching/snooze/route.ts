import { and, eq, gt } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const SnoozeSchema = z.object({
  matchId: z.string().uuid(),
  weeks: z.union([z.literal(1), z.literal(2), z.literal(4)]),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const rows = await db
      .select({
        id: matches.id,
        score: matches.score,
        snoozedUntil: matches.snoozedUntil,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .where(and(eq(matches.profileId, auth.user.id), gt(matches.snoozedUntil, new Date())));

    return mobileSuccess({
      items: rows.map((row) => ({
        id: row.id,
        score: Number(row.score),
        snoozedUntil: row.snoozedUntil,
        assignment: {
          id: row.assignmentId,
          role: row.assignmentRole,
        },
      })),
      count: rows.length,
    });
  } catch (error) {
    console.error('[mobile.matching.snooze.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch snoozed matches', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = SnoozeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError('validation_error', 'Invalid snooze payload', 400, parsed.error.flatten());
    }

    const [targetMatch] = await db
      .select({
        id: matches.id,
      })
      .from(matches)
      .where(and(eq(matches.id, parsed.data.matchId), eq(matches.profileId, auth.user.id)))
      .limit(1);

    if (!targetMatch) {
      return mobileError('not_found', 'Match not found', 404);
    }

    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + parsed.data.weeks * 7);

    await db
      .update(matches)
      .set({
        snoozedUntil,
      })
      .where(eq(matches.id, parsed.data.matchId));

    return mobileSuccess({
      snoozedUntil: snoozedUntil.toISOString(),
    });
  } catch (error) {
    console.error('[mobile.matching.snooze.post] failed', error);
    return mobileError('internal_error', 'Failed to snooze match', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('matchId');
    if (!matchId) {
      return mobileError('validation_error', 'matchId is required', 400);
    }

    const [updated] = await db
      .update(matches)
      .set({
        snoozedUntil: null,
      })
      .where(and(eq(matches.id, matchId), eq(matches.profileId, auth.user.id)))
      .returning({ id: matches.id });

    if (!updated) {
      return mobileError('not_found', 'Match not found', 404);
    }

    return mobileSuccess({ unsnoozed: true });
  } catch (error) {
    console.error('[mobile.matching.snooze.delete] failed', error);
    return mobileError('internal_error', 'Failed to unsnooze match', 500);
  }
}
