import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { requireApiAuthContextMock, getZoomAuthUrlMock, exchangeZoomCodeMock, dbExecuteMock } =
  vi.hoisted(() => ({
    requireApiAuthContextMock: vi.fn(),
    getZoomAuthUrlMock: vi.fn(),
    exchangeZoomCodeMock: vi.fn(),
    dbExecuteMock: vi.fn(),
  }));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: requireApiAuthContextMock,
}));

vi.mock('@/lib/integrations/zoom', () => ({
  getZoomAuthUrl: getZoomAuthUrlMock,
  exchangeZoomCode: exchangeZoomCodeMock,
}));

vi.mock('@/db', () => ({
  db: {
    execute: dbExecuteMock,
  },
}));

import { GET as zoomConnectGet } from '@/app/api/integrations/zoom/connect/route';
import { GET as zoomCallbackGet } from '@/app/api/integrations/zoom/callback/route';

describe('zoom integration oauth redirect resolution', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_URL;
  const originalRedirectUri = process.env.ZOOM_REDIRECT_URI;

  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAuthContextMock.mockResolvedValue({ user: { id: 'user-1' } });
    getZoomAuthUrlMock.mockReturnValue('https://zoom.us/oauth/authorize?ok=1');
    exchangeZoomCodeMock.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
    });
    dbExecuteMock.mockResolvedValue([]);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_URL = originalPublicUrl;
    process.env.ZOOM_REDIRECT_URI = originalRedirectUri;
  });

  it('uses request origin for relative ZOOM_REDIRECT_URI in connect route', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.ZOOM_REDIRECT_URI = '/api/integrations/zoom/callback';

    const response = await zoomConnectGet(
      new NextRequest('https://preview.proofound.io/api/integrations/zoom/connect')
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(getZoomAuthUrlMock).toHaveBeenCalledTimes(1);
    expect(getZoomAuthUrlMock.mock.calls[0][0]).toBe(
      'https://preview.proofound.io/api/integrations/zoom/callback'
    );
  });

  it('uses absolute ZOOM_REDIRECT_URI as-is in connect route', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://preview.proofound.io';
    process.env.ZOOM_REDIRECT_URI = 'https://proofound.io/api/integrations/zoom/callback';

    const response = await zoomConnectGet(
      new NextRequest('https://preview.proofound.io/api/integrations/zoom/connect')
    );

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(getZoomAuthUrlMock).toHaveBeenCalledTimes(1);
    expect(getZoomAuthUrlMock.mock.calls[0][0]).toBe(
      'https://proofound.io/api/integrations/zoom/callback'
    );
  });

  it('uses same resolved redirect uri in callback token exchange', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.ZOOM_REDIRECT_URI = '/api/integrations/zoom/callback';

    const response = await zoomCallbackGet(
      new NextRequest(
        'https://preview.proofound.io/api/integrations/zoom/callback?code=abc123&state=state-ok',
        {
          headers: {
            cookie:
              'zoom_oauth_state=state-ok; zoom_oauth_return_to=/app/i/settings?tab=integrations',
          },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(exchangeZoomCodeMock).toHaveBeenCalledTimes(1);
    expect(exchangeZoomCodeMock).toHaveBeenCalledWith(
      'abc123',
      'https://preview.proofound.io/api/integrations/zoom/callback'
    );
    expect(dbExecuteMock).toHaveBeenCalledTimes(1);
  });

  it('clears oauth cookies when callback state mismatches', async () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    process.env.ZOOM_REDIRECT_URI = '/api/integrations/zoom/callback';

    const response = await zoomCallbackGet(
      new NextRequest(
        'https://preview.proofound.io/api/integrations/zoom/callback?code=abc123&state=wrong-state',
        {
          headers: {
            cookie: 'zoom_oauth_state=expected-state; zoom_oauth_return_to=/app/i/settings',
          },
        }
      )
    );

    const setCookieHeader = response.headers.get('set-cookie') || '';
    expect(response.status).toBe(200);
    expect(exchangeZoomCodeMock).not.toHaveBeenCalled();
    expect(setCookieHeader).toContain('zoom_oauth_state=');
    expect(setCookieHeader).toContain('Max-Age=0');
  });
});
