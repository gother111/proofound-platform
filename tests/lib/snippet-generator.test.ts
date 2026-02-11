import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPublicProfileURL,
  resolvePublicProfileBaseURL,
} from '@/lib/profile/snippet-generator';

const ORIGINAL_ENV = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SITE_URL: process.env.SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_ENV: process.env.VERCEL_ENV,
};

function resetEnv() {
  delete process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.SITE_URL;
  process.env.NODE_ENV = 'test';
  delete process.env.VERCEL_ENV;
}

afterEach(() => {
  process.env.NEXT_PUBLIC_SITE_URL = ORIGINAL_ENV.NEXT_PUBLIC_SITE_URL;
  process.env.SITE_URL = ORIGINAL_ENV.SITE_URL;
  process.env.NODE_ENV = ORIGINAL_ENV.NODE_ENV;
  process.env.VERCEL_ENV = ORIGINAL_ENV.VERCEL_ENV;
});

describe('snippet-generator public URL resolution', () => {
  it('uses NEXT_PUBLIC_SITE_URL when defined', () => {
    resetEnv();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io/';
    process.env.SITE_URL = 'https://fallback.example.com';

    expect(resolvePublicProfileBaseURL()).toBe('https://proofound.io');
    expect(buildPublicProfileURL('abc123')).toBe('https://proofound.io/p/abc123');
  });

  it('falls back to SITE_URL when NEXT_PUBLIC_SITE_URL is absent', () => {
    resetEnv();
    process.env.SITE_URL = 'https://proofound.io';

    expect(resolvePublicProfileBaseURL()).toBe('https://proofound.io');
  });

  it('falls back to localhost outside production when no site env is set', () => {
    resetEnv();
    process.env.NODE_ENV = 'development';

    expect(resolvePublicProfileBaseURL()).toBe('http://localhost:3000');
  });

  it('falls back to locked production domain in production when no site env is set', () => {
    resetEnv();
    process.env.VERCEL_ENV = 'production';

    expect(resolvePublicProfileBaseURL()).toBe('https://proofound.io');
  });

  it('ignores invalid URL env values and uses fallback', () => {
    resetEnv();
    process.env.NEXT_PUBLIC_SITE_URL = 'not-a-valid-url';

    expect(resolvePublicProfileBaseURL()).toBe('http://localhost:3000');
  });
});
