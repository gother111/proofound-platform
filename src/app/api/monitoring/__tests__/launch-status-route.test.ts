/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/launch/synthetic-monitors', () => ({
  getPersistedLaunchSyntheticStatus: vi.fn(),
  getLaunchSyntheticStatusWithFreshHttpRevalidation: vi.fn(),
}));

import { GET } from '../launch-status/route';
import {
  getPersistedLaunchSyntheticStatus,
  getLaunchSyntheticStatusWithFreshHttpRevalidation,
} from '@/lib/launch/synthetic-monitors';

function buildMonitorRow(overrides: Record<string, unknown> = {}) {
  return {
    monitorKey: 'api_health',
    monitorGroup: 'endpoint',
    severity: 'p1',
    status: 'pass',
    responseTimeMs: 12,
    expectedState: 'health_contract_ok',
    observedState: 'health_contract_ok',
    failureClass: null,
    checkedAt: '2026-03-10T10:00:00.000Z',
    ageMinutes: 0,
    freshnessState: 'fresh',
    blocking: false,
    stale: false,
    details: {},
    ...overrides,
  };
}

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
        buildMonitorRow(),
        buildMonitorRow({
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'first_proof_first_corridor_live',
        }),
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
    expect(body.summary.unverifiedMonitors).toBe(0);
    expect(body.notReadyReasons).toEqual([]);
    expect(Array.isArray(body.monitors)).toBe(true);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).not.toHaveBeenCalled();
  });

  it('returns unverified readiness when persisted smoke evidence is stale', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-10T10:00:00.000Z',
      ok: false,
      readinessState: 'unverified',
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
        buildMonitorRow(),
        buildMonitorRow({
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          status: 'degraded',
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'smoke_artifact_stale',
          failureClass: 'smoke_artifact_stale',
          freshnessState: 'stale',
          blocking: false,
          stale: true,
        }),
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('unverified');
    expect(body.evidence.smokeArtifactGeneratedAt).toBe('2026-03-10T08:45:00.000Z');
    expect(body.evidence.smokeArtifactAgeMinutes).toBe(75);
    expect(body.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(body.evidence.smokeFreshnessState).toBe('stale');
    expect(body.summary.p1Failures).toBe(0);
    expect(body.summary.staleMonitors).toBe(1);
    expect(body.summary.unverifiedMonitors).toBe(1);
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'stale_smoke_artifact',
        monitorKeys: ['first_proof_first_individual'],
      }),
    ]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).not.toHaveBeenCalled();
  });

  it('returns unverified persisted status when the smoke artifact is unavailable', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-13T00:00:00.000Z',
      ok: false,
      readinessState: 'unverified',
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
        buildMonitorRow({
          checkedAt: '2026-03-13T00:00:00.000Z',
        }),
        buildMonitorRow({
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          status: 'degraded',
          responseTimeMs: 0,
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'smoke_artifact_missing',
          failureClass: 'smoke_artifact_missing',
          checkedAt: '2026-03-13T00:00:00.000Z',
          freshnessState: 'missing',
          blocking: false,
          stale: true,
        }),
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('unverified');
    expect(body.source).toBe('persisted');
    expect(body.evidence.persisted).toBe(true);
    expect(body.evidence.smokeArtifactGeneratedAt).toBeNull();
    expect(body.evidence.smokeArtifactAgeMinutes).toBeNull();
    expect(body.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(body.evidence.smokeFreshnessState).toBe('missing');
    expect(body.summary.reportedMonitors).toBe(2);
    expect(body.summary.missingMonitors).toBe(0);
    expect(body.summary.p1Failures).toBe(0);
    expect(body.summary.missingEvidenceMonitors).toBe(1);
    expect(body.summary.unverifiedMonitors).toBe(1);
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'missing_smoke_artifact',
        monitorKeys: ['first_proof_first_individual'],
      }),
    ]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).not.toHaveBeenCalled();
  });

  it('revalidates missing persisted HTTP evidence even when the persisted snapshot is only unverified', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:00:00.000Z',
      ok: false,
      readinessState: 'unverified',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 2,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: true,
      },
      missingMonitorKeys: ['api_health'],
      rows: [],
    });
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:01:00.000Z',
      ok: true,
      readinessState: 'ready',
      source: 'live',
      evidence: {
        source: 'live',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 3,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: false,
      },
      missingMonitorKeys: [],
      rows: [buildMonitorRow()],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.readinessState).toBe('ready');
    expect(body.notReadyReasons).toEqual([]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).toHaveBeenCalled();
  });

  it('revalidates stale persisted endpoint evidence with fresh runtime checks', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:00:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 2,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow({
          monitorGroup: 'unknown',
          status: 'degraded',
          stale: true,
          observedState: 'stale',
          failureClass: 'stale_monitor_result',
          freshnessState: 'stale',
          blocking: false,
        }),
      ],
    });
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:01:00.000Z',
      ok: true,
      readinessState: 'ready',
      source: 'live',
      evidence: {
        source: 'live',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 3,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: false,
      },
      missingMonitorKeys: [],
      rows: [buildMonitorRow()],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.readinessState).toBe('ready');
    expect(body.source).toBe('live');
    expect(body.notReadyReasons).toEqual([]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).toHaveBeenCalledWith({
      artifactPath: '.artifacts/launch-smoke-report.json',
      baseUrl: 'https://example.com',
      persistedStatus: expect.objectContaining({
        source: 'persisted',
        evidence: expect.objectContaining({
          smokeFreshnessState: 'fresh',
        }),
      }),
    });
  });

  it('revalidates stale persisted endpoint evidence even when smoke evidence is stale', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:00:00.000Z',
      ok: false,
      readinessState: 'unverified',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T08:45:00.000Z',
        smokeArtifactAgeMinutes: 75,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'stale',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow({
          status: 'degraded',
          stale: true,
          observedState: 'stale',
          failureClass: 'stale_monitor_result',
          freshnessState: 'stale',
          blocking: false,
        }),
        buildMonitorRow({
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          status: 'degraded',
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'smoke_artifact_stale',
          failureClass: 'smoke_artifact_stale',
          freshnessState: 'stale',
          blocking: false,
          stale: true,
        }),
      ],
    });
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:01:00.000Z',
      ok: false,
      readinessState: 'unverified',
      source: 'live',
      evidence: {
        source: 'live',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T08:45:00.000Z',
        smokeArtifactAgeMinutes: 76,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'stale',
        persisted: false,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow(),
        buildMonitorRow({
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          status: 'degraded',
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'smoke_artifact_stale',
          failureClass: 'smoke_artifact_stale',
          freshnessState: 'stale',
          blocking: false,
          stale: true,
        }),
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('unverified');
    expect(body.source).toBe('live');
    expect(body.summary.p1Failures).toBe(0);
    expect(body.summary.staleMonitors).toBe(1);
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'stale_smoke_artifact',
        monitorKeys: ['first_proof_first_individual'],
      }),
    ]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).toHaveBeenCalled();
  });

  it('keeps launch blocked when fresh HTTP revalidation reproduces a real failure', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:00:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 2,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow({
          status: 'degraded',
          stale: true,
          observedState: 'stale',
          failureClass: 'stale_monitor_result',
          freshnessState: 'stale',
          blocking: false,
        }),
      ],
    });
    (getLaunchSyntheticStatusWithFreshHttpRevalidation as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:01:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'live',
      evidence: {
        source: 'live',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 3,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: false,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow({
          status: 'fail',
          stale: false,
          observedState: 'unexpected_payload_value',
          failureClass: 'payload_contract_mismatch',
          freshnessState: 'fresh',
          blocking: true,
        }),
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.source).toBe('live');
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'fresh_failing_http_monitor',
        monitorKeys: ['api_health'],
      }),
    ]);
    expect(body.monitors[0]).toEqual(
      expect.objectContaining({
        monitorKey: 'api_health',
        failureClass: 'payload_contract_mismatch',
        freshnessState: 'fresh',
        blocking: true,
        stale: false,
      })
    );
  });

  it('returns blocked when a fresh smoke corridor is failing', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:00:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T09:58:00.000Z',
        smokeArtifactAgeMinutes: 2,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow(),
        buildMonitorRow({
          monitorKey: 'full_org_corridor_review_to_engagement_verification',
          monitorGroup: 'synthetic-smoke',
          status: 'fail',
          expectedState: 'full_org_corridor_review_to_engagement_verification_live',
          observedState: 'full_org_corridor_review_to_engagement_verification_live',
          failureClass: 'launch_corridor_failed',
          freshnessState: 'fresh',
          blocking: true,
          stale: false,
        }),
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.readinessState).toBe('blocked');
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'fresh_failing_smoke_monitor',
        monitorKeys: ['full_org_corridor_review_to_engagement_verification'],
      }),
    ]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).not.toHaveBeenCalled();
  });

  it('keeps blocked status for mixed current blocker and stale evidence while separating summary counts', async () => {
    (getPersistedLaunchSyntheticStatus as any).mockResolvedValue({
      generatedAt: '2026-03-15T10:00:00.000Z',
      ok: false,
      readinessState: 'blocked',
      source: 'persisted',
      evidence: {
        source: 'persisted',
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactGeneratedAt: '2026-03-15T08:45:00.000Z',
        smokeArtifactAgeMinutes: 75,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'stale',
        persisted: true,
      },
      missingMonitorKeys: [],
      rows: [
        buildMonitorRow({
          status: 'fail',
          observedState: 'unexpected_payload_value',
          failureClass: 'payload_contract_mismatch',
          freshnessState: 'fresh',
          blocking: true,
        }),
        buildMonitorRow({
          monitorKey: 'first_proof_first_individual',
          monitorGroup: 'synthetic-smoke',
          status: 'degraded',
          expectedState: 'first_proof_first_corridor_live',
          observedState: 'smoke_artifact_stale',
          failureClass: 'smoke_artifact_stale',
          freshnessState: 'stale',
          blocking: false,
          stale: true,
        }),
      ],
    });

    const response = await GET(new Request('https://example.com/api/monitoring/launch-status'));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.readinessState).toBe('blocked');
    expect(body.summary.p1Failures).toBe(1);
    expect(body.summary.staleMonitors).toBe(1);
    expect(body.summary.unverifiedMonitors).toBe(1);
    expect(body.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'fresh_failing_http_monitor',
        monitorKeys: ['api_health'],
      }),
      expect.objectContaining({
        code: 'stale_smoke_artifact',
        monitorKeys: ['first_proof_first_individual'],
      }),
    ]);
    expect(getLaunchSyntheticStatusWithFreshHttpRevalidation).not.toHaveBeenCalled();
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
