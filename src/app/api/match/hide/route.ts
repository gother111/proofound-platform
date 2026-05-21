import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { matches, assignments, organizations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

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

function normalizeVector(raw: unknown) {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw || {};
}

/**
 * GET /api/match/hide
 * Returns all hidden matches for the current user.
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Fetch all, then filter hidden in JS to tolerate legacy stringified vectors
    const rows = await db
      .select({
        match: matches,
        assignment: assignments,
        organization: organizations,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .innerJoin(organizations, eq(assignments.orgId, organizations.id))
      .where(eq(matches.profileId, user.id))
      .orderBy(assignments.role);

    const hiddenMatches = rows
      .map((row) => {
        const vectorObj = normalizeVector((row.match as any).vector);
        const isHidden = !!(vectorObj as any)?.hidden;
        return isHidden
          ? {
              id: row.match.id,
              assignmentId: row.assignment.id,
              assignment: {
                title: row.assignment.role,
                locationMode: row.assignment.locationMode,
                country: row.assignment.country,
              },
              organization: {
                name: row.organization.displayName,
                logoUrl: row.organization.logoUrl,
              },
            }
          : null;
      })
      .filter(Boolean);

    return NextResponse.json({
      matches: hiddenMatches,
      count: hiddenMatches.length,
      scoreVisibility: 'internal_ordering_only',
    });
  } catch (error) {
    log.error('match.hide.list_failed', { error });
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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
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

    const updatedVector = markHidden(normalizeVector((match as any).vector), true);

    await db
      .update(matches)
      .set({
        vector: updatedVector,
      })
      .where(eq(matches.id, matchId));

    // Ensure the matching feed is refreshed after hiding
    revalidatePath('/app/i/matching');

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('match.hide.update_failed', { error });
    return NextResponse.json({ error: 'Failed to hide match' }, { status: 500 });
  }
}

/**
 * DELETE /api/match/hide?matchId=...
 * Unhides a match for the current user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
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

    const updatedVector = markHidden(normalizeVector((match as any).vector), false);

    await db
      .update(matches)
      .set({
        vector: updatedVector,
      })
      .where(eq(matches.id, matchId));

    // Ensure the matching feed is refreshed after unhide
    revalidatePath('/app/i/matching');

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('match.hide.delete_failed', { error });
    return NextResponse.json({ error: 'Failed to unhide match' }, { status: 500 });
  }
}
