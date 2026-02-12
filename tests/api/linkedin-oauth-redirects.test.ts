import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as linkedinAuthGet } from '@/app/api/auth/linkedin/route';
import { GET as linkedinCallbackGet } from '@/app/api/auth/linkedin/callback/route';
import { createClient } from '@/lib/supabase/server';
import { exchangeLinkedInCode } from '@/lib/linkedin';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/linkedin', () => ({
  generateLinkedInAuthUrl: vi.fn((state: string, redirectUri: string) => {
    const clientId = process.env.LINKEDIN_CLIENT_ID ?? '';
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: 'openid profile email',
    });
    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }),
  exchangeLinkedInCode: vi.fn(),
  fetchLinkedInProfile: vi.fn(),
}));

describe('LinkedIn OAuth redirects', () => {
  const originalLinkedInClientId = process.env.LINKEDIN_CLIENT_ID;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalLinkedInRedirect = process.env.LINKEDIN_REDIRECT_URI;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: null,
        })),
      },
    } as any);
  });

  afterEach(() => {
    process.env.LINKEDIN_CLIENT_ID = originalLinkedInClientId;
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.LINKEDIN_REDIRECT_URI = originalLinkedInRedirect;
  });

  function mockAuthenticatedUser(userId = 'user_123') {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: userId } },
          error: null,
        })),
      },
    } as any);
  }

  it('GET /api/auth/linkedin redirects unauthenticated users to /login', async () => {
    const req = new NextRequest('http://localhost/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    expect(location).toContain('/login?error=unauthorized');
  });

  it('GET /api/auth/linkedin uses request-origin-first redirect fallback for demo/prod domains', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    delete process.env.LINKEDIN_REDIRECT_URI;
    mockAuthenticatedUser('user_123');

    const req = new NextRequest('https://demo.proofound.io/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const authUrl = new URL(location!);
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'https://demo.proofound.io/api/auth/linkedin/callback'
    );
  });

  it('GET /api/auth/linkedin uses absolute LINKEDIN_REDIRECT_URI override as-is', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.LINKEDIN_REDIRECT_URI = 'https://proofound.io/api/auth/linkedin/callback';
    mockAuthenticatedUser('user_123');

    const req = new NextRequest('https://demo.proofound.io/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const authUrl = new URL(location!);
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'https://proofound.io/api/auth/linkedin/callback'
    );
  });

  it('GET /api/auth/linkedin resolves relative LINKEDIN_REDIRECT_URI against request origin', async () => {
    process.env.LINKEDIN_CLIENT_ID = 'client-id';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.LINKEDIN_REDIRECT_URI = '/api/auth/linkedin/callback';
    mockAuthenticatedUser('user_123');

    const req = new NextRequest('https://demo.proofound.io/api/auth/linkedin');
    const res = await linkedinAuthGet(req);

    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);

    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const authUrl = new URL(location!);
    expect(authUrl.searchParams.get('redirect_uri')).toBe(
      'https://demo.proofound.io/api/auth/linkedin/callback'
    );
  });

  it('GET /api/auth/linkedin/callback redirects state mismatch to /app/i/settings (not /settings)', async () => {
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
    expect(location).toContain('/app/i/settings?');
    // Ensure we did not redirect to the old non-existent /settings route.
    expect(location).not.toMatch(/\/\/[^/]+\/settings\?/);
  });

  it('GET /api/auth/linkedin/callback uses same request-origin-first redirect URI in token exchange', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    delete process.env.LINKEDIN_REDIRECT_URI;
    mockAuthenticatedUser('user_123');
    vi.mocked(exchangeLinkedInCode).mockRejectedValueOnce(new Error('exchange failed'));

    const req = new NextRequest(
      'https://demo.proofound.io/api/auth/linkedin/callback?code=abc&state=good',
      {
        headers: {
          cookie: 'linkedin_oauth_state=good; linkedin_oauth_user=user_123',
        },
      }
    );
    const res = await linkedinCallbackGet(req);

    expect(vi.mocked(exchangeLinkedInCode)).toHaveBeenCalledWith(
      'abc',
      'https://demo.proofound.io/api/auth/linkedin/callback'
    );
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const location = res.headers.get('location');
    expect(location).toContain('/app/i/settings?');
    expect(location).toContain('linkedin_auth_failed');
  });
});
