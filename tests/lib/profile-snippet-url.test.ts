import { afterEach, describe, expect, it } from 'vitest';
import { buildPublicProfileURL } from '@/lib/profile/snippet-generator';

const ORIGINAL_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

describe('buildPublicProfileURL', () => {
  afterEach(() => {
    if (ORIGINAL_SITE_URL === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      return;
    }
    process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_SITE_URL;
  });

  it('rewrites legacy proofound.com host to canonical proofound.io', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.com';
    expect(buildPublicProfileURL('abc')).toBe('https://proofound.io/p/abc');
  });

  it('trims trailing slash from configured canonical host', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io/';
    expect(buildPublicProfileURL('abc')).toBe('https://proofound.io/p/abc');
  });

  it('falls back to canonical proofound.io when site url is unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(buildPublicProfileURL('abc')).toBe('https://proofound.io/p/abc');
  });
});
