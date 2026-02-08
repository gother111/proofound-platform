import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { csrfProtection } from '@/lib/csrf';

describe('csrfProtection supabase session detection', () => {
  it('bypasses CSRF for internal routes when Supabase auth cookie is present', () => {
    const req = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      headers: {
        cookie: 'sb-aaaaaaaaaaaaaaaaaaaa-auth-token=token',
      },
    });

    const res = csrfProtection(req);
    expect(res).toBeNull();
  });

  it('bypasses CSRF for chunked Supabase auth cookies', () => {
    const req = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      headers: {
        cookie:
          'sb-aaaaaaaaaaaaaaaaaaaa-auth-token.0=token; sb-aaaaaaaaaaaaaaaaaaaa-auth-token.1=token2',
      },
    });

    const res = csrfProtection(req);
    expect(res).toBeNull();
  });

  it('rejects mutating requests without CSRF token when no Supabase session cookie', async () => {
    const req = new NextRequest('http://localhost/api/analytics/track', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const res = csrfProtection(req);
    expect(res).not.toBeNull();
    expect(res?.status).toBe(403);
    const json = await res!.json();
    expect(json.error).toBe('CSRF validation failed');
  });
});
