import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as linkedinAuthGet } from '@/app/api/auth/linkedin/route';
import { GET as linkedinCallbackGet } from '@/app/api/auth/linkedin/callback/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: null },
        error: null,
      })),
    },
  })),
}));

describe('LinkedIn OAuth redirects', () => {
  it('GET /api/auth/linkedin redirects unauthenticated users to /login', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('/login?error=unauthorized');
  });

  it('GET /api/auth/linkedin/callback redirects state mismatch to integrations by default', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin/callback?code=abc&state=bad', {
      headers: {
        cookie: 'linkedin_oauth_state=good; linkedin_oauth_user=user_123',
      },
    });
    const res = await linkedinCallbackGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/app/i/settings');
    expect(url.searchParams.get('tab')).toBe('integrations');
    expect(url.searchParams.get('error')).toBe('linkedin_auth_failed');
  });

  it('GET /api/auth/linkedin/callback redirects state mismatch to verification target when context cookie is verification', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin/callback?code=abc&state=bad', {
      headers: {
        cookie:
          'linkedin_oauth_state=good; linkedin_oauth_user=user_123; linkedin_oauth_context=verification',
      },
    });
    const res = await linkedinCallbackGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/app/i/settings');
    expect(url.searchParams.get('tab')).toBe('account');
    expect(url.searchParams.get('verification_error')).toBe('linkedin_auth_failed');
  });

  it('GET /api/auth/linkedin/callback falls back to integrations when context cookie is invalid', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin/callback?code=abc&state=bad', {
      headers: {
        cookie:
          'linkedin_oauth_state=good; linkedin_oauth_user=user_123; linkedin_oauth_context=unexpected',
      },
    });
    const res = await linkedinCallbackGet(req);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const url = new URL(location!);
    expect(url.pathname).toBe('/app/i/settings');
    expect(url.searchParams.get('tab')).toBe('integrations');
    expect(url.searchParams.get('error')).toBe('linkedin_auth_failed');
  });
});
