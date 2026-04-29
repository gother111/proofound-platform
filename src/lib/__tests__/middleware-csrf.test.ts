import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

describe('middleware CSRF behavior', () => {
  const cookieAuthMutationRoutes = [
    ['POST', '/api/assignments'],
    ['POST', '/api/org/org-id/matches/match-id/review'],
    ['PATCH', '/api/org/org-id/matches/match-id/review'],
    ['POST', '/api/conversations/conversation-id/reveal'],
    ['POST', '/api/interviews/schedule'],
    ['POST', '/api/decisions'],
    ['POST', '/api/upload/document'],
  ] as const;

  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.CRON_SECRET;
    delete process.env.CRON_SECRET_PREVIEW;
  });

  it('does not mint csrf_token cookie for /api/csrf-token endpoint in middleware', async () => {
    const request = new NextRequest('http://localhost/api/csrf-token', {
      method: 'GET',
    });

    const response = await middleware(request);
    const setCookieHeader = response.headers.get('set-cookie') || '';

    expect(setCookieHeader).not.toContain('csrf_token=');
  });

  it('keeps CSRF protection for regular mutating API routes', async () => {
    const request = new NextRequest('http://localhost/api/conversations', {
      method: 'POST',
    });

    const response = await middleware(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('CSRF validation failed');
  });

  it.each(cookieAuthMutationRoutes)('%s %s without CSRF returns 403', async (method, path) => {
    const request = new NextRequest(`http://localhost${path}`, {
      method,
      headers: {
        Cookie: 'sb-localhost-auth-token=session-value',
      },
    });

    const response = await middleware(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({
      error: 'CSRF validation failed',
      message: 'Request blocked',
    });
  });

  it.each(cookieAuthMutationRoutes)(
    '%s %s with valid CSRF reaches the route layer',
    async (method, path) => {
      const request = new NextRequest(`http://localhost${path}`, {
        method,
        headers: {
          'x-csrf-token': 'valid-token',
          Cookie: 'csrf_token=valid-token; sb-localhost-auth-token=session-value',
        },
      });

      const response = await middleware(request);

      expect(response.status).not.toBe(403);
      expect(response.headers.get('x-middleware-next')).toBe('1');
    }
  );

  it('allows verified internal cron calls without cookie CSRF', async () => {
    process.env.CRON_SECRET = 'server-only-cron-secret';
    const request = new NextRequest('http://localhost/api/cron/decision-reminders', {
      method: 'POST',
      headers: {
        authorization: 'Bearer server-only-cron-secret',
      },
    });

    const response = await middleware(request);

    expect(response.status).not.toBe(403);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('returns archived 410 responses before CSRF enforcement', async () => {
    const request = new NextRequest('http://localhost/api/contracts/example', {
      method: 'POST',
    });

    const response = await middleware(request);
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.launchState).toBe('non_launch');
  });
});
