import fs from 'node:fs/promises';

import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { classifyLaunchAlertStatus } from '@/lib/launch/alerting';
import {
  LAUNCH_MONITOR_DEFINITIONS,
  LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
  LAUNCH_MONITOR_STATUS_VALUES,
  type LaunchReadinessState,
  type LaunchSmokeFreshnessState,
  type LaunchMonitorDefinition,
  type LaunchMonitorStatus,
} from '@/lib/launch/contracts';
import {
  getLaunchSmokeAgeMinutes,
  getLaunchSmokeCheckStatus,
  validateLaunchSmokeArtifact,
} from '@/lib/launch/smoke-artifact';

export type SyntheticMonitorResult = {
  monitorKey: string;
  monitorGroup: LaunchMonitorDefinition['monitorGroup'];
  status: LaunchMonitorStatus;
  severity: LaunchMonitorDefinition['severity'];
  responseTimeMs: number | null;
  expectedState: string;
  observedState: string;
  failureClass: string | null;
  details: Record<string, unknown>;
  checkedAt: string;
};

export type CurrentLaunchSyntheticStatus = {
  generatedAt: string;
  rows: LaunchSyntheticStatusRow[];
  missingMonitorKeys: string[];
  ok: boolean;
  readinessState: LaunchReadinessState;
  source: 'live';
  evidence: {
    source: 'live';
    artifactPath: string;
    smokeArtifactGeneratedAt: string;
    smokeArtifactAgeMinutes: number;
    smokeFreshnessThresholdMinutes: number;
    smokeFreshnessState: Exclude<LaunchSmokeFreshnessState, 'missing'>;
    persisted: boolean;
  };
};

export type LaunchSyntheticStatusRow = {
  monitorKey: string;
  monitorGroup: string;
  status: string;
  severity: string;
  responseTimeMs: number | null;
  expectedState: string;
  observedState: string;
  failureClass: string | null;
  checkedAt: string | null;
  ageMinutes: number | null;
  stale: boolean;
  details: Record<string, unknown>;
};

export type PersistedLaunchSyntheticStatus = {
  generatedAt: string;
  rows: LaunchSyntheticStatusRow[];
  missingMonitorKeys: string[];
  ok: boolean;
  readinessState: LaunchReadinessState;
  source: 'persisted';
  evidence: {
    source: 'persisted';
    artifactPath: string;
    smokeArtifactGeneratedAt: string | null;
    smokeArtifactAgeMinutes: number | null;
    smokeFreshnessThresholdMinutes: number;
    smokeFreshnessState: LaunchSmokeFreshnessState;
    persisted: true;
  };
};

export async function readLaunchSmokeArtifactFromFile(artifactPath: string) {
  const raw = await fs.readFile(artifactPath, 'utf8');
  return validateLaunchSmokeArtifact(JSON.parse(raw));
}

function mapResultToStatusRow(
  result: SyntheticMonitorResult,
  now = new Date()
): LaunchSyntheticStatusRow {
  const checkedAt = result.checkedAt ? new Date(result.checkedAt) : null;
  const ageMinutes = checkedAt
    ? Math.max(0, Math.round((now.getTime() - checkedAt.getTime()) / 60_000))
    : 0;

  return {
    monitorKey: result.monitorKey,
    monitorGroup: result.monitorGroup,
    status: result.status,
    severity: result.severity,
    responseTimeMs: result.responseTimeMs,
    expectedState: result.expectedState,
    observedState: result.observedState,
    failureClass: result.failureClass,
    checkedAt: result.checkedAt ?? null,
    ageMinutes,
    stale: result.observedState === 'smoke_artifact_stale',
    details: result.details,
  };
}

function buildMissingSmokeArtifactRows(
  rows: Awaited<ReturnType<typeof getLatestLaunchSyntheticStatus>>['rows'],
  artifactPath: string,
  now = new Date()
): LaunchSyntheticStatusRow[] {
  const rowMap = new Map<string, LaunchSyntheticStatusRow>(
    rows.map((row) => [row.monitorKey, row] as const)
  );
  const nowIso = now.toISOString();

  return LAUNCH_MONITOR_DEFINITIONS.reduce<LaunchSyntheticStatusRow[]>((acc, definition) => {
    if (definition.kind !== 'smoke_artifact') {
      return acc;
    }

    const existing = rowMap.get(definition.monitorKey);
    acc.push({
      monitorKey: definition.monitorKey,
      monitorGroup: definition.monitorGroup,
      status: 'fail',
      severity: definition.severity,
      responseTimeMs: existing?.responseTimeMs ?? 0,
      expectedState: definition.expectedState,
      observedState: 'smoke_artifact_missing',
      failureClass: 'smoke_artifact_missing',
      checkedAt: existing?.checkedAt ?? nowIso,
      ageMinutes: existing?.ageMinutes ?? 0,
      stale: true,
      details: {
        ...(existing?.details ?? {}),
        artifactPath,
        smokeFreshnessState: 'missing',
      },
    });
    return acc;
  }, []);
}

function buildPersistedRowsInContractOrder(
  endpointRows: LaunchSyntheticStatusRow[],
  smokeRows: LaunchSyntheticStatusRow[]
) {
  const endpointMap = new Map(endpointRows.map((row) => [row.monitorKey, row] as const));
  const smokeMap = new Map(smokeRows.map((row) => [row.monitorKey, row] as const));

  return LAUNCH_MONITOR_DEFINITIONS.flatMap((definition) => {
    const row =
      definition.kind === 'http'
        ? endpointMap.get(definition.monitorKey)
        : smokeMap.get(definition.monitorKey);

    return row ? [row] : [];
  });
}

async function runHttpMonitor(
  definition: Extract<LaunchMonitorDefinition, { kind: 'http' }>,
  baseUrl: string
): Promise<SyntheticMonitorResult> {
  const startedAt = Date.now();
  const response = await fetch(new URL(definition.path, baseUrl), {
    method: definition.method,
    cache: 'no-store',
  });
  const responseTimeMs = Date.now() - startedAt;
  let failureClass: string | null = null;
  let status: LaunchMonitorStatus = response.status === definition.expectedStatus ? 'pass' : 'fail';
  let observedState = `http_${response.status}`;
  const details: Record<string, unknown> = {
    kind: definition.kind,
    path: definition.path,
    httpStatus: response.status,
  };

  if (status === 'pass' && definition.payloadChecks?.length) {
    try {
      const payload = await response.clone().json();
      details.payload = payload;
      for (const check of definition.payloadChecks) {
        if (!(check.key in payload)) {
          status = 'fail';
          failureClass = 'payload_contract_mismatch';
          observedState = 'missing_payload_key';
          break;
        }
        if (
          check.expectedValue != null &&
          String(payload[check.key as keyof typeof payload]) !== check.expectedValue
        ) {
          status = 'fail';
          failureClass = 'payload_contract_mismatch';
          observedState = 'unexpected_payload_value';
          break;
        }
      }
      if (status === 'pass') {
        observedState = definition.expectedState;
      }
    } catch (error) {
      status = 'fail';
      failureClass = 'payload_parse_failed';
      observedState = 'payload_parse_failed';
      details.error = error instanceof Error ? error.message : 'Unknown payload parse error';
    }
  } else if (status === 'fail') {
    failureClass = definition.failureClass;
  } else {
    observedState = definition.expectedState;
  }

  return {
    monitorKey: definition.monitorKey,
    monitorGroup: definition.monitorGroup,
    status,
    severity: definition.severity,
    responseTimeMs,
    expectedState: definition.expectedState,
    observedState,
    failureClass,
    details,
    checkedAt: new Date().toISOString(),
  };
}

function runSmokeArtifactMonitor(
  definition: Extract<LaunchMonitorDefinition, { kind: 'smoke_artifact' }>,
  artifact: Awaited<ReturnType<typeof readLaunchSmokeArtifactFromFile>>,
  artifactPath: string,
  now: Date
): SyntheticMonitorResult {
  const smokeCheck = getLaunchSmokeCheckStatus(artifact, definition.smokeScenarioId);
  const checkedAt = now.toISOString();

  if (!smokeCheck) {
    return {
      monitorKey: definition.monitorKey,
      monitorGroup: definition.monitorGroup,
      status: 'fail',
      severity: definition.severity,
      responseTimeMs: null,
      expectedState: definition.expectedState,
      observedState: 'missing_smoke_scenario',
      failureClass: 'smoke_scenario_missing',
      details: { artifactPath },
      checkedAt,
    };
  }

  const artifactAgeMinutes = getLaunchSmokeAgeMinutes(artifact, now);
  const stale = artifactAgeMinutes > definition.maxAgeMinutes;
  const status = stale
    ? 'fail'
    : smokeCheck.status === 'pass'
      ? 'pass'
      : smokeCheck.status === 'degraded'
        ? 'degraded'
        : 'fail';

  return {
    monitorKey: definition.monitorKey,
    monitorGroup: definition.monitorGroup,
    status,
    severity: definition.severity,
    responseTimeMs: smokeCheck.durationMs,
    expectedState: definition.expectedState,
    observedState: stale ? 'smoke_artifact_stale' : smokeCheck.expectedState,
    failureClass: stale
      ? 'smoke_artifact_stale'
      : status === 'pass'
        ? null
        : definition.failureClass,
    details: {
      artifactPath,
      artifactGeneratedAt: artifact.generatedAt,
      artifactAgeMinutes,
      smokeStatus: smokeCheck.status,
      smokeMessage: smokeCheck.message ?? null,
    },
    checkedAt,
  };
}

export async function persistSyntheticMonitorResults(results: SyntheticMonitorResult[]) {
  for (const result of results) {
    await db.execute(sql`
      INSERT INTO synthetic_monitor_runs (
        monitor_key,
        monitor_group,
        status,
        severity,
        response_time_ms,
        expected_state,
        observed_state,
        failure_class,
        details,
        checked_at
      ) VALUES (
        ${result.monitorKey},
        ${result.monitorGroup},
        ${result.status},
        ${result.severity},
        ${result.responseTimeMs},
        ${result.expectedState},
        ${result.observedState},
        ${result.failureClass},
        ${JSON.stringify(result.details)}::jsonb,
        ${result.checkedAt}::timestamptz
      )
    `);
  }
}

export async function runLaunchSyntheticMonitors(
  params: {
    baseUrl: string;
    artifactPath: string;
    persist?: boolean;
  },
  now = new Date()
) {
  const results: SyntheticMonitorResult[] = [];
  const smokeArtifact = await readLaunchSmokeArtifactFromFile(params.artifactPath);
  const generatedAt = now;
  const smokeArtifactAgeMinutes = getLaunchSmokeAgeMinutes(smokeArtifact, generatedAt);
  const smokeFreshnessState: Exclude<LaunchSmokeFreshnessState, 'missing'> =
    smokeArtifactAgeMinutes > LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES ? 'stale' : 'fresh';

  for (const definition of LAUNCH_MONITOR_DEFINITIONS) {
    if (definition.kind === 'http') {
      try {
        results.push(await runHttpMonitor(definition, params.baseUrl));
      } catch (error) {
        results.push({
          monitorKey: definition.monitorKey,
          monitorGroup: definition.monitorGroup,
          status: 'fail',
          severity: definition.severity,
          responseTimeMs: null,
          expectedState: definition.expectedState,
          observedState: 'monitor_execution_failed',
          failureClass: definition.failureClass,
          details: {
            kind: definition.kind,
            path: definition.path,
            error: error instanceof Error ? error.message : 'Unknown monitor error',
          },
          checkedAt: new Date().toISOString(),
        });
      }
      continue;
    }

    results.push(
      runSmokeArtifactMonitor(definition, smokeArtifact, params.artifactPath, generatedAt)
    );
  }

  if (params.persist !== false) {
    await persistSyntheticMonitorResults(results);
  }

  const failing = results.filter((result) => result.status === 'fail');
  const degraded = results.filter((result) => result.status === 'degraded');
  const alertSummary = results.map((result) => ({
    monitorKey: result.monitorKey,
    alertStatus: classifyLaunchAlertStatus({
      definition: LAUNCH_MONITOR_DEFINITIONS.find(
        (definition) => definition.monitorKey === result.monitorKey
      ) as LaunchMonitorDefinition,
      status: result.status,
      consecutiveFailures: result.status === 'pass' ? 0 : 1,
    }),
  }));

  return {
    ok: failing.length === 0,
    status:
      failing.length > 0
        ? 'fail'
        : degraded.length > 0
          ? 'degraded'
          : ('pass' as (typeof LAUNCH_MONITOR_STATUS_VALUES)[number]),
    generatedAt: generatedAt.toISOString(),
    results,
    summary: {
      total: results.length,
      pass: results.filter((result) => result.status === 'pass').length,
      degraded: degraded.length,
      fail: failing.length,
      p1Failures: failing.filter((result) => result.severity === 'p1').length,
      p2Failures: failing.filter((result) => result.severity === 'p2').length,
    },
    alertSummary,
    evidence: {
      source: 'live' as const,
      artifactPath: params.artifactPath,
      smokeArtifactGeneratedAt: smokeArtifact.generatedAt,
      smokeArtifactAgeMinutes,
      smokeFreshnessThresholdMinutes: LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
      smokeFreshnessState,
      persisted: params.persist !== false,
    },
  };
}

export async function getCurrentLaunchSyntheticStatus(
  params: Parameters<typeof runLaunchSyntheticMonitors>[0],
  now = new Date()
): Promise<CurrentLaunchSyntheticStatus> {
  const evaluation = await runLaunchSyntheticMonitors(params, now);
  const rows = evaluation.results.map((result) => mapResultToStatusRow(result, now));

  const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
    (monitorKey) => !rows.some((row) => row.monitorKey === monitorKey)
  );

  return {
    generatedAt: evaluation.generatedAt,
    rows,
    missingMonitorKeys,
    ok: evaluation.ok && missingMonitorKeys.length === 0,
    readinessState:
      evaluation.ok && missingMonitorKeys.length === 0 ? ('ready' as const) : ('blocked' as const),
    source: 'live',
    evidence: evaluation.evidence,
  };
}

export async function getPersistedLaunchSyntheticStatus(
  params: { artifactPath: string },
  now = new Date()
): Promise<PersistedLaunchSyntheticStatus> {
  const latest = await getLatestLaunchSyntheticStatus(now);
  const endpointRows = latest.rows.filter((row) => {
    const definition = LAUNCH_MONITOR_DEFINITIONS.find(
      (item) => item.monitorKey === row.monitorKey
    );
    return definition?.kind === 'http';
  });

  let smokeRows: LaunchSyntheticStatusRow[];
  let smokeArtifactGeneratedAt: string | null = null;
  let smokeArtifactAgeMinutes: number | null = null;
  let smokeFreshnessState: LaunchSmokeFreshnessState = 'missing';

  try {
    const artifact = await readLaunchSmokeArtifactFromFile(params.artifactPath);
    smokeArtifactGeneratedAt = artifact.generatedAt;
    smokeArtifactAgeMinutes = getLaunchSmokeAgeMinutes(artifact, now);
    smokeFreshnessState =
      smokeArtifactAgeMinutes > LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES ? 'stale' : 'fresh';

    smokeRows = LAUNCH_MONITOR_DEFINITIONS.reduce<LaunchSyntheticStatusRow[]>((acc, definition) => {
      if (definition.kind !== 'smoke_artifact') {
        return acc;
      }

      acc.push(
        mapResultToStatusRow(
          runSmokeArtifactMonitor(definition, artifact, params.artifactPath, now),
          now
        )
      );
      return acc;
    }, []);
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code !== 'ENOENT') {
      throw error;
    }

    smokeRows = buildMissingSmokeArtifactRows(latest.rows, params.artifactPath, now);
  }

  const rows = buildPersistedRowsInContractOrder(endpointRows, smokeRows);
  const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
    (monitorKey) => !rows.some((row) => row.monitorKey === monitorKey)
  );
  const ok = missingMonitorKeys.length === 0 && rows.every((row) => row.status === 'pass');

  return {
    generatedAt: now.toISOString(),
    rows,
    missingMonitorKeys,
    ok,
    readinessState: ok ? 'ready' : 'blocked',
    source: 'persisted',
    evidence: {
      source: 'persisted',
      artifactPath: params.artifactPath,
      smokeArtifactGeneratedAt,
      smokeArtifactAgeMinutes,
      smokeFreshnessThresholdMinutes: LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
      smokeFreshnessState,
      persisted: true,
    },
  };
}

export async function getLatestLaunchSyntheticStatus(now = new Date()) {
  const activeMonitorKeys = new Set(LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey));
  const latestRuns = await db.execute(sql`
    SELECT DISTINCT ON (monitor_key)
      monitor_key,
      monitor_group,
      status,
      severity,
      response_time_ms,
      expected_state,
      observed_state,
      failure_class,
      checked_at,
      details
    FROM synthetic_monitor_runs
    ORDER BY monitor_key, checked_at DESC
  `);

  const rows = getRows<Record<string, unknown>>(latestRuns as any)
    .filter((row) => activeMonitorKeys.has(String(row.monitor_key)))
    .map((row) => {
      const definition = LAUNCH_MONITOR_DEFINITIONS.find(
        (item) => item.monitorKey === row.monitor_key
      );
      const checkedAt = row.checked_at ? new Date(String(row.checked_at)) : null;
      const ageMinutes = checkedAt
        ? Math.max(0, Math.round((now.getTime() - checkedAt.getTime()) / 60_000))
        : null;
      const stale =
        definition != null ? ageMinutes != null && ageMinutes > definition.maxAgeMinutes : true;

      return {
        monitorKey: String(row.monitor_key),
        monitorGroup: String(row.monitor_group),
        status: stale ? 'fail' : String(row.status),
        severity: String(row.severity),
        responseTimeMs:
          typeof row.response_time_ms === 'number'
            ? row.response_time_ms
            : Number(row.response_time_ms ?? 0),
        expectedState: String(row.expected_state ?? ''),
        observedState: stale ? 'stale' : String(row.observed_state ?? ''),
        failureClass: stale
          ? 'stale_monitor_result'
          : row.failure_class
            ? String(row.failure_class)
            : null,
        checkedAt: checkedAt?.toISOString() ?? null,
        ageMinutes,
        stale,
        details: (row.details as Record<string, unknown> | null) ?? {},
      };
    });

  const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
    (monitorKey) => !rows.some((row) => row.monitorKey === monitorKey)
  );

  return {
    generatedAt: now.toISOString(),
    rows,
    missingMonitorKeys,
    ok: missingMonitorKeys.length === 0 && rows.every((row) => row.status === 'pass'),
  };
}
