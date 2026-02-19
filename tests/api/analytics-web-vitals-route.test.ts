import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/privacy/analytics-consent', () => ({
  requireAnalyticsConsentForUser: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { POST } from '@/app/api/analytics/web-vitals/route';
import { createClient } from '@/lib/supabase/server';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';
import { db } from '@/db';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/analytics/web-vitals', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0 test',
    },
  });
}

function mockSupabaseUser(userId: string | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: userId ? { id: userId } : null,
        },
      }),
    },
  };
}

describe('POST /api/analytics/web-vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabaseUser('user-1') as any);
    (requireAnalyticsConsentForUser as any).mockResolvedValue(true);
    (db.execute as any).mockResolvedValue([]);
  });

  it('keeps anonymous skip behavior', async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabaseUser(null) as any);

    const response = await POST(
      buildRequest({
        metricName: 'LCP',
        value: 1200,
        rating: 'good',
        delta: 0,
        id: 'metric-1',
        navigationType: 'navigate',
        pagePath: '/',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true, skipped: 'anonymous' });
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('skips metrics persistence without analytics consent', async () => {
    (requireAnalyticsConsentForUser as any).mockResolvedValue(false);

    const response = await POST(
      buildRequest({
        metricName: 'LCP',
        value: 1200,
        rating: 'good',
        delta: 0,
        id: 'metric-1',
        navigationType: 'navigate',
        pagePath: '/',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('records metrics when analytics consent is granted', async () => {
    const response = await POST(
      buildRequest({
        metricName: 'LCP',
        value: 1200,
        rating: 'good',
        delta: 0,
        id: 'metric-1',
        navigationType: 'navigate',
        pagePath: '/',
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ success: true });
    expect(db.execute).toHaveBeenCalledTimes(1);
  });
});
