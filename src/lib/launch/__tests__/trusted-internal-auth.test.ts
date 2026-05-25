import { describe, expect, it } from 'vitest';

import {
  isTrustedLaunchSecretUrl,
  shouldSendLaunchInternalAuth,
  trustedLaunchOrigins,
} from '@/lib/launch/trusted-internal-auth';

describe('trusted launch internal auth', () => {
  it('parses explicit trusted launch origins from comma-separated env', () => {
    expect(
      trustedLaunchOrigins({
        LAUNCH_TRUSTED_BASE_URLS:
          ' https://preview-proofound.vercel.app, , https://staging.proofound.io ',
      })
    ).toEqual(['https://preview-proofound.vercel.app', 'https://staging.proofound.io']);
  });

  it('trusts only canonical Proofound, local, or explicitly configured origins', () => {
    const env = { LAUNCH_TRUSTED_BASE_URLS: 'https://preview-proofound.vercel.app' };

    expect(isTrustedLaunchSecretUrl('https://proofound.io/api/monitoring/launch-status', env)).toBe(
      true
    );
    expect(
      isTrustedLaunchSecretUrl('https://www.proofound.io/api/monitoring/launch-status', env)
    ).toBe(true);
    expect(
      isTrustedLaunchSecretUrl('http://localhost:3000/api/monitoring/launch-status', env)
    ).toBe(true);
    expect(
      isTrustedLaunchSecretUrl('http://127.0.0.1:33180/api/monitoring/launch-status', env)
    ).toBe(true);
    expect(
      isTrustedLaunchSecretUrl(
        'https://preview-proofound.vercel.app/api/monitoring/launch-status',
        env
      )
    ).toBe(true);
    expect(isTrustedLaunchSecretUrl('https://evil.example/api/monitoring/launch-status', env)).toBe(
      false
    );
    expect(isTrustedLaunchSecretUrl('not a url', env)).toBe(false);
  });

  it('sends internal auth only when explicitly requested, configured, and trusted', () => {
    const env = { LAUNCH_TRUSTED_BASE_URLS: 'https://preview-proofound.vercel.app' };

    expect(
      shouldSendLaunchInternalAuth({
        url: 'https://evil.example/api/monitoring/launch-status',
        includeInternalAuth: true,
        secret: 'cron-secret-value',
        env,
      })
    ).toBe(false);
    expect(
      shouldSendLaunchInternalAuth({
        url: 'https://proofound.io/api/health',
        includeInternalAuth: false,
        secret: 'cron-secret-value',
        env,
      })
    ).toBe(false);
    expect(
      shouldSendLaunchInternalAuth({
        url: 'https://proofound.io/api/monitoring/launch-status',
        includeInternalAuth: true,
        secret: '',
        env,
      })
    ).toBe(false);
    expect(
      shouldSendLaunchInternalAuth({
        url: 'https://preview-proofound.vercel.app/api/monitoring/launch-status',
        includeInternalAuth: true,
        secret: 'cron-secret-value',
        env,
      })
    ).toBe(true);
  });
});
