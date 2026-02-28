import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { requireApiAuthContextMock, getGoogleAuthUrlMock, exchangeGoogleCodeMock, dbExecuteMock } =
  vi.hoisted(() => ({
    requireApiAuthContextMock: vi.fn(),
    getGoogleAuthUrlMock: vi.fn(),
    exchangeGoogleCodeMock: vi.fn(),
    dbExecuteMock: vi.fn(),
  }));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: requireApiAuthContextMock,
}));

vi.mock('@/lib/integrations/google-meet', () => ({
  getGoogleAuthUrl: getGoogleAuthUrlMock,
  exchangeGoogleCode: exchangeGoogleCodeMock,
}));

vi.mock('@/db', () => ({
  db: {
    execute: dbExecuteMock,
  },
}));

import { GET as googleConnectGet } from '@/app/api/integrations/google/connect/route';
import { GET as googleCallbackGet } from '@/app/api/integrations/google/callback/route';

describe('google integration oauth redirect resolution', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_URL;
  const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAuthContextMock.mockResolvedValue({ user: { id: 'user-1' } });
    getGoogleAuthUrlMock.mockReturnValue('https://accounts.google.com/o/oauth2/v2/auth?ok=1');
    exchangeGoogleCodeMock.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      scope: 'scope-a',
    });
    dbExecuteMock.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_URL = originalPublicUrl;
    process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
  });

  it('uses request origin for relative GOOGLE_REDIRECT_URI in connect route', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.GOOGLE_REDIRECT_URI = '/api/integrations/google/callback';

    const response = await googleConnectGet(
      new NextRequest('https://preview.proofound.io/api/integrations/google/connect')
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(getGoogleAuthUrlMock).toHaveBeenCalledTimes(1);
    expect(getGoogleAuthUrlMock.mock.calls[0][0]).toBe(
      'https://preview.proofound.io/api/integrations/google/callback'
    );
  });

  it('uses absolute GOOGLE_REDIRECT_URI as-is in connect route', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.proofound.io';
    process.env.GOOGLE_REDIRECT_URI = 'https://proofound.io/api/integrations/google/callback';

    const response = await googleConnectGet(
      new NextRequest('https://preview.proofound.io/api/integrations/google/connect')
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(getGoogleAuthUrlMock).toHaveBeenCalledTimes(1);
    expect(getGoogleAuthUrlMock.mock.calls[0][0]).toBe(
      'https://proofound.io/api/integrations/google/callback'
    );
  });

  it('uses same resolved redirect uri in callback token exchange', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.GOOGLE_REDIRECT_URI = '/api/integrations/google/callback';

    const response = await googleCallbackGet(
      new NextRequest(
        'https://preview.proofound.io/api/integrations/google/callback?code=abc123&state=state-ok',
        {
          headers: {
            cookie:
              'google_oauth_state=state-ok; google_oauth_return_to=/app/i/settings?tab=integrations',
          },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(exchangeGoogleCodeMock).toHaveBeenCalledTimes(1);
    expect(exchangeGoogleCodeMock).toHaveBeenCalledWith(
      'abc123',
      'https://preview.proofound.io/api/integrations/google/callback'
    );
    expect(dbExecuteMock).toHaveBeenCalledTimes(1);
  });

  it('clears oauth cookies when callback state mismatches', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.GOOGLE_REDIRECT_URI = '/api/integrations/google/callback';

    const response = await googleCallbackGet(
      new NextRequest(
        'https://preview.proofound.io/api/integrations/google/callback?code=abc123&state=wrong-state',
        {
          headers: {
            cookie: 'google_oauth_state=expected-state; google_oauth_return_to=/app/i/settings',
          },
        }
      )
    );

    const setCookieHeader = response.headers.get('set-cookie') || '';
    expect(response.status).toBe(200);
    expect(exchangeGoogleCodeMock).not.toHaveBeenCalled();
    expect(setCookieHeader).toContain('google_oauth_state=');
    expect(setCookieHeader).toContain('Max-Age=0');
  });
});
