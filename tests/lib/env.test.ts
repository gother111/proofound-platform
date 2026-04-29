import { afterEach, describe, expect, it } from 'vitest';

import {
  assertMockDatabaseAllowed,
  getEnabledMockDatabaseModes,
  resolveCanonicalSiteUrl,
} from '@/lib/env';

const originalEnv = { ...process.env };

describe('resolveCanonicalSiteUrl', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('prefers the configured canonical site url', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.example/';
    process.env.SITE_URL = '';
    process.env['NODE_ENV'] = 'production';
    process.env.VERCEL_ENV = 'production';

    expect(resolveCanonicalSiteUrl()).toBe('https://proofound.example');
  });

  it('fails closed in production-like runtimes when no canonical site url is configured', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.SITE_URL = '';
    process.env['NODE_ENV'] = 'production';
    process.env.VERCEL_ENV = 'preview';

    expect(resolveCanonicalSiteUrl()).toBe('');
  });

  it('falls back to localhost only in non-production local or test runtimes', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '';
    process.env.SITE_URL = '';
    process.env['NODE_ENV'] = 'test';
    process.env.VERCEL_ENV = '';

    expect(resolveCanonicalSiteUrl()).toBe('http://localhost:3000');
  });
});

describe('production mock database guard', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects NEXT_PUBLIC_USE_MOCK_SUPABASE in production', () => {
    process.env['NODE_ENV'] = 'production';
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    expect(() => assertMockDatabaseAllowed('test')).toThrow(/NEXT_PUBLIC_USE_MOCK_SUPABASE/);
  });

  it('rejects mock admin modes in production deploy environments', () => {
    process.env['NODE_ENV'] = 'test';
    process.env.VERCEL_ENV = 'production';
    process.env.MOCK_ADMIN_MODE = 'true';
    process.env.MOCK_PLATFORM_ROLE = 'super_admin';

    expect(getEnabledMockDatabaseModes()).toEqual(['MOCK_ADMIN_MODE', 'MOCK_PLATFORM_ROLE']);
    expect(() => assertMockDatabaseAllowed('test')).toThrow(/MOCK_ADMIN_MODE/);
  });

  it('allows mock Supabase in development and test runtimes', () => {
    process.env['NODE_ENV'] = 'development';
    process.env.VERCEL_ENV = '';
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';

    expect(() => assertMockDatabaseAllowed('test')).not.toThrow();

    process.env['NODE_ENV'] = 'test';

    expect(() => assertMockDatabaseAllowed('test')).not.toThrow();
  });
});
