import { afterEach, describe, expect, it } from 'vitest';

import { resolveCanonicalSiteUrl } from '@/lib/env';

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalServerSiteUrl = process.env.SITE_URL;
const originalNodeEnv = process.env.NODE_ENV;
const originalVercelEnv = process.env.VERCEL_ENV;

describe('resolveCanonicalSiteUrl', () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    process.env.SITE_URL = originalServerSiteUrl;
    process.env.NODE_ENV = originalNodeEnv;
    process.env.VERCEL_ENV = originalVercelEnv;
  });

  it('prefers the configured canonical site url', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.example/';
    process.env.SITE_URL = '';
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'production';

    expect(resolveCanonicalSiteUrl()).toBe('https://proofound.example');
  });

  it('fails closed in production-like runtimes when no canonical site url is configured', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.SITE_URL = '';
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_ENV = 'preview';

    expect(resolveCanonicalSiteUrl()).toBe('');
  });

  it('falls back to localhost only in non-production local or test runtimes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.SITE_URL = '';
    process.env.NODE_ENV = 'test';
    process.env.VERCEL_ENV = '';

    expect(resolveCanonicalSiteUrl()).toBe('http://localhost:3000');
  });
});
