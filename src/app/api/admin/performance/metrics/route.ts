/**
 * GET /api/admin/performance/metrics
 *
 * Fetch performance metrics and SLA status for the dashboard
 * Requires admin permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { performanceMetrics, performanceAlerts } from '@/db/schema';
import { and, gte, desc, isNotNull, sql } from 'drizzle-orm';
import { calculatePercentiles } from '@/lib/performance/api-monitor';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('platform_role')
      .eq('id', user.id)
      .single();

    if (
      !profile?.platform_role ||
      !['platform_admin', 'super_admin'].includes(profile.platform_role)
    ) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';
    const deviceType = searchParams.get('deviceType') || 'all';

    // Calculate time range
    const now = new Date();
    let startTime = new Date();
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        break;
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Build query conditions
    let conditions = [gte(performanceMetrics.timestamp, startTime)];
    if (deviceType !== 'all') {
      conditions.push(sql`${performanceMetrics.deviceType} = ${deviceType}`);
    }

    // Fetch aggregated metrics (those with percentiles already calculated)
    const aggregatedMetrics = await db
      .select()
      .from(performanceMetrics)
      .where(and(...conditions, isNotNull(performanceMetrics.p95)))
      .orderBy(desc(performanceMetrics.timestamp))
      .limit(1000);

    // Group metrics by route and calculate overall percentiles
    const metricsMap = new Map<string, any>();

    aggregatedMetrics.forEach((metric) => {
      const route = metric.pageRoute || metric.apiEndpoint || 'unknown';
      const key = `${metric.metricType}|${route}|${metric.deviceType || 'all'}`;

      if (!metricsMap.has(key)) {
        metricsMap.set(key, {
          route,
          metricType: metric.metricType,
          deviceType: metric.deviceType,
          p50: parseFloat(metric.p50 || '0'),
          p95: parseFloat(metric.p95 || '0'),
          p99: parseFloat(metric.p99 || '0'),
          sampleCount: metric.sampleCount || 0,
        });
      } else {
        // Aggregate multiple periods
        const existing = metricsMap.get(key);
        existing.sampleCount += metric.sampleCount || 0;
        // Use the most recent percentile values
        if (metric.timestamp > (existing.timestamp || new Date(0))) {
          existing.p50 = parseFloat(metric.p50 || '0');
          existing.p95 = parseFloat(metric.p95 || '0');
          existing.p99 = parseFloat(metric.p99 || '0');
          existing.timestamp = metric.timestamp;
        }
      }
    });

    const metrics = Array.from(metricsMap.values());

    // Calculate SLA status
    const slaStatus = calculateSLAStatus(metrics);

    // Fetch active alerts
    const activeAlerts = await db
      .select()
      .from(performanceAlerts)
      .where(
        and(
          sql`${performanceAlerts.status} IN ('open', 'acknowledged')`,
          gte(performanceAlerts.createdAt, startTime)
        )
      )
      .orderBy(desc(performanceAlerts.createdAt))
      .limit(50);

    return NextResponse.json({
      success: true,
      metrics,
      slaStatus,
      alerts: activeAlerts,
      timeRange,
      deviceType,
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Calculate SLA status for key metrics
 */
function calculateSLAStatus(metrics: any[]): any[] {
  const status = [];

  // Desktop page load TTI: P95 ≤2.5s
  const desktopPageLoads = metrics.filter(
    (m) =>
      (m.metricType === 'page_load' || m.metricType === 'tti') &&
      (m.deviceType === 'desktop' || m.deviceType === 'all')
  );
  if (desktopPageLoads.length > 0) {
    const avgP95 = desktopPageLoads.reduce((sum, m) => sum + m.p95, 0) / desktopPageLoads.length;
    const threshold = 2500;
    status.push({
      metric: 'Desktop Page Load (P95)',
      threshold,
      actual: avgP95,
      status: avgP95 <= threshold ? 'pass' : avgP95 <= threshold * 1.2 ? 'warn' : 'fail',
      compliance: Math.min(100, (threshold / avgP95) * 100),
    });
  }

  // Mobile page load TTI: P95 ≤3.5s
  const mobilePageLoads = metrics.filter(
    (m) => (m.metricType === 'page_load' || m.metricType === 'tti') && m.deviceType === 'mobile'
  );
  if (mobilePageLoads.length > 0) {
    const avgP95 = mobilePageLoads.reduce((sum, m) => sum + m.p95, 0) / mobilePageLoads.length;
    const threshold = 3500;
    status.push({
      metric: 'Mobile Page Load (P95)',
      threshold,
      actual: avgP95,
      status: avgP95 <= threshold ? 'pass' : avgP95 <= threshold * 1.2 ? 'warn' : 'fail',
      compliance: Math.min(100, (threshold / avgP95) * 100),
    });
  }

  // API latency: P95 ≤1.5s
  const apiLatency = metrics.filter((m) => m.metricType === 'api_latency');
  if (apiLatency.length > 0) {
    const avgP95 = apiLatency.reduce((sum, m) => sum + m.p95, 0) / apiLatency.length;
    const threshold = 1500;
    status.push({
      metric: 'API Latency (P95)',
      threshold,
      actual: avgP95,
      status: avgP95 <= threshold ? 'pass' : avgP95 <= threshold * 1.2 ? 'warn' : 'fail',
      compliance: Math.min(100, (threshold / avgP95) * 100),
    });
  }

  return status;
}
