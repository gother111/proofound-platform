/**
 * Web Vitals Analytics API
 *
 * POST /api/analytics/web-vitals - Record web vital metrics
 * GET /api/analytics/web-vitals - Retrieve aggregated metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getRows } from '@/lib/db/rows';
import { requirePlatformAdminJson } from '@/lib/api/route-helpers';

export const dynamic = 'force-dynamic';

interface WebVitalMetric {
  metricName: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
  pagePath: string;
}

const ALLOWED_METRIC_NAMES = new Set(['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP']);

function isValidMetricName(name: unknown): name is string {
  return typeof name === 'string' && ALLOWED_METRIC_NAMES.has(name);
}

/**
 * POST - Record a web vital metric
 */
export async function POST(req: NextRequest) {
  try {
    const metric = (await req.json()) as Partial<WebVitalMetric>;

    if (!isValidMetricName(metric.metricName)) {
      return NextResponse.json({ error: 'Invalid metricName' }, { status: 400 });
    }
    if (typeof metric.value !== 'number' || !Number.isFinite(metric.value)) {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }
    if (typeof metric.delta !== 'number' || !Number.isFinite(metric.delta)) {
      return NextResponse.json({ error: 'Invalid delta' }, { status: 400 });
    }
    if (
      metric.rating !== 'good' &&
      metric.rating !== 'needs-improvement' &&
      metric.rating !== 'poor'
    ) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }
    if (typeof metric.id !== 'string' || metric.id.length < 1) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    // Get user ID if authenticated (optional for web vitals)
    let userId: string | null = null;
    try {
      const supabase = await createClient();
      if (supabase?.auth?.getUser) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }
    } catch (authError) {
      log.warn('web_vitals.auth.skipped', {
        error: authError instanceof Error ? authError.message : 'Unknown error',
      });
    }

    // Prefer web_vitals_metrics (canonical per supabase/migrations); fall back to analytics_events
    // if the table is missing in the current database.
    try {
      await db.execute(sql`
        INSERT INTO web_vitals_metrics (
          user_id,
          metric_name,
          value,
          rating,
          delta,
          metric_id,
          navigation_type,
          page_path,
          user_agent,
          created_at
        ) VALUES (
          ${userId},
          ${metric.metricName},
          ${metric.value},
          ${metric.rating},
          ${metric.delta},
          ${metric.id},
          ${metric.navigationType || null},
          ${metric.pagePath || '/'},
          ${req.headers.get('user-agent')},
          NOW()
        )
      `);
    } catch (dbError) {
      // Fall back to analytics_events for older DBs that don't have web_vitals_metrics.
      await db.execute(sql`
        INSERT INTO analytics_events (
          event_type,
          user_id,
          entity_type,
          entity_id,
          properties,
          created_at
        ) VALUES (
          'performance_metric',
          ${userId},
          'page',
          NULL,
          ${JSON.stringify({
            metric_name: metric.metricName,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            metric_id: metric.id,
            navigation_type: metric.navigationType,
            page_path: metric.pagePath,
            user_agent: req.headers.get('user-agent'),
            is_anonymous: !userId,
          })},
          NOW()
        )
      `);
      log.warn('web_vitals.record.skipped', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        metric: metric.metricName,
      });
    }

    // Log if metric is poor
    if (metric.rating === 'poor') {
      log.warn('web_vitals.poor_metric', {
        metric: metric.metricName,
        value: metric.value,
        page: metric.pagePath,
        userId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('web_vitals.record.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    // Don't fail the request - web vitals should never break user experience
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

/**
 * GET - Retrieve aggregated web vitals metrics
 */
export async function GET(req: NextRequest) {
  try {
    const adminUser = await requirePlatformAdminJson();
    if (adminUser instanceof NextResponse) return adminUser;

    const { searchParams } = new URL(req.url);
    const daysRaw = searchParams.get('days') || '7';
    const days = Math.max(1, Math.min(90, parseInt(daysRaw, 10) || 7));
    const page = searchParams.get('page') || null;

    // Get aggregated metrics for last N days
    let result: any;
    let trendResult: any;
    let pageBreakdown: any;

    try {
      result = await db.execute(sql`
        SELECT
          metric_name,
          COUNT(*) as sample_count,
          ROUND(AVG(value)::numeric, 2) as avg_value,
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)::numeric, 2) as p50,
          ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value)::numeric, 2) as p75,
          ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY value)::numeric, 2) as p95,
          ROUND(MIN(value)::numeric, 2) as min_value,
          ROUND(MAX(value)::numeric, 2) as max_value,
          COUNT(CASE WHEN rating = 'good' THEN 1 END) as good_count,
          COUNT(CASE WHEN rating = 'needs-improvement' THEN 1 END) as needs_improvement_count,
          COUNT(CASE WHEN rating = 'poor' THEN 1 END) as poor_count
        FROM web_vitals_metrics
        WHERE created_at >= NOW() - (${days} * INTERVAL '1 day')
          ${page ? sql`AND page_path = ${page}` : sql``}
        GROUP BY metric_name
        ORDER BY metric_name
      `);

      trendResult = await db.execute(sql`
        SELECT
          DATE(created_at) as date,
          metric_name,
          ROUND(AVG(value)::numeric, 2) as avg_value,
          COUNT(*) as count
        FROM web_vitals_metrics
        WHERE created_at >= NOW() - (${days} * INTERVAL '1 day')
          ${page ? sql`AND page_path = ${page}` : sql``}
        GROUP BY DATE(created_at), metric_name
        ORDER BY date DESC, metric_name
      `);

      pageBreakdown = await db.execute(sql`
        SELECT
          page_path,
          metric_name,
          COUNT(*) as sample_count,
          ROUND(AVG(value)::numeric, 2) as avg_value,
          COUNT(CASE WHEN rating = 'poor' THEN 1 END) as poor_count
        FROM web_vitals_metrics
        WHERE created_at >= NOW() - (${days} * INTERVAL '1 day')
        GROUP BY page_path, metric_name
        HAVING COUNT(*) >= 10
        ORDER BY poor_count DESC, avg_value DESC
        LIMIT 20
      `);
    } catch (dbError) {
      // Fallback for older DBs that stored vitals in analytics_events instead of web_vitals_metrics.
      log.warn('web_vitals.get.fallback_to_analytics_events', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });

      result = await db.execute(sql`
        SELECT
          (properties->>'metric_name') as metric_name,
          COUNT(*) as sample_count,
          ROUND(AVG((properties->>'value')::numeric)::numeric, 2) as avg_value,
          ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (properties->>'value')::numeric)::numeric, 2) as p50,
          ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'value')::numeric)::numeric, 2) as p75,
          ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (properties->>'value')::numeric)::numeric, 2) as p95,
          COUNT(CASE WHEN (properties->>'rating') = 'good' THEN 1 END) as good_count,
          COUNT(CASE WHEN (properties->>'rating') = 'needs-improvement' THEN 1 END) as needs_improvement_count,
          COUNT(CASE WHEN (properties->>'rating') = 'poor' THEN 1 END) as poor_count
        FROM analytics_events
        WHERE event_type = 'performance_metric'
          AND created_at >= NOW() - (${days} * INTERVAL '1 day')
          ${page ? sql`AND (properties->>'page_path') = ${page}` : sql``}
          AND (properties->>'metric_name') IS NOT NULL
        GROUP BY (properties->>'metric_name')
        ORDER BY metric_name
      `);

      trendResult = await db.execute(sql`
        SELECT
          DATE(created_at) as date,
          (properties->>'metric_name') as metric_name,
          ROUND(AVG((properties->>'value')::numeric)::numeric, 2) as avg_value,
          COUNT(*) as count
        FROM analytics_events
        WHERE event_type = 'performance_metric'
          AND created_at >= NOW() - (${days} * INTERVAL '1 day')
          ${page ? sql`AND (properties->>'page_path') = ${page}` : sql``}
          AND (properties->>'metric_name') IS NOT NULL
        GROUP BY DATE(created_at), (properties->>'metric_name')
        ORDER BY date DESC, metric_name
      `);

      pageBreakdown = await db.execute(sql`
        SELECT
          (properties->>'page_path') as page_path,
          (properties->>'metric_name') as metric_name,
          COUNT(*) as sample_count,
          ROUND(AVG((properties->>'value')::numeric)::numeric, 2) as avg_value,
          COUNT(CASE WHEN (properties->>'rating') = 'poor' THEN 1 END) as poor_count
        FROM analytics_events
        WHERE event_type = 'performance_metric'
          AND created_at >= NOW() - (${days} * INTERVAL '1 day')
          AND (properties->>'metric_name') IS NOT NULL
          AND (properties->>'page_path') IS NOT NULL
        GROUP BY (properties->>'page_path'), (properties->>'metric_name')
        HAVING COUNT(*) >= 10
        ORDER BY poor_count DESC, avg_value DESC
        LIMIT 20
      `);
    }

    return NextResponse.json({
      success: true,
      metrics: getRows(result),
      trends: getRows(trendResult),
      pageBreakdown: getRows(pageBreakdown),
      period: {
        days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        endDate: new Date(),
      },
    });
  } catch (error) {
    log.error('web_vitals.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
  }
}
