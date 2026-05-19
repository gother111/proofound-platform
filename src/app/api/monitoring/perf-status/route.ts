import { NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { db } from '@/db';
import { analyticsEvents, performanceMetrics } from '@/db/schema';
import { and, gte, sql } from 'drizzle-orm';
import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { calculatePercentile, getPerformanceStatus } from '@/lib/monitoring/api-latency';

export const dynamic = 'force-dynamic';
type PerfStatusSource = 'performance_metrics' | 'analytics_events' | 'probe' | 'unavailable';

const REQUIRED_API_LATENCY_ROUTES = ['/api/assignments'];

type PerfDurationRow = {
  route: string;
  duration: number | null;
};

async function probeHealthDurations(origin: string, sampleCount = 10): Promise<number[]> {
  const healthUrl = `${origin}/api/health`;
  const samples: number[] = [];

  // Prime route compilation and the cached DB health check before measuring fallback latency.
  const warmupResponse = await fetch(healthUrl, { cache: 'no-store' });
  if (!warmupResponse.ok) {
    throw new Error(`/api/health probe failed with status ${warmupResponse.status}`);
  }

  for (let i = 0; i < sampleCount; i += 1) {
    const started = performance.now();
    const response = await fetch(healthUrl, { cache: 'no-store' });
    const durationMs = performance.now() - started;
    if (!response.ok) {
      throw new Error(`/api/health probe failed with status ${response.status}`);
    }
    samples.push(durationMs);
  }

  return samples;
}

function normalizeRoute(value: string | null | undefined) {
  const route = value?.trim();
  return route && route.length > 0 ? route : 'unknown';
}

function buildRouteBreakdown(rows: PerfDurationRow[]) {
  const grouped = new Map<string, number[]>();
  for (const row of rows) {
    if (typeof row.duration !== 'number' || !Number.isFinite(row.duration)) continue;
    const route = normalizeRoute(row.route);
    const durations = grouped.get(route) ?? [];
    durations.push(row.duration);
    grouped.set(route, durations);
  }

  return [...grouped.entries()]
    .map(([route, durations]) => ({
      route,
      sampleCount: durations.length,
      p95: calculatePercentile(durations, 95),
    }))
    .sort((a, b) => a.route.localeCompare(b.route));
}

function buildPerfPayload(
  rows: PerfDurationRow[],
  source: PerfStatusSource,
  fallbackReason?: string
) {
  const durations = rows
    .map((row) => row.duration)
    .filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  const p95 = calculatePercentile(durations, 95);
  const status = getPerformanceStatus(p95);
  const routeBreakdown = buildRouteBreakdown(rows);
  const routesWithSamples = new Set(routeBreakdown.map((row) => row.route));
  const missingRequiredRoutes = REQUIRED_API_LATENCY_ROUTES.filter(
    (route) => !routesWithSamples.has(route)
  );
  const baseMessage =
    source === 'probe' && fallbackReason
      ? `${fallbackReason} Probe /api/health P95=${p95.toFixed(0)}ms (budget 1500ms)`
      : `API latency P95=${p95.toFixed(0)}ms (budget 1500ms)`;

  return {
    status,
    sampleCount: durations.length,
    windowHours: 24,
    p95,
    budgetMs: 1500,
    requiredRoutes: REQUIRED_API_LATENCY_ROUTES,
    missingRequiredRoutes,
    routeBreakdown,
    ok: p95 <= 1500 && durations.length > 0 && missingRequiredRoutes.length === 0,
    message:
      missingRequiredRoutes.length > 0
        ? `${baseMessage}. Missing required route latency samples: ${missingRequiredRoutes.join(', ')}`
        : baseMessage,
    source,
  };
}

function buildUnavailablePayload(reason: string) {
  return {
    ok: false,
    status: 'critical',
    sampleCount: 0,
    windowHours: 24,
    p95: null,
    budgetMs: 1500,
    message: reason,
    source: 'unavailable' as const,
    requiredRoutes: REQUIRED_API_LATENCY_ROUTES,
    missingRequiredRoutes: REQUIRED_API_LATENCY_ROUTES,
    routeBreakdown: [],
  };
}

export async function GET(request: Request) {
  const unauthorized = requireInternalOpsRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
    let performanceMetricsError: string | null = null;
    let analyticsError: string | null = null;
    let rows: PerfDurationRow[] = [];

    try {
      const performanceRows = await db
        .select({
          route: performanceMetrics.apiEndpoint,
          duration: sql<number>`
            COALESCE(
              ${performanceMetrics.p95}::float,
              ${performanceMetrics.valueMs}::float
            )
          `,
        })
        .from(performanceMetrics)
        .where(
          and(
            gte(performanceMetrics.timestamp, since),
            sql`${performanceMetrics.metricType} = 'api_latency'`,
            sql`${performanceMetrics.apiEndpoint} IS NOT NULL`
          )
        );

      rows = performanceRows.map((row) => ({
        route: normalizeRoute(row.route),
        duration: row.duration,
      }));
    } catch (error) {
      performanceMetricsError =
        error instanceof Error ? error.message : 'unknown performance metrics error';
    }

    rows = rows.filter((row) => typeof row.duration === 'number' && Number.isFinite(row.duration));

    if (rows.length > 0) {
      return NextResponse.json(buildPerfPayload(rows, 'performance_metrics'));
    }

    try {
      const analyticsRows = await db
        .select({
          route: sql<string>`
            COALESCE(
              NULLIF(properties ->> 'api_endpoint', ''),
              NULLIF(properties ->> 'endpoint', ''),
              NULLIF(properties ->> 'route', '')
            )
          `,
          duration: sql<number>`
            COALESCE(
              NULLIF(properties ->> 'duration_ms', '')::float,
              NULLIF(properties ->> 'duration', '')::float
            )
          `,
        })
        .from(analyticsEvents)
        .where(
          and(
            gte(analyticsEvents.createdAt, since),
            sql`(
              ${analyticsEvents.eventType} = 'api_latency'
              OR (${analyticsEvents.eventType} = 'performance_metric' AND ${analyticsEvents.properties} ->> 'metric' = 'api_latency')
              OR (${analyticsEvents.eventType} = 'custom' AND ${analyticsEvents.properties} ->> 'legacy_event_type' = 'api_latency')
            )`
          )
        );

      rows = analyticsRows.map((row) => ({
        route: normalizeRoute(row.route),
        duration: row.duration,
      }));
    } catch (error) {
      analyticsError = error instanceof Error ? error.message : 'unknown analytics error';
    }

    rows = rows.filter((row) => typeof row.duration === 'number' && Number.isFinite(row.duration));

    if (rows.length > 0) {
      return NextResponse.json(buildPerfPayload(rows, 'analytics_events'));
    }

    const noDataReason = [
      performanceMetricsError
        ? `Could not read performance_metrics api_latency samples (${performanceMetricsError}).`
        : 'No performance_metrics api_latency samples in the last 24h.',
      analyticsError
        ? `Could not read legacy api_latency events (${analyticsError}).`
        : 'No legacy api_latency events in the last 24h.',
    ].join(' ');

    try {
      const origin = new URL(request.url).origin;
      const probeDurations = await probeHealthDurations(origin, 10);

      return NextResponse.json(
        buildPerfPayload(
          probeDurations.map((duration) => ({ route: '/api/health', duration })),
          'probe',
          noDataReason
        )
      );
    } catch (probeError) {
      const probeReason = probeError instanceof Error ? probeError.message : 'unknown probe error';
      return NextResponse.json(
        buildUnavailablePayload(
          `${noDataReason} Fallback /api/health probe failed (${probeReason}).`
        )
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to compute performance status',
        message,
      },
      { status: 500 }
    );
  }
}
