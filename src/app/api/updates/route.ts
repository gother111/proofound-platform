import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/updates
 *
 * Returns recent activity updates for the user's dashboard.
 * This aggregates various activities like:
 * - New matches
 * - Profile views
 * - Assignment applications
 * - Network activity
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // For now, return sample data structure
    // In production, this would query:
    // - matches table for new matches
    // - match_interest table for new interest
    // - audit_logs for relevant activities

    const updates: Array<{
      id: string;
      type: 'match' | 'view' | 'interest' | 'application';
      text: string;
      timestamp: string;
      actionUrl?: string;
    }> = [];

    // TODO: Implement real queries when match system is fully active
    // Example:
    // const recentMatches = await db.query.matches.findMany({
    //   where: eq(matches.profileId, user.id),
    //   orderBy: (matches, { desc }) => [desc(matches.createdAt)],
    //   limit: 5,
    // });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error('Failed to fetch updates:', error);
    return NextResponse.json({ updates: [] });
  }
}
