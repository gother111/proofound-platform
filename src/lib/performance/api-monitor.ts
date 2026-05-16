/**
 * Server-Side API Performance Monitoring
 *
 * Middleware to wrap API routes and track response times.
 * Stores P50, P95, P99 percentiles and alerts on SLA violations.
 *
 * PRD Reference: Part 8 (lines 1813-1817)
 * SLA Target: API P95 ≤1.5s
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { performanceMetrics, performanceAlerts } from '@/db/schema';
import type { InsertPerformanceMetric, InsertPerformanceAlert } from '@/db/schema';

// SLA thresholds in milliseconds
const SLA_THRESHOLDS = {
  api_p95: 1500, // 1.5 seconds
  api_p99: 2500, // 2.5 seconds
  api_p50: 500, // 0.5 seconds
};

function isProductionLikeRuntime() {
  const vercelEnv = process.env.VERCEL_ENV;
  if (isLocalSmokeRuntime()) return false;

  return (
    vercelEnv === 'production' || vercelEnv === 'preview' || process.env.NODE_ENV === 'production'
  );
}

function isLocalSmokeRuntime() {
  if (process.env.VERCEL || process.env.VERCEL_ENV) return false;

  return (
    process.env.PLAYWRIGHT === 'true' ||
    process.env.PLAYWRIGHT_SERVER_MODE === 'prod' ||
    process.env.PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK === '1' ||
    process.env.PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE === '1'
  );
}

/**
 * Middleware wrapper for API routes to track performance
 *
 * Usage:
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   return withPerformanceMonitoring(request, '/api/my-endpoint', async () => {
 *     // Your API logic here
 *     return NextResponse.json({ data: 'result' });
 *   });
 * }
 * ```
 */
export async function withPerformanceMonitoring<T extends NextResponse>(
  request: NextRequest,
  endpoint: string,
  handler: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const response = await handler();

    const duration = Date.now() - startTime;
    // Metrics are best-effort; do not make users wait on monitoring writes.
    void trackApiMetric(endpoint, duration, response.status);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    void trackApiMetric(endpoint, duration, 500);

    throw error;
  }
}

/**
 * Track an API request metric
 */
async function trackApiMetric(
  endpoint: string,
  durationMs: number,
  statusCode: number
): Promise<void> {
  if (isLocalSmokeRuntime()) return;

  try {
    const metric: InsertPerformanceMetric = {
      metricType: 'api_latency',
      apiEndpoint: endpoint,
      valueMs: String(durationMs),
      timestamp: new Date(),
      sampleCount: 1,
      p50: null,
      p95: null,
      p99: null,
      pageRoute: null,
      deviceType: null,
      userAgent: null,
      periodStart: null,
      periodEnd: null,
    };

    await db.insert(performanceMetrics).values(metric);

    // Check for SLA violations (but don't block the response)
    if (isProductionLikeRuntime()) {
      checkSLAViolation(endpoint, durationMs).catch((error) => {
        console.error('SLA check error:', error);
      });
    }
  } catch (error) {
    // Silent fail - don't disrupt API response
    console.error('Performance tracking error:', error);
  }
}

/**
 * Check if a metric violates SLA and create an alert
 */
async function checkSLAViolation(endpoint: string, durationMs: number): Promise<void> {
  // Only check if duration exceeds P95 threshold
  if (durationMs <= SLA_THRESHOLDS.api_p95) return;

  // Calculate recent P95 for this endpoint
  const recentMetrics = await db
    .select()
    .from(performanceMetrics)
    .where(sql`api_endpoint = ${endpoint} AND metric_type = 'api_latency'`)
    .orderBy(desc(performanceMetrics.timestamp))
    .limit(100);

  if (recentMetrics.length < 10) return; // Need at least 10 samples

  const values = recentMetrics.map((m) => parseFloat(m.valueMs)).sort((a, b) => a - b);
  const p95Index = Math.floor(values.length * 0.95);
  const p95 = values[p95Index];

  if (p95 > SLA_THRESHOLDS.api_p95) {
    // Create alert
    const severity = determineSeverity(p95, SLA_THRESHOLDS.api_p95);

    const alert: InsertPerformanceAlert = {
      alertType: 'sla_violation',
      metricType: 'api_latency',
      route: endpoint,
      thresholdMs: String(SLA_THRESHOLDS.api_p95),
      actualValueMs: String(p95),
      percentile: 'p95',
      deviceType: null,
      severity,
      status: 'open',
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null,
      notes: null,
    };

    await db.insert(performanceAlerts).values(alert);

    // Log for monitoring
    console.warn(
      `[Performance Alert] ${endpoint} P95 ${p95.toFixed(0)}ms exceeds ${SLA_THRESHOLDS.api_p95}ms`
    );
  }
}

/**
 * Determine alert severity based on how much threshold is exceeded
 */
function determineSeverity(
  actualMs: number,
  thresholdMs: number
): 'low' | 'medium' | 'high' | 'critical' {
  const ratio = actualMs / thresholdMs;

  if (ratio >= 3) return 'critical'; // 3x over threshold
  if (ratio >= 2) return 'high'; // 2x over threshold
  if (ratio >= 1.5) return 'medium'; // 1.5x over threshold
  return 'low';
}

/**
 * Calculate percentiles for a set of values
 */
export function calculatePercentiles(values: number[]): { p50: number; p95: number; p99: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const len = sorted.length;

  if (len === 0) {
    return { p50: 0, p95: 0, p99: 0 };
  }

  const getPercentile = (p: number): number => {
    const index = Math.ceil((p / 100) * len) - 1;
    return sorted[Math.max(0, index)];
  };

  return {
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
}

/**
 * Aggregate raw metrics into rolled-up percentile metrics
 * Should be run periodically (e.g., every hour via cron)
 */
export async function aggregateMetrics(periodHours: number = 1): Promise<void> {
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - periodHours * 60 * 60 * 1000);

  try {
    // Get all metrics in this period
    const metrics = await db
      .select()
      .from(performanceMetrics)
      .where(
        and(
          gte(performanceMetrics.timestamp, periodStart),
          lte(performanceMetrics.timestamp, periodEnd),
          isNull(performanceMetrics.periodStart) // Only non-aggregated metrics
        )
      );

    // Group by metric type, route, and device type
    const grouped = new Map<string, number[]>();

    metrics.forEach((metric) => {
      const key = `${metric.metricType}|${metric.pageRoute || metric.apiEndpoint}|${metric.deviceType || 'all'}`;
      const values = grouped.get(key) || [];
      values.push(parseFloat(metric.valueMs));
      grouped.set(key, values);
    });

    // Calculate percentiles and store aggregated metrics
    for (const [key, values] of grouped.entries()) {
      const [metricType, route, deviceType] = key.split('|');
      const percentiles = calculatePercentiles(values);

      const aggregated: InsertPerformanceMetric = {
        metricType: metricType as any,
        pageRoute: metricType.includes('page') ? route : null,
        apiEndpoint: metricType.includes('api') ? route : null,
        valueMs: String(percentiles.p50), // Use P50 as the representative value
        deviceType: deviceType !== 'all' ? (deviceType as any) : null,
        p50: String(percentiles.p50),
        p95: String(percentiles.p95),
        p99: String(percentiles.p99),
        timestamp: periodEnd,
        periodStart,
        periodEnd,
        sampleCount: values.length,
        userAgent: null,
      };

      await db.insert(performanceMetrics).values(aggregated);
    }

    console.log(
      `[Performance] Aggregated ${metrics.length} metrics into ${grouped.size} rolled-up entries`
    );
  } catch (error) {
    console.error('[Performance] Aggregation error:', error);
  }
}

// Import required for aggregateMetrics
import { and, gte, lte, isNull, desc, sql } from 'drizzle-orm';
