import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/analytics/events', () => ({
  emitTourStarted: vi.fn(),
  emitTourCompleted: vi.fn(),
  emitTourSkipped: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

vi.mock('@/lib/privacy/analytics-consent', () => ({
  requireAnalyticsConsentForUser: vi.fn(),
}));

import { POST } from '@/app/api/analytics/tour-event/route';
import { requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';
import { emitTourCompleted, emitTourSkipped, emitTourStarted } from '@/lib/analytics/events';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/analytics/tour-event', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('POST /api/analytics/tour-event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuth as any).mockResolvedValue({
      user: { id: 'server-user-id' },
      supabase: {},
    });
    (requireAnalyticsConsentForUser as any).mockResolvedValue(true);
  });

  it('returns auth guard response for unauthenticated callers', async () => {
    (requireApiAuth as any).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(buildRequest({ event: 'started' }));

    expect(response.status).toBe(401);
    expect(emitTourStarted).not.toHaveBeenCalled();
  });

  it('skips telemetry when analytics consent is missing', async () => {
    (requireAnalyticsConsentForUser as any).mockResolvedValue(false);

    const response = await POST(buildRequest({ event: 'started' }));
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload).toEqual({ success: true, skipped: 'analytics_consent_missing' });
    expect(emitTourStarted).not.toHaveBeenCalled();
  });

  it('uses authenticated server identity and ignores spoofed body userId', async () => {
    const response = await POST(
      buildRequest({
        event: 'started',
        userId: 'spoofed-user-id',
      })
    );

    expect(response.status).toBe(200);
    expect(emitTourStarted).toHaveBeenCalledWith('server-user-id');
    expect(emitTourCompleted).not.toHaveBeenCalled();
    expect(emitTourSkipped).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid tour event types', async () => {
    const response = await POST(buildRequest({ event: 'invalid' }));
    expect(response.status).toBe(400);
    expect(emitTourStarted).not.toHaveBeenCalled();
    expect(emitTourCompleted).not.toHaveBeenCalled();
    expect(emitTourSkipped).not.toHaveBeenCalled();
  });
});
