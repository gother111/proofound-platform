import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '@/middleware';

describe('middleware CSRF behavior', () => {
  beforeEach(() => {
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    delete process.env.KV_REST_API_READ_ONLY_TOKEN;
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
});
