import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { db } from '@/db';
import { profiles, organizations } from '@/db/schema';
import { sql, gte } from 'drizzle-orm';
import { logAnalyticsAccess } from '@/lib/audit/admin-logger';

type GrowthGroupBy = 'day' | 'week' | 'month';

const DATE_TRUNC_LITERAL: Record<GrowthGroupBy, ReturnType<typeof sql.raw>> = {
  day: sql.raw("'day'"),
  week: sql.raw("'week'"),
  month: sql.raw("'month'"),
};

/**
 * GET /api/admin/analytics/growth
 *
 * User and organization growth analytics
 * Query params:
 * - period: '7d' | '30d' | '90d' | '1y' (default: '30d')
 * - groupBy: 'day' | 'week' | 'month' (default: 'day')
 */
export async function GET(request: NextRequest) {
  try {
    const adminUser = await requirePlatformAdmin();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const groupByParam = searchParams.get('groupBy');
    const groupBy: GrowthGroupBy =
      groupByParam === 'week' || groupByParam === 'month' || groupByParam === 'day'
        ? groupByParam
        : 'day';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const userBucket = sql`DATE_TRUNC(${DATE_TRUNC_LITERAL[groupBy]}, ${profiles.createdAt})`;
    const organizationBucket = sql`DATE_TRUNC(${DATE_TRUNC_LITERAL[groupBy]}, ${organizations.createdAt})`;

    // User signups over time
    const userGrowth = await db
      .select({
        period: sql<string>`${userBucket}::date`,
        count: sql<number>`count(*)::int`,
      })
      .from(profiles)
      .where(gte(profiles.createdAt, startDate))
      .groupBy(userBucket)
      .orderBy(userBucket);

    // Organization growth over time
    const orgGrowth = await db
      .select({
        period: sql<string>`${organizationBucket}::date`,
        count: sql<number>`count(*)::int`,
      })
      .from(organizations)
      .where(gte(organizations.createdAt, startDate))
      .groupBy(organizationBucket)
      .orderBy(organizationBucket);

    // Calculate cumulative totals
    let userCumulative = 0;
    const userGrowthWithCumulative = userGrowth.map((item) => {
      userCumulative += item.count;
      return {
        period: item.period,
        count: item.count,
        cumulative: userCumulative,
      };
    });

    let orgCumulative = 0;
    const orgGrowthWithCumulative = orgGrowth.map((item) => {
      orgCumulative += item.count;
      return {
        period: item.period,
        count: item.count,
        cumulative: orgCumulative,
      };
    });

    // Log admin access
    await logAnalyticsAccess(adminUser.userId, 'growth', { period, groupBy });

    return NextResponse.json({
      success: true,
      data: {
        users: userGrowthWithCumulative,
        organizations: orgGrowthWithCumulative,
        period: {
          start: startDate.toISOString(),
          end: now.toISOString(),
          groupBy,
        },
      },
    });
  } catch (error) {
    console.error('Admin growth analytics error:', error);

    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch growth analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
