import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  sendEmail: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/email/sender', () => ({
  sendEmail: mocks.sendEmail,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import type { PerformanceHealthStatus } from '../health-check';
import { sendPerformanceAlert } from '../health-check';

function makeUnhealthyStatus(): PerformanceHealthStatus {
  return {
    healthy: false,
    timestamp: new Date('2026-05-20T07:00:00.000Z'),
    metrics: {
      pageLoadP95: 2400,
      apiLatencyP95: 1900,
      errorRate: 0.5,
    },
    breaches: [
      {
        metric: 'api_latency_p95',
        value: 1900,
        threshold: 1500,
        severity: 'warning',
        description: 'API latency P95 exceeds target',
      },
    ],
    summary: '1 SLA breach detected',
  };
}

describe('sendPerformanceAlert', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('links operators to the launch-safe internal ops surface', async () => {
    vi.stubEnv('ALERT_EMAIL', 'ops@proofound.io');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://proofound.io/');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://legacy.example');

    await sendPerformanceAlert(makeUnhealthyStatus());

    expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
    const payload = mocks.sendEmail.mock.calls[0]?.[0];

    expect(payload.to).toBe('ops@proofound.io');
    expect(payload.text).toContain('Internal ops: https://proofound.io/admin');
    expect(payload.text).not.toContain('/app/admin/performance');
    expect(payload.text).not.toContain('undefined');
  });

  it('falls back to a relative internal ops link when no canonical site URL is configured', async () => {
    vi.stubEnv('ALERT_EMAIL', 'ops@proofound.io');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');

    await sendPerformanceAlert(makeUnhealthyStatus());

    const payload = mocks.sendEmail.mock.calls[0]?.[0];

    expect(payload.text).toContain('Internal ops: /admin');
    expect(payload.text).not.toContain('/app/admin/performance');
    expect(payload.text).not.toContain('undefined');
  });
});
