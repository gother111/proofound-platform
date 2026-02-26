import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as linkedinAuthGet } from '@/app/api/auth/linkedin/route';
import { GET as linkedinCallbackGet } from '@/app/api/auth/linkedin/callback/route';

const getUserMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

describe('LinkedIn OAuth redirects', () => {
  const originalLinkedInClientId = process.env.LINKEDIN_CLIENT_ID;
  const originalLinkedInRedirect = process.env.LINKEDIN_REDIRECT_URI;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_URL;
  const originalLegacySiteUrl = process.env.SITE_URL;

  beforeEach(() => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: null,
    });
  });

  afterEach(() => {
    process.env.LINKEDIN_CLIENT_ID = originalLinkedInClientId;
    process.env.LINKEDIN_REDIRECT_URI = originalLinkedInRedirect;
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_URL = originalPublicUrl;
    process.env.SITE_URL = originalLegacySiteUrl;
    getUserMock.mockReset();
  });

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

  it('GET /api/auth/linkedin uses LINKEDIN_REDIRECT_URI when configured', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'linkedin-client-id';
    process.env.LINKEDIN_REDIRECT_URI = 'https://proofound.io/api/auth/linkedin/callback';
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user_1' } },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/auth/linkedin?context=verification');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const linkedinUrl = new URL(location!);
    expect(linkedinUrl.hostname).toBe('www.linkedin.com');
    expect(linkedinUrl.searchParams.get('redirect_uri')).toBe(
      'https://proofound.io/api/auth/linkedin/callback'
    );
    const scope = linkedinUrl.searchParams.get('scope') || '';
    expect(scope).toContain('r_verify');
    expect(scope).toContain('r_profile_basicinfo');
  });

  it('GET /api/auth/linkedin falls back to request origin when public site env vars are missing', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'linkedin-client-id';
    delete process.env.LINKEDIN_REDIRECT_URI;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    process.env.SITE_URL = 'https://proofound.io';
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user_1' } },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const linkedinUrl = new URL(location!);
    expect(linkedinUrl.searchParams.get('redirect_uri')).toBe(
      'http://localhost/api/auth/linkedin/callback'
    );
  });
});
