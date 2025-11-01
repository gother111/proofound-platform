import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { profiles, organizations, matches, assignments, analyticsEvents } from '@/db/schema';
import { sql, gte, and, eq } from 'drizzle-orm';
import { logAnalyticsAccess } from '@/lib/audit/admin-logger';

/**
 * GET /api/admin/analytics/overview
 *
 * Platform-wide overview statistics
 * Requires: platform_admin or super_admin
 */
export async function GET() {
  try {
    const adminUser = await requirePlatformAdmin();

    // Calculate date ranges
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(eq(profiles.deleted, false));
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Users this month
    const usersThisMonthResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(
        and(
          eq(profiles.deleted, false),
          gte(profiles.createdAt, last30Days)
        )
      );
    const usersThisMonth = usersThisMonthResult[0]?.count || 0;

    // Total organizations
    const totalOrgsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(organizations);
    const totalOrgs = totalOrgsResult[0]?.count || 0;

    // Active organizations (with at least one assignment)
    const activeOrgsResult = await db
      .select({ count: sql<number>`count(DISTINCT org_id)::int` })
      .from(assignments);
    const activeOrgs = activeOrgsResult[0]?.count || 0;

    // Total matches
    const totalMatchesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(matches);
    const totalMatches = totalMatchesResult[0]?.count || 0;

    // Matches this month
    const matchesThisMonthResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(matches)
      .where(gte(matches.createdAt, last30Days));
    const matchesThisMonth = matchesThisMonthResult[0]?.count || 0;

    // Contracts signed (from analytics events)
    const contractsSignedResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(eq(analyticsEvents.eventType, 'contract_signed'));
    const contractsSigned = contractsSignedResult[0]?.count || 0;

    // Contracts this month
    const contractsThisMonthResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'contract_signed'),
          gte(analyticsEvents.createdAt, last30Days)
        )
      );
    const contractsThisMonth = contractsThisMonthResult[0]?.count || 0;

    // Active assignments
    const activeAssignmentsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(assignments)
      .where(eq(assignments.status, 'published'));
    const activeAssignments = activeAssignmentsResult[0]?.count || 0;

    // User activity (last 7 days)
    const activeUsersResult = await db
      .select({ count: sql<number>`count(DISTINCT user_id)::int` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, last7Days));
    const activeUsersLast7Days = activeUsersResult[0]?.count || 0;

    // Log admin access
    await logAnalyticsAccess(adminUser.userId, 'overview');

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          thisMonth: usersThisMonth,
          activeLastWeek: activeUsersLast7Days,
        },
        organizations: {
          total: totalOrgs,
          active: activeOrgs,
        },
        matches: {
          total: totalMatches,
          thisMonth: matchesThisMonth,
        },
        contracts: {
          total: contractsSigned,
          thisMonth: contractsThisMonth,
        },
        assignments: {
          active: activeAssignments,
        },
        period: {
          last30Days: last30Days.toISOString(),
          last7Days: last7Days.toISOString(),
          now: now.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Admin analytics overview error:', error);

    // Check if this is a redirect (from requirePlatformAdmin)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics overview',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
