import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/analytics/web-vitals/route';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/api/route-helpers', () => ({
  requirePlatformAdminJson: vi.fn(),
}));

describe('/api/analytics/web-vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST inserts into web_vitals_metrics for anonymous users', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      },
    });

    (db.execute as any).mockResolvedValueOnce({ rows: [] });

    const req = new NextRequest('http://localhost/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        metricName: 'INP',
        value: 123,
        rating: 'good',
        delta: 10,
        id: 'metric-id',
        navigationType: 'navigate',
        pagePath: '/app/i/dashboard',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(db.execute).toHaveBeenCalled();
  });

  it('GET returns 403 when not admin', async () => {
    const { requirePlatformAdminJson } = await import('@/lib/api/route-helpers');
    (requirePlatformAdminJson as any).mockResolvedValue(
      NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    );

    const req = new NextRequest('http://localhost/api/analytics/web-vitals?days=7');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('GET returns aggregated metrics when admin', async () => {
    const { requirePlatformAdminJson } = await import('@/lib/api/route-helpers');
    (requirePlatformAdminJson as any).mockResolvedValue({
      userId: 'admin-id',
      adminLevel: 'platform_admin',
    });

    (db.execute as any)
      .mockResolvedValueOnce({
        rows: [
          {
            metric_name: 'INP',
            sample_count: 2,
            avg_value: 120,
            p50: 110,
            p75: 130,
            p95: 140,
            good_count: 2,
            needs_improvement_count: 0,
            poor_count: 0,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            date: '2026-02-08',
            metric_name: 'INP',
            avg_value: 120,
            count: 2,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            page_path: '/app/i/dashboard',
            metric_name: 'INP',
            sample_count: 2,
            avg_value: 120,
            poor_count: 0,
          },
        ],
      });

    const req = new NextRequest('http://localhost/api/analytics/web-vitals?days=7');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.metrics)).toBe(true);
    expect(json.metrics[0].metric_name).toBe('INP');
  });
});
