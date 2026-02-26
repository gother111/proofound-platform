import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/lib/privacy/analytics-consent', () => ({
  requireAnalyticsConsentForUser: vi.fn(),
}));

import { POST } from '@/app/api/analytics/dashboard/route';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/analytics/dashboard', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('POST /api/analytics/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
    (trackEvent as any).mockResolvedValue(undefined);
    (requireAnalyticsConsentForUser as any).mockResolvedValue(true);
  });

  it('skips telemetry when analytics consent is missing', async () => {
    (requireAnalyticsConsentForUser as any).mockResolvedValue(false);

    const response = await POST(
      buildRequest({
        eventType: 'dashboard_viewed',
        properties: {},
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid dashboard event types', async () => {
    const response = await POST(
      buildRequest({
        eventType: 'not_allowed',
      })
    );

    expect(response.status).toBe(400);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it('records telemetry when consent is granted', async () => {
    const request = buildRequest({
      eventType: 'dashboard_tile_reordered',
      properties: {
        widgetId: 'next-actions',
        oldIndex: 2,
        newIndex: 0,
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(trackEvent).toHaveBeenCalledWith(
      'dashboard_tile_reordered',
      expect.objectContaining({
        widget_id: 'next-actions',
        old_index: 2,
        new_index: 0,
      }),
      request,
      'user-1'
    );
  });
});
