import { describe, expect, it } from 'vitest';

import {
  buildLaunchBlockingReasons,
  buildLaunchStatusReport,
  formatLaunchBlockingReasons,
} from '@/lib/launch/status-report';
import type {
  LaunchSyntheticStatusRow,
  PersistedLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';

function buildRow(overrides: Partial<LaunchSyntheticStatusRow> = {}): LaunchSyntheticStatusRow {
  return {
    monitorKey: 'api_health',
    monitorGroup: 'endpoint',
    status: 'pass',
    severity: 'p1',
    responseTimeMs: 12,
    expectedState: 'health_contract_ok',
    observedState: 'health_contract_ok',
    failureClass: null,
    checkedAt: '2026-03-20T09:00:00.000Z',
    ageMinutes: 0,
    freshnessState: 'fresh',
    blocking: false,
    stale: false,
    lastSuccessfulCheckedAt: '2026-03-20T09:00:00.000Z',
    evidenceSource: 'persisted',
    refreshState: 'retained_persisted',
    details: {},
    ...overrides,
  };
}

function buildStatus(overrides: Partial<PersistedLaunchSyntheticStatus> = {}) {
  return {
    generatedAt: '2026-03-20T09:00:00.000Z',
    rows: [buildRow()],
    missingMonitorKeys: [],
    ok: true,
    readinessState: 'ready',
    source: 'persisted' as const,
    liveRefresh: {
      attempted: false,
      refreshedMonitorKeys: [],
      recoveredMonitorKeys: [],
      failedMonitorKeys: [],
      finalHttpEvidenceSource: 'persisted' as const,
      error: null,
    },
    evidence: {
      source: 'persisted',
      artifactPath: '.artifacts/launch-smoke-report.json',
      smokeArtifactSchemaVersion: 2,
      smokeArtifactGeneratedAt: '2026-03-20T08:59:00.000Z',
      smokeArtifactAgeMinutes: 1,
      smokeFreshnessThresholdMinutes: 60,
      smokeFreshnessState: 'fresh',
      persisted: true,
    },
    ...overrides,
  } satisfies PersistedLaunchSyntheticStatus;
}

describe('launch status report helpers', () => {
  it('builds explicit blocking reasons for stale persisted endpoint evidence', () => {
    const reasons = buildLaunchBlockingReasons(
      [
        buildRow({
          status: 'degraded',
          observedState: 'stale',
          failureClass: 'stale_monitor_result',
          freshnessState: 'stale',
          blocking: false,
          stale: true,
        }),
      ],
      [],
      {
        attempted: true,
        refreshedMonitorKeys: ['api_health'],
        recoveredMonitorKeys: [],
        failedMonitorKeys: ['api_health'],
        finalHttpEvidenceSource: 'persisted',
        error: 'network exploded',
      }
    );

    expect(reasons).toEqual([
      expect.objectContaining({
        code: 'stale_persisted_monitor_evidence',
        monitorKeys: ['api_health'],
        source: 'persisted_http',
        liveRefreshAttempted: true,
      }),
    ]);
  });

  it('builds a report with blocked-only readiness semantics', () => {
    const report = buildLaunchStatusReport(
      buildStatus({
        ok: false,
        readinessState: 'blocked',
        rows: [
          buildRow({
            monitorKey: 'full_org_corridor_review_to_engagement_verification',
            monitorGroup: 'synthetic-smoke',
            status: 'fail',
            expectedState: 'full_org_corridor_review_to_engagement_verification_live',
            observedState: 'full_org_corridor_review_to_engagement_verification_live',
            failureClass: 'launch_corridor_failed',
            blocking: true,
            refreshState: 'not_applicable',
          }),
        ],
      })
    );

    expect(report.ok).toBe(false);
    expect(report.readinessState).toBe('blocked');
    expect(report.notReadyReasons).toEqual([
      expect.objectContaining({
        code: 'smoke_corridor_failure',
      }),
    ]);
  });

  it('formats blocking reasons for go-no-go output using the shared semantics', () => {
    const formatted = formatLaunchBlockingReasons([
      {
        code: 'live_endpoint_failure',
        message: 'Endpoint failed.',
        monitorKeys: ['api_health'],
        source: 'live_http',
        freshnessState: 'fresh',
        checkedAt: ['2026-03-20T09:00:00.000Z'],
        lastSuccessfulCheckedAt: ['2026-03-19T09:00:00.000Z'],
        liveRefreshAttempted: true,
      },
    ]);

    expect(formatted).toContain('live_endpoint_failure');
    expect(formatted).toContain('source=live_http');
    expect(formatted).toContain('freshness=fresh');
    expect(formatted).toContain('liveRefreshAttempted=true');
    expect(formatted).toContain('monitors=api_health');
  });
});
