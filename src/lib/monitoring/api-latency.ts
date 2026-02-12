/**
 * API Latency Logging
 * Implements PRD Gap 2: API performance monitoring
 *
 * Tracks API endpoint latency to ensure ≤ 1.5s (P95) per PRD requirement
 */

interface APILatencyLog {
  path: string;
  method: string;
  duration: number; // milliseconds
  status: number;
  requestId: string;
}

/**
 * Log API latency to analytics
 * PRD target: ≤ 1.5s (P95)
 */
export async function logAPILatency(data: APILatencyLog): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      // Without a base URL we can't log; avoid throwing in middleware/cron contexts
      return;
    }

    // Store in analytics for aggregation
    await fetch(new URL('/api/analytics/events', baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'api_latency',
        properties: {
          path: data.path,
          method: data.method,
          duration_ms: data.duration,
          status: data.status,
          request_id: data.requestId,
          meets_target: data.duration <= 1500, // PRD requirement: P95 ≤ 1.5s
        },
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Don't throw - latency logging should not break requests
    console.error('Failed to log API latency:', error);
  }
}

/**
 * Calculate percentile from sorted array
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const rank = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  if (lower === upper) return sorted[lower];
  const weight = rank - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Check if API latency meets PRD performance targets
 */
export function meetsPerformanceTarget(p95Latency: number): boolean {
  return p95Latency <= 1500; // 1.5s per PRD
}

/**
 * Get performance status based on latency
 */
export function getPerformanceStatus(p95: number): 'excellent' | 'good' | 'warning' | 'critical' {
  if (p95 <= 500) return 'excellent'; // < 500ms
  if (p95 <= 1000) return 'good'; // < 1s
  if (p95 <= 1500) return 'warning'; // < 1.5s (PRD target)
  return 'critical'; // > 1.5s
}
