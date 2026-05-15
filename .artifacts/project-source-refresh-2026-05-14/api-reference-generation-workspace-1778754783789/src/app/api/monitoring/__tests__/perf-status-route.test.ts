import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { GET } from '../perf-status/route';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

function mockSelectRows(rows: Array<{ duration: number | null }>) {
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  });
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

  it('returns analytics-based payload when api_latency events exist', async () => {
    mockSelectRows([{ duration: 100 }, { duration: 400 }, { duration: 900 }]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('analytics_events');
    expect(body.sampleCount).toBe(3);
    expect(body.p95).toBeCloseTo(850, 10);
    expect(body.message).toContain('API latency P95=850ms');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('filters null analytics durations before percentile calculation', async () => {
    mockSelectRows([{ duration: null }, { duration: 200 }, { duration: 800 }]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('analytics_events');
    expect(body.sampleCount).toBe(2);
    expect(body.p95).toBeCloseTo(770, 10);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('falls back to health probe when no analytics events are available', async () => {
    mockSelectRows([{ duration: null }]);
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe('probe');
    expect(body.sampleCount).toBe(10);
    expect(body.message).toContain('No api_latency events in the last 24h.');
    expect(fetchSpy).toHaveBeenCalledTimes(11);
    expect(fetchSpy).toHaveBeenCalledWith('https://example.com/api/health', { cache: 'no-store' });
  });

  it('returns degraded payload when analytics and probe are unavailable', async () => {
    mockSelectRows([]);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('error', { status: 500 }));

    const response = await GET(authenticatedRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.source).toBe('unavailable');
    expect(body.status).toBe('critical');
    expect(body.message).toContain('Fallback /api/health probe failed');
  });
});
