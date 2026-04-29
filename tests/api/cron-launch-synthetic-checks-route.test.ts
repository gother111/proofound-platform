/** @vitest-environment node */

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/launch/synthetic-monitors', () => ({
  runLaunchSyntheticMonitors: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/cron/launch-synthetic-checks/route';
import { runLaunchSyntheticMonitors } from '@/lib/launch/synthetic-monitors';

describe('/api/cron/launch-synthetic-checks', () => {
  const originalCronSecret = process.env.CRON_SECRET;
  const originalInternalApiSecret = process.env.INTERNAL_API_SECRET;
  const originalPublicCronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;
  const originalMonitorBaseUrl = process.env.LAUNCH_MONITOR_BASE_URL;
  const cronSecret = 'test-cron-secret-value';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = cronSecret;
    delete process.env.INTERNAL_API_SECRET;
    delete process.env.NEXT_PUBLIC_CRON_SECRET;
    delete process.env.LAUNCH_MONITOR_BASE_URL;
    (runLaunchSyntheticMonitors as any).mockResolvedValue({
      ok: true,
      summary: { pass: 12, degraded: 0, fail: 0 },
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
    if (originalInternalApiSecret == null) {
      delete process.env.INTERNAL_API_SECRET;
    } else {
      process.env.INTERNAL_API_SECRET = originalInternalApiSecret;
    }
    if (originalPublicCronSecret == null) {
      delete process.env.NEXT_PUBLIC_CRON_SECRET;
    } else {
      process.env.NEXT_PUBLIC_CRON_SECRET = originalPublicCronSecret;
    }
    if (originalMonitorBaseUrl == null) {
      delete process.env.LAUNCH_MONITOR_BASE_URL;
    } else {
      process.env.LAUNCH_MONITOR_BASE_URL = originalMonitorBaseUrl;
    }
  });

  it('rejects requests without the cron bearer token', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks')
    );

    expect(response.status).toBe(401);
  });

  it('rejects requests when no server-only cron secret is configured', async () => {
    delete process.env.CRON_SECRET;
    delete process.env.INTERNAL_API_SECRET;

    const response = await GET(
      new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks', {
        headers: {
          authorization: `Bearer ${cronSecret}`,
        },
      })
    );

    expect(response.status).toBe(401);
    expect(runLaunchSyntheticMonitors).not.toHaveBeenCalled();
  });

  it('rejects undefined and null bearer tokens', async () => {
    for (const token of ['undefined', 'null']) {
      const response = await GET(
        new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks', {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
      );

      expect(response.status).toBe(401);
    }

    expect(runLaunchSyntheticMonitors).not.toHaveBeenCalled();
  });

  it('does not accept NEXT_PUBLIC_CRON_SECRET as an internal secret source', async () => {
    delete process.env.CRON_SECRET;
    delete process.env.INTERNAL_API_SECRET;
    process.env.NEXT_PUBLIC_CRON_SECRET = 'public-cron-secret-value';

    const response = await GET(
      new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks', {
        headers: {
          authorization: 'Bearer public-cron-secret-value',
        },
      })
    );

    expect(response.status).toBe(401);
    expect(runLaunchSyntheticMonitors).not.toHaveBeenCalled();
  });

  it('uses the request origin as the default monitor base url', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks', {
        headers: {
          authorization: `Bearer ${cronSecret}`,
        },
      })
    );

    expect(response.status).toBe(200);
    expect(runLaunchSyntheticMonitors).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'http://localhost:3100',
        persist: true,
      })
    );
  });

  it('allows an explicit monitor base url override', async () => {
    process.env.LAUNCH_MONITOR_BASE_URL = 'https://proofound.io';

    const response = await GET(
      new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks', {
        headers: {
          authorization: `Bearer ${cronSecret}`,
        },
      })
    );

    expect(response.status).toBe(200);
    expect(runLaunchSyntheticMonitors).toHaveBeenCalledWith(
      expect.objectContaining({
        baseUrl: 'https://proofound.io',
      })
    );
  });
});
