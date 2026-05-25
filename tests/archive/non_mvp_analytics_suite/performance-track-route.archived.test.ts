import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/privacy/analytics-consent', () => ({
  requireAnalyticsConsentForUser: vi.fn(),
}));

import { POST } from '@/app/api/performance/track/route';
import { db } from '@/db';
import { requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/performance/track', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 test',
    },
  });
}

describe('POST /api/performance/track', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuth as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    });
    (requireAnalyticsConsentForUser as any).mockResolvedValue(true);
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('skips telemetry for unauthenticated callers', async () => {
    (requireApiAuth as any).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(
      buildRequest({
        metricType: 'tti',
        pageRoute: '/',
        valueMs: 1234,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('skips telemetry when analytics consent is missing', async () => {
    (requireAnalyticsConsentForUser as any).mockResolvedValue(false);

    const response = await POST(
      buildRequest({
        metricType: 'tti',
        pageRoute: '/',
        valueMs: 1234,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(
      buildRequest({
        metricType: 'tti',
        valueMs: 1234,
      })
    );

    expect(response.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('persists metric when consent is granted', async () => {
    const response = await POST(
      buildRequest({
        metricType: 'tti',
        pageRoute: '/app',
        valueMs: 1234,
        deviceType: 'desktop',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalledTimes(1);
  });
});
