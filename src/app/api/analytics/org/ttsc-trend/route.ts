/**
 * TTSC Trend API
 *
 * Returns TTSC (Time-to-Signed-Contract) trends over time for an organization.
 * PRD Reference: Part 5 O8 - Company Dashboard Analytics Tiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { analyticsEvents, assignments } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { TTSC_TARGET_DAYS } from '@/lib/analytics/constants';

interface TTSCTrendPoint {
  period: string; // ISO date string (start of week/month)
  medianDays: number;
  count: number; // Number of contracts in this period
  target: number; // Target threshold for comparison
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const orgSlug = searchParams.get('orgSlug');
    const groupBy = searchParams.get('groupBy') || 'week'; // 'week' or 'month'
    const limit = parseInt(searchParams.get('limit') || '12'); // Last 12 periods

    if (!orgSlug) {
      return NextResponse.json({ error: 'Organization slug is required' }, { status: 400 });
    }

    // TODO: Verify user has access to this organization

    // Calculate TTSC by finding pairs of profile_activated + contract_signed events
    // Group by time period and calculate median
    const intervalSQL =
      groupBy === 'month'
        ? sql`date_trunc('month', e2.timestamp)`
        : sql`date_trunc('week', e2.timestamp)`;

    const trendData = await db.execute(sql`
      WITH contract_events AS (
        SELECT 
          e1.user_id,
          e1.timestamp AS activation_time,
          e2.timestamp AS contract_time,
          EXTRACT(EPOCH FROM (e2.timestamp - e1.timestamp)) / 86400 AS days_to_contract,
          ${intervalSQL} AS period
        FROM ${analyticsEvents} e1
        JOIN ${analyticsEvents} e2 
          ON e1.user_id = e2.user_id
          AND e1.event_type = 'profile_activated'
          AND e2.event_type = 'contract_signed'
          AND e2.timestamp > e1.timestamp
        JOIN ${assignments} a
          ON (e2.properties->>'assignment_id')::uuid = a.id
        WHERE a.organization_id IN (
          SELECT id FROM organizations WHERE slug = ${orgSlug}
        )
        AND e2.timestamp >= NOW() - INTERVAL '1 year'
      )
      SELECT 
        period::text,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_to_contract) AS median_days,
        COUNT(*) AS contract_count
      FROM contract_events
      GROUP BY period
      ORDER BY period DESC
      LIMIT ${limit}
    `);

    // Format results
    const trends: TTSCTrendPoint[] = (trendData as unknown as any[]).map((row: any) => ({
      period: row.period,
      medianDays: Math.round(parseFloat(row.median_days)),
      count: parseInt(row.contract_count),
      target: TTSC_TARGET_DAYS,
    }));

    // Reverse to get chronological order
    trends.reverse();

    log.info('ttsc-trend.calculated', {
      orgSlug,
      groupBy,
      periods: trends.length,
    });

    return NextResponse.json({
      trends,
      target: TTSC_TARGET_DAYS,
      groupBy,
    });
  } catch (error) {
    log.error('ttsc-trend.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to calculate TTSC trend' }, { status: 500 });
  }
}
