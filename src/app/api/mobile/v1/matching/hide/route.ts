import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const HideSchema = z.object({
  matchId: z.string().uuid(),
});

function parseVector(raw: unknown) {
  if (!raw) {
    return {};
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  return raw as Record<string, unknown>;
}

function withHidden(raw: unknown, hidden: boolean) {
  const vector = { ...parseVector(raw) };
  if (hidden) {
    vector.hidden = true;
  } else {
    delete vector.hidden;
  }
  return vector;
}

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
        vector: matches.vector,
        assignmentId: assignments.id,
        assignmentRole: assignments.role,
      })
      .from(matches)
      .innerJoin(assignments, eq(assignments.id, matches.assignmentId))
      .where(eq(matches.profileId, auth.user.id));

    const hidden = rows
      .filter((row) => !!parseVector(row.vector).hidden)
      .map((row) => ({
        id: row.id,
        score: Number(row.score),
        assignment: {
          id: row.assignmentId,
          role: row.assignmentRole,
        },
      }));

    return mobileSuccess({
      items: hidden,
      count: hidden.length,
    });
  } catch (error) {
    console.error('[mobile.matching.hide.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch hidden matches', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = HideSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError('validation_error', 'Invalid hide payload', 400, parsed.error.flatten());
    }

    const [targetMatch] = await db
      .select({
        id: matches.id,
        vector: matches.vector,
      })
      .from(matches)
      .where(and(eq(matches.id, parsed.data.matchId), eq(matches.profileId, auth.user.id)))
      .limit(1);

    if (!targetMatch) {
      return mobileError('not_found', 'Match not found', 404);
    }

    await db
      .update(matches)
      .set({
        vector: withHidden(targetMatch.vector, true),
      })
      .where(eq(matches.id, targetMatch.id));

    return mobileSuccess({ hidden: true });
  } catch (error) {
    console.error('[mobile.matching.hide.post] failed', error);
    return mobileError('internal_error', 'Failed to hide match', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const matchId = request.nextUrl.searchParams.get('matchId');
    if (!matchId) {
      return mobileError('validation_error', 'matchId is required', 400);
    }

    const [targetMatch] = await db
      .select({
        id: matches.id,
        vector: matches.vector,
      })
      .from(matches)
      .where(and(eq(matches.id, matchId), eq(matches.profileId, auth.user.id)))
      .limit(1);

    if (!targetMatch) {
      return mobileError('not_found', 'Match not found', 404);
    }

    await db
      .update(matches)
      .set({
        vector: withHidden(targetMatch.vector, false),
      })
      .where(eq(matches.id, targetMatch.id));

    return mobileSuccess({ hidden: false });
  } catch (error) {
    console.error('[mobile.matching.hide.delete] failed', error);
    return mobileError('internal_error', 'Failed to unhide match', 500);
  }
}
