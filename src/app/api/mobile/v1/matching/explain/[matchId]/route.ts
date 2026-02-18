import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { assignments, matches } from '@/db/schema';
import { isActiveOrgMember, requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

function parseVector(vector: unknown) {
  if (!vector) {
    return {};
  }
  if (typeof vector === 'string') {
    try {
      return JSON.parse(vector);
    } catch {
      return {};
    }
  }
  return vector as Record<string, unknown>;
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
        vector: matches.vector,
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
          'owner',
          'admin',
          'member',
          'viewer',
        ]);

    if (!ownMatch && !orgAccess) {
      return mobileError('forbidden', 'You do not have access to this match', 403);
    }

    const vector = parseVector(row.vector);
    const subscores =
      (vector['subscores'] as Record<string, number> | undefined) ??
      (vector as Record<string, number>);

    return mobileSuccess({
      matchId: row.id,
      assignmentId: row.assignmentId,
      compositeScore: Number(row.score),
      subscores: {
        skills: Number(subscores?.skills ?? 0),
        pac: Number(subscores?.pac ?? subscores?.purpose_alignment ?? 0),
        constraints: Number(subscores?.constraints ?? 0),
        verification: Number(subscores?.verification ?? 0),
        recency: Number(subscores?.recency ?? 0),
      },
      weights: (vector['weights'] as Record<string, number> | undefined) ?? null,
      missing: (vector['missing'] as string[] | undefined) ?? [],
      gaps:
        (vector['gaps'] as Array<{ id: string; required: number; have: number }> | undefined) ?? [],
      suggestions: (vector['suggestions'] as string[] | undefined) ?? [
        'Add more verified proof to strengthen top skills.',
        'Complete matching preferences for better logistics scoring.',
      ],
    });
  } catch (error) {
    console.error('[mobile.matching.explain.get] failed', error);
    return mobileError('internal_error', 'Failed to load match explanation', 500);
  }
}
