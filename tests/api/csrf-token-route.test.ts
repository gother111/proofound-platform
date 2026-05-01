import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/csrf-token/route';
import { generateSignedCSRFToken, verifyCSRFToken } from '@/lib/csrf';

describe('/api/csrf-token route', () => {
  beforeEach(() => {
    process.env.CSRF_SECRET = 'csrf-signing-secret-value';
  });

  it('returns token, sets cookie, and disables caching', async () => {
    const request = new NextRequest('http://localhost/api/csrf-token', {
      method: 'GET',
    });

    const response = await GET(request);
    const body = await response.json();
    const setCookie = response.headers.get('set-cookie') || '';

    expect(response.status).toBe(200);
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    expect(setCookie).toContain('csrf_token=');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('pragma')).toBe('no-cache');
    expect(response.headers.get('expires')).toBe('0');

    const verifyRequest = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'x-csrf-token': body.token,
        Cookie: `csrf_token=${body.token}`,
      },
    });
    await expect(verifyCSRFToken(verifyRequest)).resolves.toBe(true);
  });

  it('rotates a stale token after the auth session changes', async () => {
    const staleToken = await generateSignedCSRFToken(
      new NextRequest('http://localhost/api/csrf-token', {
        headers: {
          Cookie: 'sb-localhost-auth-token=session-value',
        },
      })
    );
    const request = new NextRequest('http://localhost/api/csrf-token', {
      method: 'GET',
      headers: {
        Cookie: `csrf_token=${staleToken}; sb-localhost-auth-token=other-session-value`,
      },
    });

    const response = await GET(request);
    const body = (await response.json()) as { token: string };

    expect(body.token).not.toBe(staleToken);
  });
});
