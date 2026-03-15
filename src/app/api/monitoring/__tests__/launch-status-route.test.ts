/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/launch/synthetic-monitors', () => ({
  getPersistedLaunchSyntheticStatus: vi.fn(),
  getCurrentLaunchSyntheticStatus: vi.fn(),
}));

import { GET } from '../launch-status/route';
import {
  getPersistedLaunchSyntheticStatus,
  getCurrentLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';

describe('/api/monitoring/launch-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns launch monitor health with summary counts', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-10T10:00:00.000Z',
      ok: true,
      readinessState: 'ready',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-10T09:59:00.000Z',
        smokeArtifactAgeMinutes: 1,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: true,
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
    expect(body.readinessState).toBe('ready');
    expect(body.source).toBe('persisted');
    expect(body.evidence.smokeArtifactGeneratedAt).toBe('2026-03-10T09:59:00.000Z');
    expect(body.evidence.smokeArtifactAgeMinutes).toBe(1);
    expect(body.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(body.evidence.smokeFreshnessState).toBe('fresh');
    expect(body.summary.reportedMonitors).toBe(2);
    expect(body.summary.missingMonitors).toBe(0);
    expect(Array.isArray(body.monitors)).toBe(true);
    expect(getCurrentLaunchSyntheticStatus).not.toHaveBeenCalled();
  });

  it('returns blocked readiness when persisted smoke evidence is stale', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-10T10:00:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-10T08:45:00.000Z',
        smokeArtifactAgeMinutes: 75,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'stale',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        { monitorKey: 'api_health', severity: 'p1', status: 'pass' },
        { monitorKey: 'first_proof_first_individual', severity: 'p1', status: 'fail' },
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.evidence.smokeArtifactGeneratedAt).toBe('2026-03-10T08:45:00.000Z');
    expect(body.evidence.smokeArtifactAgeMinutes).toBe(75);
    expect(body.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(body.evidence.smokeFreshnessState).toBe('stale');
    expect(body.summary.p1Failures).toBe(1);
  });

  it('returns blocked persisted status when the smoke artifact is unavailable', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-13T00:00:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: null,
        smokeArtifactAgeMinutes: null,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'missing',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        {
          monitorKey: 'api_health',
          monitorGroup: 'endpoint',
          severity: 'p1',
          status: 'pass',
          responseTimeMs: 12,
          expectedState: 'health_contract_ok',
          observedState: 'health_contract_ok',
          failureClass: null,
          checkedAt: '2026-03-13T00:00:00.000Z',
          ageMinutes: 0,
          stale: false,
          details: {},
        },
        {
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          severity: 'p1',
          status: 'fail',
          responseTimeMs: 0,
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'smoke_artifact_missing',
          failureClass: 'smoke_artifact_missing',
          checkedAt: '2026-03-13T00:00:00.000Z',
          ageMinutes: 0,
          stale: true,
          details: {},
        },
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.source).toBe('persisted');
    expect(body.evidence.persisted).toBe(true);
    expect(body.evidence.smokeArtifactGeneratedAt).toBeNull();
    expect(body.evidence.smokeArtifactAgeMinutes).toBeNull();
    expect(body.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(body.evidence.smokeFreshnessState).toBe('missing');
    expect(body.summary.reportedMonitors).toBe(2);
    expect(body.summary.missingMonitors).toBe(0);
    expect(body.summary.p1Failures).toBe(1);
  });

  it('returns 500 when persisted monitor loading fails', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockRejectedValue(new Error('db exploded'));

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Failed to load launch status');
    expect(body.message).toBe('db exploded');
  });
});
