import { NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
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
export async function GET() {
  try {
    const adminUser = await requirePlatformAdmin();

    // Calculate date ranges
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Helper function to safely execute database queries
    async function safeQuery<T>(
      queryName: string,
      queryFn: () => Promise<T>,
      defaultValue: T
    ): Promise<T> {
      try {
        return await queryFn();
      } catch (error) {
        console.error(`Failed to execute ${queryName}:`, error);
        return defaultValue;
      }
    }

    // Total users
    const totalUsers = await safeQuery(
      'totalUsers',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(profiles)
          .where(eq(profiles.deleted, false));
        return result[0]?.count || 0;
      },
      0
    );

    // Users this month
    const usersThisMonth = await safeQuery(
      'usersThisMonth',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(profiles)
          .where(and(eq(profiles.deleted, false), gte(profiles.createdAt, last30Days)));
        return result[0]?.count || 0;
      },
      0
    );

    // Total organizations
    const totalOrgs = await safeQuery(
      'totalOrgs',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(organizations);
        return result[0]?.count || 0;
      },
      0
    );

    // Active organizations (with at least one assignment)
    const activeOrgs = await safeQuery(
      'activeOrgs',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(DISTINCT org_id)::int` })
          .from(assignments);
        return result[0]?.count || 0;
      },
      0
    );

    // Total matches
    const totalMatches = await safeQuery(
      'totalMatches',
      async () => {
        const result = await db.select({ count: sql<number>`count(*)::int` }).from(matches);
        return result[0]?.count || 0;
      },
      0
    );

    // Matches this month
    const matchesThisMonth = await safeQuery(
      'matchesThisMonth',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(matches)
          .where(gte(matches.createdAt, last30Days));
        return result[0]?.count || 0;
      },
      0
    );

    // Contracts signed (from analytics events)
    const contractsSigned = await safeQuery(
      'contractsSigned',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(analyticsEvents)
          .where(eq(analyticsEvents.eventType, 'contract_signed'));
        return result[0]?.count || 0;
      },
      0
    );

    // Contracts this month
    const contractsThisMonth = await safeQuery(
      'contractsThisMonth',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(analyticsEvents)
          .where(
            and(
              eq(analyticsEvents.eventType, 'contract_signed'),
              gte(analyticsEvents.createdAt, last30Days)
            )
          );
        return result[0]?.count || 0;
      },
      0
    );

    // Active assignments
    const activeAssignments = await safeQuery(
      'activeAssignments',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(assignments)
          .where(eq(assignments.status, 'active'));
        return result[0]?.count || 0;
      },
      0
    );

    // User activity (last 7 days)
    const activeUsersLast7Days = await safeQuery(
      'activeUsersLast7Days',
      async () => {
        const result = await db
          .select({ count: sql<number>`count(DISTINCT user_id)::int` })
          .from(analyticsEvents)
          .where(gte(analyticsEvents.createdAt, last7Days));
        return result[0]?.count || 0;
      },
      0
    );

    // Calculate TTSC metric (optional - don't fail if this errors)
    let ttsc = null;
    try {
      ttsc = await calculateTTSC();
    } catch (ttscError) {
      console.warn('Failed to calculate TTSC metric:', ttscError);
      // Continue without TTSC data - it's not critical for the dashboard to load
    }

    // Log admin access (optional - don't fail if this errors)
    try {
      await logAnalyticsAccess(adminUser.userId, 'overview');
    } catch (logError) {
      console.warn('Failed to log admin access:', logError);
      // Continue - logging failure shouldn't prevent dashboard from loading
    }

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
                median: ttsc.median,
                mean: ttsc.mean,
                p25: ttsc.p25,
                p75: ttsc.p75,
                sampleSize: ttsc.sampleSize,
                meetsTarget: ttsc.median <= 30,
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
    console.error('Admin analytics overview error:', error);
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    // Check if this is a redirect (from requirePlatformAdmin)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics overview',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
