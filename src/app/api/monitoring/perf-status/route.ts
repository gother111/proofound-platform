import { NextResponse } from 'next/server';
import { db } from '@/db';
import { analyticsEvents } from '@/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { getPerformanceStatus } from '@/lib/monitoring/api-latency';

export const dynamic = 'force-dynamic';

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export async function GET() {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

    const rows = await db
      .select({
        duration: sql<number>`(properties ->> 'duration_ms')::float`,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, 'api_latency'),
          gte(analyticsEvents.createdAt, since)
        )
      );

    const durations = rows
      .map((r) => r.duration)
      .filter((n) => typeof n === 'number' && Number.isFinite(n));

    const p95 = percentile(durations, 95);
    const status = getPerformanceStatus(p95);

    return NextResponse.json({
      status,
      sampleCount: durations.length,
      windowHours: 24,
      p95,
      budgetMs: 1500,
      ok: p95 <= 1500 && durations.length > 0,
      message:
        durations.length === 0
          ? 'No api_latency events in the last 24h'
          : `API latency P95=${p95.toFixed(0)}ms (budget 1500ms)`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to compute performance status' },
      { status: 500 }
    );
  }
}

