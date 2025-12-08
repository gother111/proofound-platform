import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matches, assignments } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function markHidden(vector: any, hidden: boolean) {
  const next = { ...(vector || {}) };
  if (hidden) {
    next.hidden = true;
  } else {
    delete next.hidden;
  }
  return next;
}

/**
 * GET /api/match/hide
 * Returns all hidden matches for the current user.
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const rows = await db
      .select({
        match: matches,
        assignment: assignments,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .where(
        and(
          eq(matches.profileId, user.id),
          // Safely check hidden flag in vector JSON
          sql`coalesce((${matches.vector} ->> 'hidden')::boolean, false) = true`
        )
      )
      .orderBy(assignments.role);

    const hiddenMatches = rows.map((row) => ({
      id: row.match.id,
      assignmentId: row.assignment.id,
      score: Number(row.match.score),
      assignment: {
        title: row.assignment.role,
        locationMode: row.assignment.locationMode,
        country: row.assignment.country,
      },
    }));

    return NextResponse.json({ matches: hiddenMatches, count: hiddenMatches.length });
  } catch (error) {
    console.error('Failed to fetch hidden matches:', error);
    return NextResponse.json({ error: 'Failed to fetch hidden matches' }, { status: 500 });
  }
}

/**
 * POST /api/match/hide
 * Body: { matchId }
 * Marks a match as hidden for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { matchId } = body;

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.profileId, user.id)),
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const updatedVector = markHidden((match as any).vector, true);

    await db
      .update(matches)
      .set({
        vector: updatedVector,
      })
      .where(eq(matches.id, matchId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to hide match:', error);
    return NextResponse.json({ error: 'Failed to hide match' }, { status: 500 });
  }
}

/**
 * DELETE /api/match/hide?matchId=...
 * Unhides a match for the current user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const match = await db.query.matches.findFirst({
      where: and(eq(matches.id, matchId), eq(matches.profileId, user.id)),
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const updatedVector = markHidden((match as any).vector, false);

    await db
      .update(matches)
      .set({
        vector: updatedVector,
      })
      .where(eq(matches.id, matchId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unhide match:', error);
    return NextResponse.json({ error: 'Failed to unhide match' }, { status: 500 });
  }
}

