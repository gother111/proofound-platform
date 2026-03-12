/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/launch/synthetic-monitors', () => ({
  getCurrentLaunchSyntheticStatus: vi.fn(),
  getLatestLaunchSyntheticStatus: vi.fn(),
}));

import { GET } from '../launch-status/route';
import {
  getCurrentLaunchSyntheticStatus,
  getLatestLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';

describe('/api/monitoring/launch-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns launch monitor health with summary counts', async () => {
    (getCurrentLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-10T10:00:00.000Z',
      ok: true,
      source: 'live',
      evidence: {
        source: 'live',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-10T09:59:00.000Z',
        persisted: false,
      },
      missingMonitorKeys: [],
      rows: [
        { monitorKey: 'api_health', severity: 'p1', status: 'pass' },
        { monitorKey: 'first_proof_first_individual', severity: 'p1', status: 'pass' },
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe('live');
    expect(body.evidence.smokeArtifactGeneratedAt).toBe('2026-03-10T09:59:00.000Z');
    expect(body.summary.reportedMonitors).toBe(2);
    expect(body.summary.missingMonitors).toBe(0);
    expect(Array.isArray(body.monitors)).toBe(true);
  });

  it('falls back to persisted monitor rows when the smoke artifact is unavailable', async () => {
    const missingArtifactError = Object.assign(new Error('ENOENT: missing artifact'), {
      code: 'ENOENT',
    });
    (getCurrentLaunchSyntheticStatus as any).mockRejectedValue(missingArtifactError);
    (getLatestLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-13T00:00:00.000Z',
      ok: true,
      missingMonitorKeys: [],
      rows: [{ monitorKey: 'api_health', severity: 'p1', status: 'pass' }],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.source).toBe('persisted');
    expect(body.evidence.persisted).toBe(true);
    expect(body.evidence.smokeArtifactGeneratedAt).toBeNull();
    expect(body.summary.reportedMonitors).toBe(1);
  });
});
