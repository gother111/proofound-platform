import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getConsentCheck: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/workflow/service', () => ({
  getConsentCheck: mocks.getConsentCheck,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET as getCurrentUser } from '@/app/api/user/me/route';
import { GET as getConsentCheckRoute } from '@/app/api/user/consent/check/route';
import { log } from '@/lib/log';

function mockSupabaseUser(user: { id: string; email?: string | null } | null) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: user ? null : { message: 'unauthorized' },
      }),
    },
  };
}

describe('current user and consent check routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(
      mockSupabaseUser({ id: 'user-1', email: 'u@example.com' })
    );
    mocks.getConsentCheck.mockResolvedValue({
      needsConsent: false,
      tosUpToDate: true,
      privacyUpToDate: true,
      missingConsents: [],
    });
  });

  it('returns the authenticated user identity', async () => {
    const response = await getCurrentUser(new NextRequest('http://localhost/api/user/me'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ id: 'user-1', email: 'u@example.com' });
  });

  it('logs current-user failures with structured diagnostics', async () => {
    const routeError = new Error('session lookup failed');
    mocks.createClient.mockRejectedValueOnce(routeError);

    const response = await getCurrentUser(new NextRequest('http://localhost/api/user/me'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
    expect(log.error).toHaveBeenCalledWith('user.me.get_failed', { error: routeError });
  });

  it('returns the authenticated user consent check', async () => {
    const response = await getConsentCheckRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      needsConsent: false,
      tosUpToDate: true,
      privacyUpToDate: true,
      missingConsents: [],
    });
    expect(mocks.getConsentCheck).toHaveBeenCalledWith('user-1');
  });

  it('logs consent-check failures with structured diagnostics', async () => {
    const routeError = new Error('consent lookup failed');
    mocks.getConsentCheck.mockRejectedValueOnce(routeError);

    const response = await getConsentCheckRoute();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Internal server error' });
    expect(log.error).toHaveBeenCalledWith('user.consent_check.get_failed', {
      error: routeError,
    });
  });
});
