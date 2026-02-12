import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

vi.mock('@/lib/analytics/events', () => ({
  emitEvent: vi.fn(),
  EVENT_TYPES: ['match_generated', 'profile_created'],
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
  isTrustedInternalRequest: vi.fn(),
  isActiveOrgMember: vi.fn(),
}));

import { POST } from '@/app/api/analytics/track/route';
import { emitEvent } from '@/lib/analytics/events';
import { isActiveOrgMember, isTrustedInternalRequest, requireApiAuth } from '@/lib/api/auth';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/analytics/track', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('POST /api/analytics/track', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (emitEvent as any).mockResolvedValue('ok');
    (isTrustedInternalRequest as any).mockReturnValue(false);
  });

  it('returns 401 for unauthenticated non-internal requests', async () => {
    const unauthorized = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    (requireApiAuth as any).mockResolvedValue(unauthorized);

    const response = await POST(
      buildRequest({
        eventType: 'profile_created',
      })
    );

    expect(response.status).toBe(401);
    expect(emitEvent).not.toHaveBeenCalled();
  });

  it('binds user identity from server auth context', async () => {
    (requireApiAuth as any).mockResolvedValue({
      user: { id: 'server-user-id' },
      supabase: {},
    });

    const response = await POST(
      buildRequest({
        eventType: 'match_generated',
        userId: 'spoofed-user-id',
      })
    );

    expect(response.status).toBe(200);
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'match_generated',
        userId: 'server-user-id',
      })
    );
  });

  it('accepts trusted internal requests with explicit org id', async () => {
    (isTrustedInternalRequest as any).mockReturnValue(true);
    (requireApiAuth as any).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    );

    const response = await POST(
      buildRequest({
        eventType: 'match_generated',
        userId: 'internal-user-id',
        orgId: 'internal-org-id',
      })
    );

    expect(response.status).toBe(200);
    expect(emitEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'internal-user-id',
        orgId: 'internal-org-id',
      })
    );
    expect(isActiveOrgMember).not.toHaveBeenCalled();
  });

  it('rejects inaccessible org ids for authenticated requests', async () => {
    (requireApiAuth as any).mockResolvedValue({
      user: { id: 'server-user-id' },
      supabase: {},
    });
    (isActiveOrgMember as any).mockResolvedValue(false);

    const response = await POST(
      buildRequest({
        eventType: 'match_generated',
        orgId: 'forbidden-org-id',
      })
    );

    expect(response.status).toBe(403);
    expect(emitEvent).not.toHaveBeenCalled();
  });
});
