import { afterEach, describe, expect, it } from 'vitest';
import { buildOAuthCallbackHtml, resolveOAuthRedirectUri } from '@/lib/integrations/oauth-helpers';

describe('oauth helpers', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_URL = originalPublicUrl;
  });

  it('builds callback html with success redirect and message type', () => {
    const html = buildOAuthCallbackHtml({
      success: 'zoom_connected',
      defaultType: 'zoom_oauth',
    });

    expect(html).toContain('/app/i/settings/integrations?success=zoom_connected');
    expect(html).toContain('zoom_connected');
  });

  it('uses absolute configured redirect uri as-is', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    const request = {
      nextUrl: new URL('https://request-origin.example/api/integrations/zoom/callback'),
    } as any;

    expect(
      resolveOAuthRedirectUri(request, 'https://provider.example/callback', '/api/fallback')
    ).toBe('https://provider.example/callback');
  });

  it('resolves relative configured redirect uri using NEXT_PUBLIC_SITE_URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    const request = {
      nextUrl: new URL('https://request-origin.example/api/integrations/google/connect'),
    } as any;

    expect(
      resolveOAuthRedirectUri(request, '/api/integrations/google/callback', '/api/fallback')
    ).toBe('https://proofound.io/api/integrations/google/callback');
  });

  it('falls back to request origin when no base env or configured redirect is set', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    const request = {
      nextUrl: new URL('https://request-origin.example/api/integrations/zoom/callback'),
    } as any;

    expect(resolveOAuthRedirectUri(request, undefined, '/api/integrations/zoom/callback')).toBe(
      'https://request-origin.example/api/integrations/zoom/callback'
    );
  });
});
