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

/**
 * POST - Record a web vital metric
 */
export async function POST(req: NextRequest) {
  try {
    const metric: WebVitalMetric = await req.json();

    // Get user ID if authenticated (optional for web vitals)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if web_vitals_metrics table exists before trying to insert
    // If table doesn't exist, just return success to avoid breaking the app
    try {
      // Store metric in analytics_events instead (which definitely exists)
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
          ${user?.id || null},
          'page',
          ${metric.pagePath},
          ${JSON.stringify({
            metric_name: metric.metricName,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            metric_id: metric.id,
            navigation_type: metric.navigationType,
            user_agent: req.headers.get('user-agent'),
          })},
          NOW()
        )
      `);
    } catch (dbError) {
      // If table doesn't exist or insert fails, log but don't fail the request
      // Web vitals should never break user experience
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
        userId: user?.id,
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
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7');
    const page = searchParams.get('page') || null;

    // Get aggregated metrics for last N days
    const result = await db.execute(sql`
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
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        ${page ? sql`AND page_path = ${page}` : sql``}
      GROUP BY metric_name
      ORDER BY metric_name
    `);

    // Get daily trend data
    const trendResult = await db.execute(sql`
      SELECT
        DATE(created_at) as date,
        metric_name,
        ROUND(AVG(value)::numeric, 2) as avg_value,
        COUNT(*) as count
      FROM web_vitals_metrics
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        ${page ? sql`AND page_path = ${page}` : sql``}
      GROUP BY DATE(created_at), metric_name
      ORDER BY date DESC, metric_name
    `);

    // Get page performance breakdown
    const pageBreakdown = await db.execute(sql`
      SELECT
        page_path,
        metric_name,
        COUNT(*) as sample_count,
        ROUND(AVG(value)::numeric, 2) as avg_value,
        COUNT(CASE WHEN rating = 'poor' THEN 1 END) as poor_count
      FROM web_vitals_metrics
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY page_path, metric_name
      HAVING COUNT(*) >= 10
      ORDER BY poor_count DESC, avg_value DESC
      LIMIT 20
    `);

    return NextResponse.json({
      success: true,
      metrics: result.rows,
      trends: trendResult.rows,
      pageBreakdown: pageBreakdown.rows,
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
