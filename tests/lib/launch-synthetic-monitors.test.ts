import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

import { db } from '@/db';
import fs from 'node:fs/promises';
import {
  getCurrentLaunchSyntheticStatus,
  getLatestLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';
import { LAUNCH_MONITOR_DEFINITIONS, LAUNCH_SMOKE_MATRIX } from '@/lib/launch/contracts';

describe('launch synthetic monitor persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('reads the latest monitor state when drizzle returns array rows', async () => {
    (db.execute as any).mockResolvedValue([
      {
        monitor_key: 'site_root',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 42,
        expected_state: 'landing_live',
        observed_state: 'landing_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:51.803Z',
        details: {},
      },
      {
        monitor_key: 'login_entry',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 51,
        expected_state: 'login_live',
        observed_state: 'login_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:54.501Z',
        details: {},
      },
      {
        monitor_key: 'api_health',
        monitor_group: 'endpoint',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 80,
        expected_state: 'health_contract_ok',
        observed_state: 'health_contract_ok',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'first_proof_first_individual',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'first_proof_first_corridor_live',
        observed_state: 'first_proof_first_corridor_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'public_portfolio_publish',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'public_portfolio_live',
        observed_state: 'public_portfolio_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'privacy_reveal_enforcement',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'privacy_and_reveal_enforced',
        observed_state: 'privacy_and_reveal_enforced',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'assignment_publish',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 100,
        expected_state: 'assignment_published',
        observed_state: 'assignment_published',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'intro_reveal_interview_decision',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p1',
        response_time_ms: 100,
        expected_state: 'intro_reveal_interview_decision_live',
        observed_state: 'intro_reveal_interview_decision_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
      {
        monitor_key: 'engagement_verification',
        monitor_group: 'synthetic-smoke',
        status: 'pass',
        severity: 'p2',
        response_time_ms: 100,
        expected_state: 'engagement_verification_live',
        observed_state: 'engagement_verification_live',
        failure_class: null,
        checked_at: '2026-03-10T16:52:57.187Z',
        details: {},
      },
    ]);

    const result = await getLatestLaunchSyntheticStatus(new Date('2026-03-10T16:53:25.057Z'));

    expect(result.rows).toHaveLength(LAUNCH_MONITOR_DEFINITIONS.length);
    expect(result.missingMonitorKeys).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('derives current launch status from live checks and the current smoke artifact', async () => {
    (fs.readFile as any).mockResolvedValue(
      JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2026-03-12T10:00:00.000Z',
        overallStatus: 'pass',
        checks: LAUNCH_SMOKE_MATRIX.map((scenario) => ({
          id: scenario.id,
          label: scenario.label,
          status: 'pass',
          expectedState: scenario.expectedState,
          durationMs: 25,
          testFiles: scenario.testFiles,
          generatedAt: '2026-03-12T10:00:00.000Z',
        })),
      })
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith('/api/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 });
        }

        return new Response('ok', { status: 200 });
      })
    );

    const result = await getCurrentLaunchSyntheticStatus(
      {
        baseUrl: 'https://example.com',
        artifactPath: '.artifacts/launch-smoke-report.json',
        persist: false,
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.source).toBe('live');
    expect(result.ok).toBe(true);
    expect(result.readinessState).toBe('ready');
    expect(result.evidence.persisted).toBe(false);
    expect(result.evidence.smokeArtifactGeneratedAt).toBe('2026-03-12T10:00:00.000Z');
    expect(result.evidence.smokeArtifactAgeMinutes).toBe(59);
    expect(result.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(result.evidence.smokeFreshnessState).toBe('fresh');
    expect(result.rows).toHaveLength(LAUNCH_MONITOR_DEFINITIONS.length);
    expect(result.rows.every((row) => row.stale === false)).toBe(true);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('fails current smoke-backed monitors when the smoke artifact itself is stale', async () => {
    (fs.readFile as any).mockResolvedValue(
      JSON.stringify({
        schemaVersion: 1,
        generatedAt: '2020-01-01T00:00:00.000Z',
        overallStatus: 'pass',
        checks: LAUNCH_SMOKE_MATRIX.map((scenario) => ({
          id: scenario.id,
          label: scenario.label,
          status: 'pass',
          expectedState: scenario.expectedState,
          durationMs: 25,
          testFiles: scenario.testFiles,
          generatedAt: '2020-01-01T00:00:00.000Z',
        })),
      })
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith('/api/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 });
        }

        return new Response('ok', { status: 200 });
      })
    );

    const result = await getCurrentLaunchSyntheticStatus(
      {
        baseUrl: 'https://example.com',
        artifactPath: '.artifacts/launch-smoke-report.json',
        persist: false,
      },
      new Date('2020-01-01T01:01:00.000Z')
    );

    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('blocked');
    expect(result.evidence.smokeArtifactAgeMinutes).toBe(61);
    expect(result.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(result.evidence.smokeFreshnessState).toBe('stale');
    expect(
      result.rows
        .filter((row) => row.monitorGroup === 'synthetic-smoke')
        .every((row) => row.observedState === 'smoke_artifact_stale' && row.stale)
    ).toBe(true);
  });
});
