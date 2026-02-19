import { eq, gte, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { analyticsEvents, assignments, matches, organizations, profiles } from '@/db/schema';
import { requireMobileAuth, requireMobilePlatformAdmin } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const adminGuard = requireMobilePlatformAdmin(auth);
    if (adminGuard) {
      return adminGuard;
    }

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      usersTotal,
      usersThisMonth,
      orgTotal,
      activeAssignments,
      matchesTotal,
      matchesThisMonth,
      activeUsersLastWeek,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(profiles),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(profiles)
        .where(gte(profiles.createdAt, last30Days)),
      db.select({ count: sql<number>`count(*)::int` }).from(organizations),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(assignments)
        .where(eq(assignments.status, 'active')),
      db.select({ count: sql<number>`count(*)::int` }).from(matches),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(matches)
        .where(gte(matches.createdAt, last30Days)),
      db
        .select({ count: sql<number>`count(DISTINCT user_id)::int` })
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, last7Days)),
    ]);

    return mobileSuccess({
      users: {
        total: usersTotal[0]?.count ?? 0,
        thisMonth: usersThisMonth[0]?.count ?? 0,
        activeLastWeek: activeUsersLastWeek[0]?.count ?? 0,
      },
      organizations: {
        total: orgTotal[0]?.count ?? 0,
      },
      assignments: {
        active: activeAssignments[0]?.count ?? 0,
      },
      matches: {
        total: matchesTotal[0]?.count ?? 0,
        thisMonth: matchesThisMonth[0]?.count ?? 0,
      },
      period: {
        last30Days: last30Days.toISOString(),
        last7Days: last7Days.toISOString(),
        now: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('[mobile.admin.analytics.overview.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch admin analytics overview', 500);
  }
}
