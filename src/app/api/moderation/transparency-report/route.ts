import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/moderation/transparency-report
 *
 * Returns aggregated moderation statistics for a reporting window.
 */
export async function GET(request: NextRequest) {
  try {
    const daysRaw = parseInt(request.nextUrl.searchParams.get('days') || '30', 10);
    const days = Number.isFinite(daysRaw) ? Math.min(Math.max(daysRaw, 1), 365) : 30;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const reportsResult = await db.execute(sql`
      SELECT
        status,
        category,
        COUNT(*)::int AS count
      FROM content_reports
      WHERE created_at >= ${startDate}
      GROUP BY status, category
      ORDER BY status, category
    `);

    const actionsResult = await db.execute(sql`
      SELECT
        action_type,
        COUNT(*)::int AS count
      FROM moderation_actions
      WHERE created_at >= ${startDate}
      GROUP BY action_type
      ORDER BY action_type
    `);

    const appealsResult = await db.execute(sql`
      SELECT
        status,
        COUNT(*)::int AS count
      FROM moderation_appeals
      WHERE created_at >= ${startDate}
      GROUP BY status
      ORDER BY status
    `);

    const reports = getRows(reportsResult) as Array<{
      status: string;
      category: string;
      count: number;
    }>;
    const actions = getRows(actionsResult) as Array<{ action_type: string; count: number }>;
    const appeals = getRows(appealsResult) as Array<{ status: string; count: number }>;

    const totals = {
      reports: reports.reduce((sum, row) => sum + row.count, 0),
      actions: actions.reduce((sum, row) => sum + row.count, 0),
      appeals: appeals.reduce((sum, row) => sum + row.count, 0),
    };

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      totals,
      reportsByStatusAndCategory: reports,
      actionsByType: actions,
      appealsByStatus: appeals,
    });
  } catch (error) {
    log.error('moderation.transparency_report.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to generate transparency report' }, { status: 500 });
  }
}
