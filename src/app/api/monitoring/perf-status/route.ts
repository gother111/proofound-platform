import { NextResponse } from 'next/server';
import { performance } from 'node:perf_hooks';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { calculatePercentile, getPerformanceStatus } from '@/lib/monitoring/api-latency';

export const dynamic = 'force-dynamic';
type PerfStatusSource = 'analytics_events' | 'probe';

async function probeHealthDurations(origin: string, sampleCount = 10): Promise<number[]> {
  const healthUrl = `${origin}/api/health`;
  const samples: number[] = [];

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

function buildPerfPayload(durations: number[], source: PerfStatusSource, fallbackReason?: string) {
  const p95 = calculatePercentile(durations, 95);
  const status = getPerformanceStatus(p95);

  return {
    status,
    sampleCount: durations.length,
    windowHours: 24,
    p95,
    budgetMs: 1500,
    ok: p95 <= 1500 && durations.length > 0,
    message:
      source === 'probe' && fallbackReason
        ? `${fallbackReason} Probe /api/health P95=${p95.toFixed(0)}ms (budget 1500ms)`
        : `API latency P95=${p95.toFixed(0)}ms (budget 1500ms)`,
    source,
  };
}

export async function GET(request: Request) {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

    const rows = await db
      .select({
        duration: sql<number>`(properties ->> 'duration_ms')::float`,
      })
      .from(analyticsEvents)
      .where(
        and(eq(analyticsEvents.eventType, 'api_latency'), gte(analyticsEvents.createdAt, since))
      );

    const durations = rows
      .map((r) => r.duration)
      .filter((n) => typeof n === 'number' && Number.isFinite(n));

    if (durations.length > 0) {
      return NextResponse.json(buildPerfPayload(durations, 'analytics_events'));
    }

    const origin = new URL(request.url).origin;
    const probeDurations = await probeHealthDurations(origin, 10);

    return NextResponse.json(
      buildPerfPayload(probeDurations, 'probe', 'No api_latency events in the last 24h.')
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to compute performance status' }, { status: 500 });
  }
}
