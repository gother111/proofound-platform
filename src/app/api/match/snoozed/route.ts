import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matches, assignments, organizationProfiles } from '@/db/schema';
import { eq, and, isNotNull, gt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/**
 * GET /api/match/snoozed
 *
 * Returns all currently snoozed matches for the authenticated user
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const now = new Date();

    // Fetch snoozed matches with assignment and org details
    const snoozedMatches = await db
      .select({
        match: matches,
        assignment: assignments,
        organization: organizationProfiles,
      })
      .from(matches)
      .innerJoin(assignments, eq(matches.assignmentId, assignments.id))
      .innerJoin(organizationProfiles, eq(assignments.organizationId, organizationProfiles.id))
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
      matchScore: parseFloat(row.match.score),
      snoozedUntil: row.match.snoozedUntil,
      assignment: {
        id: row.assignment.id,
        title: row.assignment.title,
        description: row.assignment.description,
        status: row.assignment.status,
      },
      organization: {
        id: row.organization.id,
        name: row.organization.name,
        logoUrl: row.organization.logoUrl,
      },
    }));

    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
    });
  } catch (error) {
    console.error('Error fetching snoozed matches:', error);
    return NextResponse.json({ error: 'Failed to fetch snoozed matches' }, { status: 500 });
  }
}

