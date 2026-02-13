import { afterEach, describe, expect, it } from 'vitest';
import { resolveLinkedInRedirectUri } from '@/lib/linkedin';

describe('resolveLinkedInRedirectUri', () => {
  const originalLinkedInRedirect = process.env.LINKEDIN_REDIRECT_URI;
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalPublicUrl = process.env.NEXT_PUBLIC_URL;
  const originalLegacySiteUrl = process.env.SITE_URL;

  afterEach(() => {
    process.env.LINKEDIN_REDIRECT_URI = originalLinkedInRedirect;
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.NEXT_PUBLIC_URL = originalPublicUrl;
    process.env.SITE_URL = originalLegacySiteUrl;
  });

  it('uses LINKEDIN_REDIRECT_URI when set to an absolute URL', () => {
    process.env.LINKEDIN_REDIRECT_URI = 'https://proofound.io/api/auth/linkedin/callback';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://ignored.example';

    const request = {
      nextUrl: new URL('https://request-origin.example/api/auth/linkedin'),
    } as any;

    expect(resolveLinkedInRedirectUri(request)).toBe(
      'https://proofound.io/api/auth/linkedin/callback'
    );
  });

  it('resolves relative LINKEDIN_REDIRECT_URI against NEXT_PUBLIC_SITE_URL', () => {
    process.env.LINKEDIN_REDIRECT_URI = '/api/auth/linkedin/callback';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';

    const request = {
      nextUrl: new URL('https://request-origin.example/api/auth/linkedin'),
    } as any;

    expect(resolveLinkedInRedirectUri(request)).toBe(
      'https://proofound.io/api/auth/linkedin/callback'
    );
  });

  it('falls back to SITE_URL when NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_URL are missing', () => {
    delete process.env.LINKEDIN_REDIRECT_URI;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    process.env.SITE_URL = 'https://proofound.io';

    const request = {
      nextUrl: new URL('https://request-origin.example/api/auth/linkedin'),
    } as any;

    expect(resolveLinkedInRedirectUri(request)).toBe(
      'https://proofound.io/api/auth/linkedin/callback'
    );
  });

  it('falls back to request origin when no configured callback or site env is set', () => {
    delete process.env.LINKEDIN_REDIRECT_URI;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_URL;
    delete process.env.SITE_URL;

    const request = {
      nextUrl: new URL('https://request-origin.example/api/auth/linkedin'),
    } as any;

    expect(resolveLinkedInRedirectUri(request)).toBe(
      'https://request-origin.example/api/auth/linkedin/callback'
    );
  });
});
