import { describe, expect, it } from 'vitest';

import {
  GCP_CV_OCR_ENV_KEYS,
  getGcpCvOcrAuthSecret,
  resolveGcpCvOcrConfig,
} from '@/lib/expertise/gcp-cv-ocr-config';

const NOW = new Date('2026-05-03T12:00:00.000Z');
const FUTURE = '2026-05-04T12:00:00.000Z';
const CONSERVATIVE_CREDIT_CUTOFF = '2026-08-03T00:00:00.000Z';

function enabledEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    GCP_CV_OCR_ENABLED: 'true',
    GCP_CV_OCR_EXPIRES_AT: FUTURE,
    GCP_CV_OCR_BASE_URL: 'https://gcp-cv-ocr.example/run',
    GCP_CV_OCR_AUTH_MODE: 'hmac',
    GCP_CV_OCR_SHARED_SECRET: 'test-secret',
    ...overrides,
  };
}

describe('GCP CV/OCR config helpers', () => {
  it('is disabled and unavailable by default', () => {
    const config = resolveGcpCvOcrConfig({}, NOW);

    expect(config.enabled).toBe(false);
    expect(config.available).toBe(false);
    expect(config.unavailableReason).toBe('disabled');
    expect(config.baseUrl).toBeNull();
    expect(config.authMode).toBeNull();
    expect(config.hasAuthSecret).toBe(false);
  });

  it('parses an enabled future-dated provider config without exposing the secret', () => {
    const config = resolveGcpCvOcrConfig(
      enabledEnv({
        GCP_CV_OCR_MAX_FILE_SIZE_MB: '7',
        GCP_CV_OCR_MAX_PAGES: '8',
        GCP_CV_OCR_MAX_FILES_PER_REQUEST: '3',
        GCP_CV_OCR_ALLOWED_MIME_TYPES: 'application/pdf,image/png,application/x-msdownload',
        GCP_CV_OCR_RETENTION_HOURS: '6',
        GCP_CV_OCR_USER_DAILY_LIMIT: '9',
        GCP_CV_OCR_GLOBAL_DAILY_LIMIT: '100',
      }),
      NOW
    );

    expect(config.available).toBe(true);
    expect(config.unavailableReason).toBeNull();
    expect(config.expiresAt?.toISOString()).toBe(FUTURE);
    expect(config.baseUrl).toBe('https://gcp-cv-ocr.example');
    expect(config.authMode).toBe('hmac');
    expect(config.hasAuthSecret).toBe(true);
    expect(config).not.toHaveProperty('authSecret');
    expect(config.maxFileSizeMb).toBe(7);
    expect(config.maxFileSizeBytes).toBe(7 * 1024 * 1024);
    expect(config.maxPages).toBe(8);
    expect(config.maxFilesPerRequest).toBe(3);
    expect(config.allowedMimeTypes).toEqual(['application/pdf', 'image/png']);
    expect(config.retentionHours).toBe(6);
    expect(config.userDailyLimit).toBe(9);
    expect(config.globalDailyLimit).toBe(100);
    expect(getGcpCvOcrAuthSecret(enabledEnv())).toBe('test-secret');
  });

  it('treats expired config as unavailable', () => {
    const config = resolveGcpCvOcrConfig(
      enabledEnv({ GCP_CV_OCR_EXPIRES_AT: '2026-05-02T12:00:00.000Z' }),
      NOW
    );

    expect(config.available).toBe(false);
    expect(config.unavailableReason).toBe('expired');
  });

  it('treats the conservative August 3, 2026 cutoff as unavailable at and after expiry', () => {
    const atExpiry = resolveGcpCvOcrConfig(
      enabledEnv({ GCP_CV_OCR_EXPIRES_AT: CONSERVATIVE_CREDIT_CUTOFF }),
      new Date(CONSERVATIVE_CREDIT_CUTOFF)
    );
    const afterExpiry = resolveGcpCvOcrConfig(
      enabledEnv({ GCP_CV_OCR_EXPIRES_AT: CONSERVATIVE_CREDIT_CUTOFF }),
      new Date('2026-08-03T00:00:00.001Z')
    );

    expect(atExpiry.available).toBe(false);
    expect(atExpiry.enabled).toBe(true);
    expect(atExpiry.unavailableReason).toBe('expired');
    expect(afterExpiry.available).toBe(false);
    expect(afterExpiry.unavailableReason).toBe('expired');
  });

  it('treats a configured verified expiry as unavailable at the exact timestamp', () => {
    const verifiedExpiry = '2026-07-29T18:45:00.000Z';
    const config = resolveGcpCvOcrConfig(
      enabledEnv({ GCP_CV_OCR_EXPIRES_AT: verifiedExpiry }),
      new Date(verifiedExpiry)
    );

    expect(config.available).toBe(false);
    expect(config.unavailableReason).toBe('expired');
  });

  it('treats missing and invalid expiry as unavailable', () => {
    expect(
      resolveGcpCvOcrConfig(enabledEnv({ GCP_CV_OCR_EXPIRES_AT: '' }), NOW).unavailableReason
    ).toBe('missing_expiry');

    expect(
      resolveGcpCvOcrConfig(enabledEnv({ GCP_CV_OCR_EXPIRES_AT: 'not-a-date' }), NOW)
        .unavailableReason
    ).toBe('invalid_expiry');
  });

  it('treats missing URL or shared secret as unavailable', () => {
    expect(
      resolveGcpCvOcrConfig(enabledEnv({ GCP_CV_OCR_BASE_URL: '' }), NOW).unavailableReason
    ).toBe('missing_base_url');

    const missingSecret = resolveGcpCvOcrConfig(enabledEnv({ GCP_CV_OCR_SHARED_SECRET: '' }), NOW);
    expect(missingSecret.available).toBe(false);
    expect(missingSecret.unavailableReason).toBe('missing_shared_secret');
    expect(missingSecret.hasAuthSecret).toBe(false);
  });

  it('uses production-safe defaults without any client-exposed GCP config keys', () => {
    const config = resolveGcpCvOcrConfig(
      enabledEnv({
        NODE_ENV: 'production',
        GCP_CV_OCR_MAX_FILE_SIZE_MB: 'not-a-number',
        GCP_CV_OCR_MAX_PAGES: '-1',
        GCP_CV_OCR_ALLOWED_MIME_TYPES: 'application/x-msdownload',
      }),
      NOW
    );

    expect(config.available).toBe(true);
    expect(config.maxFileSizeMb).toBe(5);
    expect(config.maxPages).toBe(4);
    expect(config.maxFilesPerRequest).toBe(1);
    expect(config.allowedMimeTypes).toEqual(['application/pdf']);
    expect(config.retentionHours).toBe(24);
    expect(config.userDailyLimit).toBe(5);
    expect(config.globalDailyLimit).toBe(50);
    expect(GCP_CV_OCR_ENV_KEYS.every((key) => !key.startsWith('NEXT_PUBLIC_'))).toBe(true);
  });

  it('does not accept NEXT_PUBLIC GCP, Gemini, or generic API secret env vars', () => {
    const config = resolveGcpCvOcrConfig(
      enabledEnv({
        GCP_CV_OCR_SHARED_SECRET: undefined,
        NEXT_PUBLIC_GCP_CV_OCR_SHARED_SECRET: 'browser-gcp-secret',
        NEXT_PUBLIC_GEMINI_API_KEY: 'browser-gemini-secret',
        NEXT_PUBLIC_API_SECRET: 'browser-api-secret',
      }),
      NOW
    );

    expect(config.available).toBe(false);
    expect(config.unavailableReason).toBe('missing_shared_secret');
    expect(config.hasAuthSecret).toBe(false);
    expect(
      getGcpCvOcrAuthSecret({
        NEXT_PUBLIC_GCP_CV_OCR_SHARED_SECRET: 'browser-gcp-secret',
        NEXT_PUBLIC_GEMINI_API_KEY: 'browser-gemini-secret',
        NEXT_PUBLIC_API_SECRET: 'browser-api-secret',
      })
    ).toBeNull();
  });

  it('uses only configured server base URL and ignores forwarded-host shaped inputs', () => {
    const config = resolveGcpCvOcrConfig(
      enabledEnv({
        GCP_CV_OCR_BASE_URL: 'https://gcp-cv-ocr.example/run/extract',
        X_FORWARDED_HOST: 'attacker.example',
        'x-forwarded-host': 'attacker.example',
      }),
      NOW
    );

    expect(config.available).toBe(true);
    expect(config.baseUrl).toBe('https://gcp-cv-ocr.example');
    expect(config.baseUrl).not.toContain('attacker.example');
  });
});
