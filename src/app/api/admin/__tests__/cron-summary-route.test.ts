import { describe, expect, it } from 'vitest';

import { resolveCronSummaryBaseUrl } from '../cron/summary/base-url';

describe('cron summary base URL resolver', () => {
  it('prefers NEXT_PUBLIC_SITE_URL when provided', () => {
    expect(
      resolveCronSummaryBaseUrl({
        NEXT_PUBLIC_SITE_URL: 'https://proofound.io',
        VERCEL_URL: 'proofound-preview.vercel.app',
      } as unknown as NodeJS.ProcessEnv)
    ).toBe('https://proofound.io');
  });

  it('uses VERCEL_URL as-is when it already has protocol', () => {
    expect(
      resolveCronSummaryBaseUrl({
        VERCEL_URL: 'https://proofound-preview.vercel.app',
      } as unknown as NodeJS.ProcessEnv)
    ).toBe('https://proofound-preview.vercel.app');
  });

  it('adds https:// prefix to protocol-less VERCEL_URL', () => {
    expect(
      resolveCronSummaryBaseUrl({
        VERCEL_URL: 'proofound-preview.vercel.app',
      } as unknown as NodeJS.ProcessEnv)
    ).toBe('https://proofound-preview.vercel.app');
  });

  it('returns undefined when no base URL env is available', () => {
    expect(resolveCronSummaryBaseUrl({} as unknown as NodeJS.ProcessEnv)).toBeUndefined();
  });
});
