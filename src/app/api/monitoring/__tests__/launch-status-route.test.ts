/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/launch/synthetic-monitors', () => ({
  getLatestLaunchSyntheticStatus: vi.fn(),
}));

import { GET } from '../launch-status/route';
import { getLatestLaunchSyntheticStatus } from '@/lib/launch/synthetic-monitors';

describe('/api/monitoring/launch-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns launch monitor health with summary counts', async () => {
    (getLatestLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-10T10:00:00.000Z',
      ok: true,
      missingMonitorKeys: [],
      rows: [
        { monitorKey: 'api_health', severity: 'p1', status: 'pass' },
        { monitorKey: 'signup_auth', severity: 'p1', status: 'pass' },
      ],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.summary.reportedMonitors).toBe(2);
    expect(body.summary.missingMonitors).toBe(0);
    expect(Array.isArray(body.monitors)).toBe(true);
  });
});
