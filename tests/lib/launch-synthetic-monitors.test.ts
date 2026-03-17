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
import { buildLaunchSmokeCorridors } from '@/lib/launch/smoke-artifact';
import {
  getCurrentLaunchSyntheticStatus,
  getPersistedLaunchSyntheticStatus,
  getLaunchSyntheticStatusWithFreshHttpRevalidation,
  getLatestLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';
import { LAUNCH_MONITOR_DEFINITIONS, LAUNCH_SMOKE_MATRIX } from '@/lib/launch/contracts';

function buildPersistedStatusRow(monitorKey: string, overrides: Record<string, unknown> = {}) {
  const definition = LAUNCH_MONITOR_DEFINITIONS.find((item) => item.monitorKey === monitorKey);
  if (!definition) {
    throw new Error(`Unknown monitor key: ${monitorKey}`);
  }

  return {
    monitorKey,
    monitorGroup: definition.monitorGroup,
    status: 'pass',
    severity: definition.severity,
    responseTimeMs: 42,
    expectedState: definition.expectedState,
    observedState: definition.expectedState,
    failureClass: null,
    checkedAt: '2026-03-12T10:58:00.000Z',
    ageMinutes: 1,
    freshnessState: 'fresh',
    blocking: false,
    stale: false,
    details: {},
    ...overrides,
  };
}

function buildSmokeArtifact(generatedAt: string) {
  const checks = LAUNCH_SMOKE_MATRIX.map((scenario) => ({
    id: scenario.id,
    corridor: scenario.corridor,
    label: scenario.label,
    runner: scenario.runner,
    status: 'pass' as const,
    expectedState: scenario.expectedState,
    durationMs: 25,
    generatedAt,
    evidence: scenario.evidence,
  }));

  return {
    schemaVersion: 2,
    generatedAt,
    freshnessThresholdMinutes: 60,
    expiresAt: new Date(new Date(generatedAt).getTime() + 60 * 60_000).toISOString(),
    overallStatus: 'pass' as const,
    corridors: buildLaunchSmokeCorridors(checks, generatedAt),
    checks,
  };
}

describe('launch synthetic monitor persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('reads the latest monitor state when drizzle returns array rows', async () => {
    (db.execute as any).mockResolvedValue(
      LAUNCH_MONITOR_DEFINITIONS.map((definition, index) => ({
        monitor_key: definition.monitorKey,
        monitor_group: definition.monitorGroup,
        status: 'pass',
        severity: definition.severity,
        response_time_ms: definition.kind === 'http' ? 42 + index : 100,
        expected_state: definition.expectedState,
        observed_state: definition.expectedState,
        failure_class: null,
        checked_at:
          definition.kind === 'http'
            ? `2026-03-10T16:52:5${index}.000Z`
            : '2026-03-10T16:52:57.187Z',
        details: {},
      }))
    );

    const result = await getLatestLaunchSyntheticStatus(new Date('2026-03-10T16:53:25.057Z'));

    expect(result.rows).toHaveLength(LAUNCH_MONITOR_DEFINITIONS.length);
    expect(result.missingMonitorKeys).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('derives current launch status from live checks and the current smoke artifact', async () => {
    (fs.readFile as any).mockResolvedValue(
      JSON.stringify(buildSmokeArtifact('2026-03-12T10:00:00.000Z'))
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
    expect(
      result.rows.every(
        (row) => row.stale === false && row.freshnessState === 'fresh' && row.blocking === false
      )
    ).toBe(true);
    expect(db.execute).not.toHaveBeenCalled();
  });

  it('marks current smoke-backed monitors unverified when the smoke artifact itself is stale', async () => {
    (fs.readFile as any).mockResolvedValue(
      JSON.stringify(buildSmokeArtifact('2020-01-01T00:00:00.000Z'))
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
    expect(result.readinessState).toBe('unverified');
    expect(result.evidence.smokeArtifactAgeMinutes).toBe(61);
    expect(result.evidence.smokeFreshnessThresholdMinutes).toBe(60);
    expect(result.evidence.smokeFreshnessState).toBe('stale');
    expect(
      result.rows
        .filter((row) => row.monitorGroup === 'synthetic-smoke')
        .every(
          (row) =>
            row.observedState === 'smoke_artifact_stale' &&
            row.status === 'degraded' &&
            row.freshnessState === 'stale' &&
            row.blocking === false &&
            row.stale
        )
    ).toBe(true);
  });

  it('builds a ready persisted snapshot from fresh endpoint rows plus a fresh smoke artifact', async () => {
    (db.execute as any).mockResolvedValue(
      LAUNCH_MONITOR_DEFINITIONS.map((definition) => ({
        monitor_key: definition.monitorKey,
        monitor_group: definition.monitorGroup,
        status: 'pass',
        severity: definition.severity,
        response_time_ms: 42,
        expected_state: definition.expectedState,
        observed_state: definition.expectedState,
        failure_class: null,
        checked_at: '2026-03-12T10:58:00.000Z',
        details: {},
      }))
    );

    (fs.readFile as any).mockResolvedValue(
      JSON.stringify(buildSmokeArtifact('2026-03-12T10:00:00.000Z'))
    );

    const result = await getPersistedLaunchSyntheticStatus(
      {
        artifactPath: '.artifacts/launch-smoke-report.json',
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.source).toBe('persisted');
    expect(result.ok).toBe(true);
    expect(result.readinessState).toBe('ready');
    expect(result.evidence.persisted).toBe(true);
    expect(result.evidence.smokeArtifactGeneratedAt).toBe('2026-03-12T10:00:00.000Z');
    expect(result.evidence.smokeArtifactAgeMinutes).toBe(59);
    expect(result.evidence.smokeFreshnessState).toBe('fresh');
    expect(result.rows).toHaveLength(LAUNCH_MONITOR_DEFINITIONS.length);
    expect(result.missingMonitorKeys).toEqual([]);
  });

  it('revalidates stale persisted HTTP failures while preserving fresh smoke evidence', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith('/api/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 });
        }

        throw new Error(`Unexpected selective monitor refresh for ${url}`);
      })
    );

    const persistedStatus = {
      generatedAt: '2026-03-12T10:59:00.000Z',
      ok: false,
      readinessState: 'blocked' as const,
      source: 'persisted' as const,
      evidence: {
        source: 'persisted' as const,
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactSchemaVersion: 2,
        smokeArtifactGeneratedAt: '2026-03-12T10:00:00.000Z',
        smokeArtifactAgeMinutes: 59,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh' as const,
        persisted: true as const,
      },
      missingMonitorKeys: [],
      rows: LAUNCH_MONITOR_DEFINITIONS.map((definition) =>
        definition.monitorKey === 'api_health'
          ? buildPersistedStatusRow(definition.monitorKey, {
              monitorGroup: 'unknown',
              status: 'degraded',
              observedState: 'stale',
              failureClass: 'stale_monitor_result',
              freshnessState: 'stale',
              blocking: false,
              stale: true,
              ageMinutes: 16,
            })
          : buildPersistedStatusRow(definition.monitorKey)
      ),
    };

    const result = await getLaunchSyntheticStatusWithFreshHttpRevalidation(
      {
        baseUrl: 'https://example.com',
        artifactPath: '.artifacts/launch-smoke-report.json',
        persistedStatus,
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.source).toBe('live');
    expect(result.ok).toBe(true);
    expect(result.readinessState).toBe('ready');
    expect(result.evidence.persisted).toBe(false);
    expect(result.rows).toHaveLength(LAUNCH_MONITOR_DEFINITIONS.length);
    expect(result.rows.find((row) => row.monitorKey === 'api_health')).toEqual(
      expect.objectContaining({
        status: 'pass',
        failureClass: null,
        freshnessState: 'fresh',
        blocking: false,
        stale: false,
        observedState: 'health_contract_ok',
      })
    );
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('revalidates stale persisted HTTP failures even when smoke evidence is stale', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith('/api/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 });
        }

        throw new Error(`Unexpected selective monitor refresh for ${url}`);
      })
    );

    const persistedStatus = {
      generatedAt: '2026-03-12T10:59:00.000Z',
      ok: false,
      readinessState: 'unverified' as const,
      source: 'persisted' as const,
      evidence: {
        source: 'persisted' as const,
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactSchemaVersion: 2,
        smokeArtifactGeneratedAt: '2026-03-12T08:00:00.000Z',
        smokeArtifactAgeMinutes: 179,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'stale' as const,
        persisted: true as const,
      },
      missingMonitorKeys: [],
      rows: LAUNCH_MONITOR_DEFINITIONS.map((definition) =>
        definition.monitorKey === 'api_health'
          ? buildPersistedStatusRow(definition.monitorKey, {
              status: 'degraded',
              observedState: 'stale',
              failureClass: 'stale_monitor_result',
              freshnessState: 'stale',
              blocking: false,
              stale: true,
              ageMinutes: 16,
            })
          : definition.kind === 'smoke_artifact'
            ? buildPersistedStatusRow(definition.monitorKey, {
                monitorGroup: 'synthetic-smoke',
                status: 'degraded',
                observedState: 'smoke_artifact_stale',
                failureClass: 'smoke_artifact_stale',
                freshnessState: 'stale',
                blocking: false,
                stale: true,
                ageMinutes: 179,
              })
            : buildPersistedStatusRow(definition.monitorKey)
      ),
    };

    const result = await getLaunchSyntheticStatusWithFreshHttpRevalidation(
      {
        baseUrl: 'https://example.com',
        artifactPath: '.artifacts/launch-smoke-report.json',
        persistedStatus,
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.source).toBe('live');
    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('unverified');
    expect(result.rows.find((row) => row.monitorKey === 'api_health')).toEqual(
      expect.objectContaining({
        status: 'pass',
        freshnessState: 'fresh',
        blocking: false,
      })
    );
    expect(
      result.rows
        .filter((row) => row.monitorGroup === 'synthetic-smoke')
        .every((row) => row.freshnessState === 'stale' && row.blocking === false)
    ).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('keeps launch blocked when fresh HTTP revalidation reproduces a real failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith('/api/health')) {
          return new Response(JSON.stringify({ unhealthy: true }), { status: 200 });
        }

        throw new Error(`Unexpected selective monitor refresh for ${url}`);
      })
    );

    const persistedStatus = {
      generatedAt: '2026-03-12T10:59:00.000Z',
      ok: false,
      readinessState: 'blocked' as const,
      source: 'persisted' as const,
      evidence: {
        source: 'persisted' as const,
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactSchemaVersion: 2,
        smokeArtifactGeneratedAt: '2026-03-12T10:00:00.000Z',
        smokeArtifactAgeMinutes: 59,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh' as const,
        persisted: true as const,
      },
      missingMonitorKeys: [],
      rows: LAUNCH_MONITOR_DEFINITIONS.map((definition) =>
        definition.monitorKey === 'api_health'
          ? buildPersistedStatusRow(definition.monitorKey, {
              status: 'degraded',
              observedState: 'stale',
              failureClass: 'stale_monitor_result',
              freshnessState: 'stale',
              blocking: false,
              stale: true,
              ageMinutes: 16,
            })
          : buildPersistedStatusRow(definition.monitorKey)
      ),
    };

    const result = await getLaunchSyntheticStatusWithFreshHttpRevalidation(
      {
        baseUrl: 'https://example.com',
        artifactPath: '.artifacts/launch-smoke-report.json',
        persistedStatus,
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('blocked');
    expect(result.rows.find((row) => row.monitorKey === 'api_health')).toEqual(
      expect.objectContaining({
        status: 'fail',
        failureClass: 'payload_contract_mismatch',
        freshnessState: 'fresh',
        blocking: true,
        stale: false,
        observedState: 'missing_payload_key',
      })
    );
  });

  it('repairs missing HTTP monitor keys with selective revalidation when smoke evidence is fresh', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        if (url.endsWith('/api/health')) {
          return new Response(JSON.stringify({ status: 'healthy' }), { status: 200 });
        }

        throw new Error(`Unexpected selective monitor refresh for ${url}`);
      })
    );

    const persistedStatus = {
      generatedAt: '2026-03-12T10:59:00.000Z',
      ok: false,
      readinessState: 'blocked' as const,
      source: 'persisted' as const,
      evidence: {
        source: 'persisted' as const,
        artifactPath: '.artifacts/launch-smoke-report.json',
        smokeArtifactSchemaVersion: 2,
        smokeArtifactGeneratedAt: '2026-03-12T10:00:00.000Z',
        smokeArtifactAgeMinutes: 59,
        smokeFreshnessThresholdMinutes: 60,
        smokeFreshnessState: 'fresh' as const,
        persisted: true as const,
      },
      missingMonitorKeys: ['api_health'],
      rows: LAUNCH_MONITOR_DEFINITIONS.filter(
        (definition) => definition.monitorKey !== 'api_health'
      ).map((definition) => buildPersistedStatusRow(definition.monitorKey)),
    };

    const result = await getLaunchSyntheticStatusWithFreshHttpRevalidation(
      {
        baseUrl: 'https://example.com',
        artifactPath: '.artifacts/launch-smoke-report.json',
        persistedStatus,
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.ok).toBe(true);
    expect(result.readinessState).toBe('ready');
    expect(result.missingMonitorKeys).toEqual([]);
    expect(result.rows.find((row) => row.monitorKey === 'api_health')).toEqual(
      expect.objectContaining({
        status: 'pass',
        observedState: 'health_contract_ok',
      })
    );
  });

  it('marks persisted readiness unverified when the current smoke artifact is stale even if persisted rows were green', async () => {
    (db.execute as any).mockResolvedValue(
      LAUNCH_MONITOR_DEFINITIONS.map((definition) => ({
        monitor_key: definition.monitorKey,
        monitor_group: definition.monitorGroup,
        status: 'pass',
        severity: definition.severity,
        response_time_ms: 42,
        expected_state: definition.expectedState,
        observed_state: definition.expectedState,
        failure_class: null,
        checked_at: '2026-03-12T10:58:00.000Z',
        details: {},
      }))
    );

    (fs.readFile as any).mockResolvedValue(
      JSON.stringify(buildSmokeArtifact('2026-03-12T08:00:00.000Z'))
    );

    const result = await getPersistedLaunchSyntheticStatus(
      {
        artifactPath: '.artifacts/launch-smoke-report.json',
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('unverified');
    expect(result.evidence.smokeArtifactAgeMinutes).toBe(179);
    expect(result.evidence.smokeFreshnessState).toBe('stale');
    expect(
      result.rows
        .filter((row) => row.monitorGroup === 'synthetic-smoke')
        .every(
          (row) =>
            row.observedState === 'smoke_artifact_stale' &&
            row.status === 'degraded' &&
            row.freshnessState === 'stale' &&
            row.blocking === false
        )
    ).toBe(true);
  });

  it('marks persisted readiness unverified when the smoke artifact is missing', async () => {
    (db.execute as any).mockResolvedValue(
      LAUNCH_MONITOR_DEFINITIONS.filter((definition) => definition.kind === 'http').map(
        (definition) => ({
          monitor_key: definition.monitorKey,
          monitor_group: definition.monitorGroup,
          status: 'pass',
          severity: definition.severity,
          response_time_ms: 42,
          expected_state: definition.expectedState,
          observed_state: definition.expectedState,
          failure_class: null,
          checked_at: '2026-03-12T10:58:00.000Z',
          details: {},
        })
      )
    );

    (fs.readFile as any).mockRejectedValue(
      Object.assign(new Error('ENOENT: missing artifact'), { code: 'ENOENT' })
    );

    const result = await getPersistedLaunchSyntheticStatus(
      {
        artifactPath: '.artifacts/launch-smoke-report.json',
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('unverified');
    expect(result.evidence.smokeArtifactGeneratedAt).toBeNull();
    expect(result.evidence.smokeArtifactAgeMinutes).toBeNull();
    expect(result.evidence.smokeFreshnessState).toBe('missing');
    expect(result.rows).toHaveLength(LAUNCH_MONITOR_DEFINITIONS.length);
    expect(
      result.rows
        .filter((row) => row.monitorGroup === 'synthetic-smoke')
        .every(
          (row) =>
            row.observedState === 'smoke_artifact_missing' &&
            row.status === 'degraded' &&
            row.freshnessState === 'missing' &&
            row.blocking === false
        )
    ).toBe(true);
  });

  it('keeps persisted readiness blocked when a current endpoint failure exists alongside stale smoke evidence', async () => {
    (db.execute as any).mockResolvedValue(
      LAUNCH_MONITOR_DEFINITIONS.map((definition) => ({
        monitor_key: definition.monitorKey,
        monitor_group: definition.monitorGroup,
        status: definition.monitorKey === 'api_health' ? 'fail' : 'pass',
        severity: definition.severity,
        response_time_ms: 42,
        expected_state: definition.expectedState,
        observed_state:
          definition.monitorKey === 'api_health'
            ? 'unexpected_payload_value'
            : definition.expectedState,
        failure_class: definition.monitorKey === 'api_health' ? 'payload_contract_mismatch' : null,
        checked_at: '2026-03-12T10:58:00.000Z',
        details: {},
      }))
    );

    (fs.readFile as any).mockResolvedValue(
      JSON.stringify(buildSmokeArtifact('2026-03-12T08:00:00.000Z'))
    );

    const result = await getPersistedLaunchSyntheticStatus(
      {
        artifactPath: '.artifacts/launch-smoke-report.json',
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('blocked');
    expect(result.rows.find((row) => row.monitorKey === 'api_health')).toEqual(
      expect.objectContaining({
        status: 'fail',
        freshnessState: 'fresh',
        blocking: true,
        failureClass: 'payload_contract_mismatch',
      })
    );
    expect(
      result.rows
        .filter((row) => row.monitorGroup === 'synthetic-smoke')
        .every((row) => row.freshnessState === 'stale' && row.blocking === false)
    ).toBe(true);
  });

  it('blocks persisted readiness when endpoint evidence is incomplete', async () => {
    (db.execute as any).mockResolvedValue(
      LAUNCH_MONITOR_DEFINITIONS.filter(
        (definition) => definition.kind === 'http' && definition.monitorKey !== 'api_health'
      ).map((definition) => ({
        monitor_key: definition.monitorKey,
        monitor_group: definition.monitorGroup,
        status: 'pass',
        severity: definition.severity,
        response_time_ms: 42,
        expected_state: definition.expectedState,
        observed_state: definition.expectedState,
        failure_class: null,
        checked_at: '2026-03-12T10:58:00.000Z',
        details: {},
      }))
    );

    (fs.readFile as any).mockResolvedValue(
      JSON.stringify(buildSmokeArtifact('2026-03-12T10:00:00.000Z'))
    );

    const result = await getPersistedLaunchSyntheticStatus(
      {
        artifactPath: '.artifacts/launch-smoke-report.json',
      },
      new Date('2026-03-12T10:59:00.000Z')
    );

    expect(result.ok).toBe(false);
    expect(result.readinessState).toBe('blocked');
    expect(result.missingMonitorKeys).toContain('api_health');
  });
});
