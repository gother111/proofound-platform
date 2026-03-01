import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/csrf-token/route';

describe('/api/csrf-token route', () => {
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
  });
});
