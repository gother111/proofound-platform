import { describe, expect, it } from 'vitest';

import { buildLaunchSmokeScenarioEnv } from '@/lib/launch/smoke-runner-env';

describe('launch-smoke-runner env resolution', () => {
  it('keeps local smoke bypass flags only for local launch smoke commands', () => {
    const env = buildLaunchSmokeScenarioEnv({
      executionMode: 'local',
      baseUrl: 'http://127.0.0.1:33101',
      sharedEnv: {
        BASE_URL: 'http://127.0.0.1:33101',
        PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK: '1',
        PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE: '1',
      },
      scenarioEnv: {
        BASE_URL: '',
        NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
        PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY: '1',
      },
    });

    expect(env).toEqual(
      expect.objectContaining({
        BASE_URL: '',
        NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
        PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY: '1',
        PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK: '1',
        PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE: '1',
      })
    );
  });

  it('removes local-only bypass flags and restores BASE_URL for live launch smoke commands', () => {
    const env = buildLaunchSmokeScenarioEnv({
      executionMode: 'live',
      baseUrl: 'https://preview.proofound.example',
      sharedEnv: {
        BASE_URL: 'https://preview.proofound.example',
      },
      scenarioEnv: {
        BASE_URL: '',
        NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
        PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY: '1',
        PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK: '1',
        PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE: '1',
      },
    });

    expect(env).toEqual(
      expect.objectContaining({
        BASE_URL: 'https://preview.proofound.example',
        NEXT_PUBLIC_USE_MOCK_SUPABASE: 'false',
      })
    );
    expect(env).not.toHaveProperty('PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY');
    expect(env).not.toHaveProperty('PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK');
    expect(env).not.toHaveProperty('PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE');
  });
});
