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
  const originalMonitorBaseUrl = process.env.LAUNCH_MONITOR_BASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-cron-secret';
    delete process.env.LAUNCH_MONITOR_BASE_URL;
    (runLaunchSyntheticMonitors as any).mockResolvedValue({
      ok: true,
      summary: { pass: 12, degraded: 0, fail: 0 },
    });
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalCronSecret;
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

  it('uses the request origin as the default monitor base url', async () => {
    const response = await GET(
      new NextRequest('http://localhost:3100/api/cron/launch-synthetic-checks', {
        headers: {
          authorization: 'Bearer test-cron-secret',
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
          authorization: 'Bearer test-cron-secret',
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
