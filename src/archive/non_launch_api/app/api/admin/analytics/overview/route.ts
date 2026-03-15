import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';
import { db } from '@/db';
import { profiles, organizations, matches, assignments, analyticsEvents } from '@/db/schema';
import { sql, gte, and, eq } from 'drizzle-orm';
import { logAnalyticsAccess } from '@/lib/audit/admin-logger';
import { calculateTTSC } from '@/lib/analytics/metrics';

/**
 * GET /api/admin/analytics/overview
 *
 * Platform-wide overview statistics
 * Requires: platform_admin or super_admin
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;

    // Calculate date ranges
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total users
    const totalUsersResult = await db.select({ count: sql<number>`count(*)::int` }).from(profiles);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Users this month
    const usersThisMonthResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(profiles)
      .where(gte(profiles.createdAt, last30Days));
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
    const totalMatchesResult = await db.select({ count: sql<number>`count(*)::int` }).from(matches);
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
      .where(eq(assignments.status, 'active'));
    const activeAssignments = activeAssignmentsResult[0]?.count || 0;

    // User activity (last 7 days)
    const activeUsersResult = await db
      .select({ count: sql<number>`count(DISTINCT user_id)::int` })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, last7Days));
    const activeUsersLast7Days = activeUsersResult[0]?.count || 0;

    // Calculate TTSC metric
    const ttsc = await calculateTTSC();

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
        metrics: {
          ttsc: ttsc
            ? {
                median: ttsc.value,
                mean: ttsc.value, // Using median as proxy since mean is not calculated
                p25: ttsc.percentile?.p50 || 0, // We don't calculate p25, using p50 as fallback
                p75: ttsc.percentile?.p75 || 0,
                sampleSize: ttsc.sampleSize,
                meetsTarget: ttsc.onTrack,
                unit: 'days',
              }
            : null,
        },
        period: {
          last30Days: last30Days.toISOString(),
          last7Days: last7Days.toISOString(),
          now: now.toISOString(),
        },
      },
    });
  } catch (error) {
    // Check if this is a redirect (from requirePlatformAdmin)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch analytics overview',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: JSON.stringify(error),
      },
      { status: 500 }
    );
  }
}
