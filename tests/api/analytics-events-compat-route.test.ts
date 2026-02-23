import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/analytics/events', () => ({
  emitEvent: vi.fn(),
  EVENT_TYPES: ['profile_created', 'custom'],
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
  isTrustedInternalRequest: vi.fn(),
  isActiveOrgMember: vi.fn(),
}));

vi.mock('@/lib/privacy/analytics-consent', () => ({
  requireAnalyticsConsentForUser: vi.fn(),
}));

import { POST } from '@/app/api/analytics/events/route';
import { emitEvent } from '@/lib/analytics/events';
import { isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';
import { requireAnalyticsConsentForUser } from '@/lib/privacy/analytics-consent';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('POST /api/analytics/events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (emitEvent as any).mockResolvedValue('ok');
    (isTrustedInternalRequest as any).mockReturnValue(false);
    (requireAnalyticsConsentForUser as any).mockResolvedValue(true);
  });

  it('maps unknown legacy event_type values into custom events', async () => {
    (requireApiAuth as any).mockResolvedValue({
      user: { id: 'server-user-id' },
      supabase: {},
    });

    const response = await POST(
      buildRequest({
        event_type: 'burnout_risk_detected',
        event_data: { totalHours: 65 },
      })
    );

    expect(response.status).toBe(200);
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'custom',
        userId: 'server-user-id',
        properties: expect.objectContaining({
          legacy_event_type: 'burnout_risk_detected',
          totalHours: 65,
        }),
      })
    );
  });

  it('passes through known eventType values', async () => {
    (requireApiAuth as any).mockResolvedValue({
      user: { id: 'server-user-id' },
      supabase: {},
    });

    const response = await POST(
      buildRequest({
        eventType: 'profile_created',
        properties: { source: 'test' },
      })
    );

    expect(response.status).toBe(200);
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'profile_created',
        userId: 'server-user-id',
      })
    );
  });

  it('allows trusted internal payload identity', async () => {
    (isTrustedInternalRequest as any).mockReturnValue(true);
    (requireApiAuth as any).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(
      buildRequest({
        event_type: 'profile_created',
        user_id: 'internal-user-id',
      })
    );

    expect(response.status).toBe(200);
    expect(requireAnalyticsConsentForUser).not.toHaveBeenCalled();
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'internal-user-id',
      })
    );
  });
});
