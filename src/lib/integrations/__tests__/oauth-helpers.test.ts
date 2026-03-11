import { afterEach, describe, expect, it } from 'vitest';
import {
  buildOAuthCallbackHtml,
  resolveIntegrationReturnPath,
  resolveOAuthRedirectUri,
} from '@/lib/integrations/oauth-helpers';

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

    expect(html).toContain('/app/i/settings?tab=integrations\\u0026success=zoom_connected');
    expect(html).toContain('zoom_connected');
  });

  it('escapes script-breaking characters in inline callback script payloads', () => {
    const html = buildOAuthCallbackHtml({
      defaultType: '</script><script>alert(1)</script>',
      redirectBasePath: "/app/</script><script>alert('xss')</script>",
    });

    expect(html).not.toContain('</script><script>alert');
    expect(html).toContain('\\u003C/script\\u003E\\u003Cscript\\u003Ealert(1)');
    expect(html).toContain("\\u003C/script\\u003E\\u003Cscript\\u003Ealert('xss')");
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

  it('prefers request origin when configured for multi-domain callbacks', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    const request = {
      nextUrl: new URL('https://demo.proofound.io/api/auth/linkedin'),
    } as any;

    expect(
      resolveOAuthRedirectUri(request, undefined, '/api/auth/linkedin/callback', {
        preferRequestOrigin: true,
      })
    ).toBe('https://demo.proofound.io/api/auth/linkedin/callback');
  });

  it('resolves relative configured redirect against request origin when preferred', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    const request = {
      nextUrl: new URL('https://demo.proofound.io/api/auth/linkedin'),
    } as any;

    expect(
      resolveOAuthRedirectUri(request, '/api/auth/linkedin/callback', '/api/fallback', {
        preferRequestOrigin: true,
      })
    ).toBe('https://demo.proofound.io/api/auth/linkedin/callback');
  });

  it('returns sanitized integration return path for valid app route', () => {
    expect(resolveIntegrationReturnPath('/app/o/acme/settings/integrations')).toBe(
      '/app/o/acme/settings/integrations'
    );
  });

  it('falls back to default integration path for invalid return path', () => {
    expect(resolveIntegrationReturnPath('https://evil.example')).toBe(
      '/app/i/settings?tab=integrations'
    );
  });
});
