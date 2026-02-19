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

import { POST } from '@/app/api/analytics/dashboard-load-time/route';
import { createClient } from '@/lib/supabase/server';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';
import { db } from '@/db';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/analytics/dashboard-load-time', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
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

describe('POST /api/analytics/dashboard-load-time', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue(mockSupabaseUser('user-1') as any);
    (requireAnalyticsConsentForUser as any).mockResolvedValue(true);
    (db.execute as any).mockResolvedValue([]);
  });

  it('skips telemetry for unauthenticated callers', async () => {
    vi.mocked(createClient).mockResolvedValue(mockSupabaseUser(null) as any);

    const response = await POST(
      buildRequest({
        dashboardType: 'org',
        loadTimeMs: 850,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('skips telemetry when analytics consent is missing', async () => {
    (requireAnalyticsConsentForUser as any).mockResolvedValue(false);

    const response = await POST(
      buildRequest({
        dashboardType: 'org',
        loadTimeMs: 850,
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('records dashboard load metrics when consent is granted', async () => {
    const response = await POST(
      buildRequest({
        dashboardType: 'org',
        loadTimeMs: 1250,
        tileCount: 8,
      })
    );

    expect(response.status).toBe(200);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(
      buildRequest({
        dashboardType: 'org',
      })
    );

    expect(response.status).toBe(400);
    expect(db.execute).not.toHaveBeenCalled();
  });
});
