import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { GET } from '../perf-status/route';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

function selectResult(rows: Array<{ route?: string | null; duration: number | null }>) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  };
}

function mockSelectRows(
  ...rowSets: Array<Array<{ route?: string | null; duration: number | null }>>
) {
  (db.select as any).mockImplementation(() => selectResult(rowSets.shift() ?? []));
}

const CRON_SECRET = 'perf-status-test-secret';

function authenticatedRequest() {
  return new Request('https://example.com/api/monitoring/perf-status', {
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe('/api/monitoring/perf-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', CRON_SECRET);
    vi.stubEnv('INTERNAL_API_SECRET', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('requires internal launch-ops auth', async () => {
    const response = await GET(new Request('https://example.com/api/monitoring/perf-status'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns performance-metrics payload when api latency samples exist', async () => {
    mockSelectRows([
      { route: '/api/assignments', duration: 100 },
      { route: '/api/assignments', duration: 400 },
      { route: '/api/assignments', duration: 900 },
    ]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('performance_metrics');
    expect(body.sampleCount).toBe(3);
    expect(body.p95).toBeCloseTo(850, 10);
    expect(body.message).toContain('API latency P95=850ms');
    expect(body.ok).toBe(true);
    expect(body.missingRequiredRoutes).toEqual([]);
    expect(body.routeBreakdown).toEqual([
      { route: '/api/assignments', sampleCount: 3, p95: expect.closeTo(850, 10) },
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('filters null performance durations before percentile calculation', async () => {
    mockSelectRows([
      { route: '/api/assignments', duration: null },
      { route: '/api/assignments', duration: 200 },
      { route: '/api/assignments', duration: 800 },
    ]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('performance_metrics');
    expect(body.sampleCount).toBe(2);
    expect(body.p95).toBeCloseTo(770, 10);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('keeps the gate closed when required route latency samples are missing', async () => {
    mockSelectRows([{ route: '/api/health', duration: 80 }]);

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('performance_metrics');
    expect(body.ok).toBe(false);
    expect(body.missingRequiredRoutes).toEqual(['/api/assignments']);
    expect(body.message).toContain('Missing required route latency samples: /api/assignments');
  });

  it('falls back to legacy analytics events when performance metrics are absent', async () => {
    mockSelectRows(
      [],
      [
        { route: '/api/assignments', duration: 100 },
        { route: '/api/assignments', duration: 300 },
      ]
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('analytics_events');
    expect(body.sampleCount).toBe(2);
    expect(body.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls back to health probe when no analytics events are available', async () => {
    mockSelectRows(
      [{ route: '/api/assignments', duration: null }],
      [{ route: null, duration: null }]
    );
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('probe');
    expect(body.ok).toBe(false);
    expect(body.sampleCount).toBe(10);
    expect(body.missingRequiredRoutes).toEqual(['/api/assignments']);
    expect(body.message).toContain('No performance_metrics api_latency samples in the last 24h.');
    expect(body.message).toContain('No legacy api_latency events in the last 24h.');
    expect(fetchSpy).toHaveBeenCalledTimes(11);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api/health', { cache: 'no-store' });
  });

  it('returns degraded payload when analytics and probe are unavailable', async () => {
    mockSelectRows([], []);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error', { status: 500 }));

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.source).toBe('unavailable');
    expect(body.status).toBe('critical');
    expect(body.missingRequiredRoutes).toEqual(['/api/assignments']);
    expect(body.message).toContain('Fallback /api/health probe failed');
  });
});
