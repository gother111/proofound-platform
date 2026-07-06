import { NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { matches, assignments, organizations } from '@/db/schema';
import { eq, and, isNotNull, gt } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

function proofFitLabel(score: unknown): string {
  const normalized = Number(score);
  if (!Number.isFinite(normalized)) return 'Proof review needed';
  if (normalized >= 0.8) return 'Strong proof alignment';
  if (normalized >= 0.6) return 'Clear proof alignment';
  return 'Proof review needed';
}

/**
 * GET /api/match/snoozed
 *
 * Returns all currently snoozed matches for the authenticated user
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const now = new Date();

    // Fetch snoozed matches with assignment and org details
    const snoozedMatches = await db
      .select({
        match: matches,
        assignment: assignments,
        organization: organizations,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .innerJoin(organizations, eq(assignments.orgId, organizations.id))
      .where(
        and(
          eq(matches.profileId, user.id),
          isNotNull(matches.snoozedUntil),
          gt(matches.snoozedUntil, now) // Only return matches still snoozed
        )
      )
      .orderBy(matches.snoozedUntil);

    // Format response
    const formattedMatches = snoozedMatches.map((row) => ({
      id: row.match.id,
      proofFitLabel: proofFitLabel(row.match.score),
      snoozedUntil: row.match.snoozedUntil,
      assignment: {
        id: row.assignment.id,
        title: row.assignment.role,
        description: row.assignment.description,
        status: row.assignment.status,
      },
      organization: {
        id: row.organization.id,
        name: row.organization.displayName,
        logoUrl: row.organization.logoUrl,
      },
    }));

    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
      scoreVisibility: 'internal_ordering_only',
    });
  } catch (error) {
    log.error('match.snoozed.list_failed', { error });
    return NextResponse.json({ error: 'Failed to fetch snoozed matches' }, { status: 500 });
  }
}
