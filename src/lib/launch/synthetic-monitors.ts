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
  evaluateLaunchSmokeArtifact,
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
  blocking?: boolean;
};

export type LaunchMonitorEvidenceSource = 'persisted' | 'live';
export type LaunchMonitorRefreshState =
  | 'not_applicable'
  | 'not_attempted'
  | 'retained_persisted'
  | 'refreshed_from_stale'
  | 'refreshed_from_missing';

export type LaunchLiveRefreshSummary = {
  attempted: boolean;
  refreshedMonitorKeys: string[];
  recoveredMonitorKeys: string[];
  failedMonitorKeys: string[];
  finalHttpEvidenceSource: 'persisted' | 'live' | 'mixed';
  error: string | null;
};

export type CurrentLaunchSyntheticStatus = {
  generatedAt: string;
  rows: LaunchSyntheticStatusRow[];
  missingMonitorKeys: string[];
  ok: boolean;
  readinessState: LaunchReadinessState;
  source: 'live';
  liveRefresh: LaunchLiveRefreshSummary;
  evidence: {
    source: 'live';
    artifactPath: string;
    smokeArtifactSchemaVersion: number | null;
    smokeArtifactGeneratedAt: string | null;
    smokeArtifactAgeMinutes: number | null;
    smokeFreshnessThresholdMinutes: number;
    smokeFreshnessState: LaunchSmokeFreshnessState;
    smokeEvidenceSource?: 'db' | 'artifact' | 'mixed' | 'missing';
    persisted: boolean;
  };
};

export type LaunchSyntheticStatusRow = {
  monitorKey: string;
  monitorGroup: string;
  status: LaunchMonitorStatus;
  severity: string;
  responseTimeMs: number | null;
  expectedState: string;
  observedState: string;
  failureClass: string | null;
  checkedAt: string | null;
  ageMinutes: number | null;
  freshnessState: LaunchSmokeFreshnessState;
  blocking: boolean;
  stale: boolean;
  lastSuccessfulCheckedAt: string | null;
  evidenceSource: LaunchMonitorEvidenceSource;
  refreshState: LaunchMonitorRefreshState;
  details: Record<string, unknown>;
};

export type PersistedLaunchSyntheticStatus = {
  generatedAt: string;
  rows: LaunchSyntheticStatusRow[];
  missingMonitorKeys: string[];
  ok: boolean;
  readinessState: LaunchReadinessState;
  source: 'persisted';
  liveRefresh: LaunchLiveRefreshSummary;
  evidence: {
    source: 'persisted';
    artifactPath: string;
    smokeArtifactSchemaVersion: number | null;
    smokeArtifactGeneratedAt: string | null;
    smokeArtifactAgeMinutes: number | null;
    smokeFreshnessThresholdMinutes: number;
    smokeFreshnessState: LaunchSmokeFreshnessState;
    smokeEvidenceSource?: 'db' | 'artifact' | 'mixed' | 'missing';
    persisted: true;
  };
};

export type LaunchSyntheticStatusSnapshot =
  | CurrentLaunchSyntheticStatus
  | PersistedLaunchSyntheticStatus;

export async function readLaunchSmokeArtifactFromFile(artifactPath: string) {
  const raw = await fs.readFile(artifactPath, 'utf8');
  return validateLaunchSmokeArtifact(JSON.parse(raw));
}

function getFreshnessState(observedState: string): LaunchSmokeFreshnessState {
  if (observedState === 'smoke_artifact_missing') {
    return 'missing';
  }

  if (observedState === 'smoke_artifact_stale' || observedState === 'stale') {
    return 'stale';
  }

  return 'fresh';
}

function buildEmptyLiveRefreshSummary(
  finalHttpEvidenceSource: LaunchLiveRefreshSummary['finalHttpEvidenceSource']
): LaunchLiveRefreshSummary {
  return {
    attempted: false,
    refreshedMonitorKeys: [],
    recoveredMonitorKeys: [],
    failedMonitorKeys: [],
    finalHttpEvidenceSource,
    error: null,
  };
}

function isBlockingMonitorRow(
  row:
    | Pick<LaunchSyntheticStatusRow, 'status' | 'freshnessState' | 'blocking'>
    | {
        status: LaunchMonitorStatus;
        freshnessState: LaunchSmokeFreshnessState;
        blocking?: boolean;
      }
) {
  if (typeof row.blocking === 'boolean') {
    return row.blocking;
  }

  return row.freshnessState === 'fresh' && row.status !== 'pass';
}

function evaluateLaunchReadiness(
  rows: LaunchSyntheticStatusRow[],
  missingMonitorKeys: string[]
): Pick<LaunchSyntheticStatusSnapshot, 'ok' | 'readinessState'> {
  const hasBlockingRows =
    missingMonitorKeys.length > 0 ||
    rows.some((row) => isBlockingMonitorRow(row) || row.freshnessState !== 'fresh');

  if (!hasBlockingRows) {
    return {
      ok: true,
      readinessState: 'ready',
    };
  }

  return {
    ok: false,
    readinessState: 'blocked',
  };
}

function mapResultToStatusRow(
  result: SyntheticMonitorResult,
  now = new Date(),
  options: {
    lastSuccessfulCheckedAt?: string | null;
    evidenceSource?: LaunchMonitorEvidenceSource;
    refreshState?: LaunchMonitorRefreshState;
  } = {}
): LaunchSyntheticStatusRow {
  const checkedAt = result.checkedAt ? new Date(result.checkedAt) : null;
  const ageMinutes = checkedAt
    ? Math.max(0, Math.round((now.getTime() - checkedAt.getTime()) / 60_000))
    : 0;
  const freshnessState = getFreshnessState(result.observedState);

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
    freshnessState,
    blocking:
      typeof result.blocking === 'boolean'
        ? result.blocking
        : freshnessState === 'fresh' && result.status !== 'pass',
    stale: freshnessState !== 'fresh',
    lastSuccessfulCheckedAt: options.lastSuccessfulCheckedAt ?? null,
    evidenceSource: options.evidenceSource ?? 'live',
    refreshState: options.refreshState ?? 'not_attempted',
    details: result.details,
  };
}

function buildMissingSmokeArtifactRows(
  rows: Awaited<ReturnType<typeof getLatestLaunchSyntheticStatus>>['rows'],
  artifactPath: string,
  lastSuccessfulByMonitorKey: Map<string, string | null>,
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
    const missingRow: LaunchSyntheticStatusRow = {
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
      freshnessState: 'missing',
      blocking: true,
      stale: true,
      lastSuccessfulCheckedAt:
        lastSuccessfulByMonitorKey.get(definition.monitorKey) ??
        existing?.lastSuccessfulCheckedAt ??
        null,
      evidenceSource: 'persisted',
      refreshState: 'not_applicable',
      details: {
        ...(existing?.details ?? {}),
        artifactPath,
        smokeArtifactState: 'missing',
        smokeFreshnessState: 'missing',
      },
    };
    acc.push(missingRow);
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

function summarizeSmokeEvidenceFromRows(smokeRows: LaunchSyntheticStatusRow[], now: Date) {
  const detailsList = smokeRows.map((row) => row.details ?? {});
  const smokeArtifactGeneratedAt = detailsList.find(
    (details) => typeof details.artifactGeneratedAt === 'string'
  )?.artifactGeneratedAt;
  const smokeFreshnessThresholdMinutes =
    (detailsList.find((details) => typeof details.freshnessThresholdMinutes === 'number')
      ?.freshnessThresholdMinutes as number | undefined) ??
    LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES;
  const smokeArtifactSchemaVersion =
    (detailsList.find((details) => typeof details.artifactSchemaVersion === 'number')
      ?.artifactSchemaVersion as number | undefined) ?? null;
  const explicitAgeMinutes =
    (detailsList.find((details) => typeof details.artifactAgeMinutes === 'number')
      ?.artifactAgeMinutes as number | undefined) ?? null;
  const smokeArtifactAgeMinutes =
    explicitAgeMinutes ??
    (typeof smokeArtifactGeneratedAt === 'string'
      ? Math.max(
          0,
          Math.round((now.getTime() - new Date(smokeArtifactGeneratedAt).getTime()) / 60_000)
        )
      : null);
  const smokeFreshnessState: LaunchSmokeFreshnessState = smokeRows.some(
    (row) => row.freshnessState === 'missing'
  )
    ? 'missing'
    : smokeRows.some((row) => row.freshnessState === 'stale')
      ? 'stale'
      : 'fresh';

  return {
    smokeArtifactSchemaVersion,
    smokeArtifactGeneratedAt:
      typeof smokeArtifactGeneratedAt === 'string' ? smokeArtifactGeneratedAt : null,
    smokeArtifactAgeMinutes,
    smokeFreshnessThresholdMinutes,
    smokeFreshnessState,
  };
}

function buildSmokeArtifactStatusRows(
  artifact: Awaited<ReturnType<typeof readLaunchSmokeArtifactFromFile>>,
  artifactPath: string,
  lastSuccessfulByMonitorKey: Map<string, string | null>,
  now: Date
) {
  return getSmokeArtifactMonitorDefinitions().map((definition) =>
    mapResultToStatusRow(runSmokeArtifactMonitor(definition, artifact, artifactPath, now), now, {
      lastSuccessfulCheckedAt: lastSuccessfulByMonitorKey.get(definition.monitorKey) ?? null,
      evidenceSource: 'persisted',
      refreshState: 'not_applicable',
    })
  );
}

function isHttpMonitorDefinition(
  definition: LaunchMonitorDefinition
): definition is Extract<LaunchMonitorDefinition, { kind: 'http' }> {
  return definition.kind === 'http';
}

function isSmokeArtifactMonitorDefinition(
  definition: LaunchMonitorDefinition
): definition is Extract<LaunchMonitorDefinition, { kind: 'smoke_artifact' }> {
  return definition.kind === 'smoke_artifact';
}

function getLaunchMonitorDefinition(monitorKey: string) {
  return LAUNCH_MONITOR_DEFINITIONS.find((definition) => definition.monitorKey === monitorKey);
}

async function getLastSuccessfulMonitorRunMap() {
  const execute = getDbExecute();
  if (!execute) {
    return new Map<string, string | null>();
  }

  let latestSuccessfulRuns: unknown;
  try {
    latestSuccessfulRuns = await execute(sql`
      SELECT monitor_key, MAX(checked_at) AS last_successful_checked_at
      FROM synthetic_monitor_runs
      WHERE status = 'pass'
      GROUP BY monitor_key
    `);
  } catch {
    return new Map<string, string | null>();
  }
  if (latestSuccessfulRuns == null) {
    return new Map<string, string | null>();
  }

  return new Map(
    getRows<Record<string, unknown>>(latestSuccessfulRuns as any).map((row) => [
      String(row.monitor_key),
      row.last_successful_checked_at
        ? new Date(String(row.last_successful_checked_at)).toISOString()
        : row.checked_at
          ? new Date(String(row.checked_at)).toISOString()
          : null,
    ])
  );
}

export function getHttpMonitorKeysNeedingRefresh(
  status: Pick<PersistedLaunchSyntheticStatus, 'rows' | 'missingMonitorKeys'>
) {
  const refreshMonitorKeys = new Set<string>();
  const persistedRowMap = new Map(status.rows.map((row) => [row.monitorKey, row] as const));

  for (const definition of getHttpMonitorDefinitions()) {
    const row = persistedRowMap.get(definition.monitorKey);
    if (
      !row ||
      row.failureClass === 'stale_monitor_result' ||
      row.freshnessState !== 'fresh' ||
      row.stale ||
      row.observedState === 'stale'
    ) {
      refreshMonitorKeys.add(definition.monitorKey);
    }
  }

  return [...refreshMonitorKeys];
}

function getHttpMonitorDefinitions() {
  return LAUNCH_MONITOR_DEFINITIONS.filter(isHttpMonitorDefinition);
}

function getSmokeArtifactMonitorDefinitions() {
  return LAUNCH_MONITOR_DEFINITIONS.filter(isSmokeArtifactMonitorDefinition);
}

function getDbExecute() {
  const execute = (db as { execute?: unknown }).execute;
  if (typeof execute !== 'function') {
    return null;
  }

  return (query: unknown) =>
    (execute as (this: typeof db, query: unknown) => Promise<unknown>).call(db, query);
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

async function executeHttpMonitor(
  definition: Extract<LaunchMonitorDefinition, { kind: 'http' }>,
  baseUrl: string
): Promise<SyntheticMonitorResult> {
  try {
    return await runHttpMonitor(definition, baseUrl);
  } catch (error) {
    return {
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
    };
  }
}

function runSmokeArtifactMonitor(
  definition: Extract<LaunchMonitorDefinition, { kind: 'smoke_artifact' }>,
  artifact: Awaited<ReturnType<typeof readLaunchSmokeArtifactFromFile>>,
  artifactPath: string,
  now: Date
): SyntheticMonitorResult {
  const artifactEvaluation = evaluateLaunchSmokeArtifact(artifact, { now });
  const smokeCheck = getLaunchSmokeCheckStatus(artifact, definition.smokeScenarioId);
  const checkedAt = now.toISOString();

  if (
    !smokeCheck ||
    artifactEvaluation.incompleteScenarioIds.includes(definition.smokeScenarioId)
  ) {
    return {
      monitorKey: definition.monitorKey,
      monitorGroup: definition.monitorGroup,
      status: 'fail',
      severity: definition.severity,
      responseTimeMs: null,
      expectedState: definition.expectedState,
      observedState: 'smoke_artifact_missing',
      failureClass: 'smoke_artifact_missing',
      details: {
        artifactPath,
        artifactSchemaVersion: artifact.schemaVersion,
        artifactGeneratedAt: artifact.generatedAt,
        artifactAgeMinutes: artifactEvaluation.ageMinutes,
        freshnessThresholdMinutes: artifactEvaluation.freshnessThresholdMinutes,
        smokeArtifactState: 'missing',
        smokeFreshnessState: 'missing',
        smokeMessage: 'Launch smoke artifact is missing required corridor evidence.',
      },
      checkedAt,
      blocking: true,
    };
  }

  const stale = artifactEvaluation.state === 'stale';
  const artifactDeclaredFailing =
    artifactEvaluation.state === 'fresh_failing' &&
    artifactEvaluation.failingScenarioIds.length === 0 &&
    artifactEvaluation.incompleteScenarioIds.length === 0;
  const status = stale
    ? 'fail'
    : artifactDeclaredFailing
      ? 'fail'
      : smokeCheck.status === 'pass'
        ? 'pass'
        : smokeCheck.status;

  return {
    monitorKey: definition.monitorKey,
    monitorGroup: definition.monitorGroup,
    status,
    severity: definition.severity,
    responseTimeMs: smokeCheck.durationMs,
    expectedState: definition.expectedState,
    observedState: stale
      ? 'smoke_artifact_stale'
      : artifactDeclaredFailing
        ? 'smoke_artifact_check_failed'
        : status === 'pass'
          ? smokeCheck.expectedState
          : 'smoke_artifact_check_failed',
    failureClass: stale
      ? 'smoke_artifact_stale'
      : status === 'pass'
        ? null
        : definition.failureClass,
    details: {
      artifactPath,
      artifactSchemaVersion: artifact.schemaVersion,
      artifactGeneratedAt: artifact.generatedAt,
      artifactAgeMinutes: artifactEvaluation.ageMinutes,
      freshnessThresholdMinutes: artifactEvaluation.freshnessThresholdMinutes,
      smokeArtifactState: artifactEvaluation.state,
      smokeStatus: smokeCheck.status,
      smokeMessage: smokeCheck.message ?? null,
      artifactMessage: artifactEvaluation.message,
      smokeFreshnessState: stale ? 'stale' : 'fresh',
    },
    checkedAt,
    blocking: stale || status !== 'pass',
  };
}

export async function persistSyntheticMonitorResults(results: SyntheticMonitorResult[]) {
  const execute = getDbExecute();
  if (!execute) {
    return false;
  }

  try {
    for (const result of results) {
      await execute(sql`
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
  } catch {
    return false;
  }

  return true;
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
  const lastSuccessfulByMonitorKey = await getLastSuccessfulMonitorRunMap();
  const smokeArtifact = await readLaunchSmokeArtifactFromFile(params.artifactPath);
  const generatedAt = now;
  const smokeArtifactEvaluation = evaluateLaunchSmokeArtifact(smokeArtifact, { now: generatedAt });
  const smokeFreshnessState: Exclude<LaunchSmokeFreshnessState, 'missing'> =
    smokeArtifactEvaluation.stale ? 'stale' : 'fresh';

  for (const definition of LAUNCH_MONITOR_DEFINITIONS) {
    if (definition.kind === 'http') {
      results.push(await executeHttpMonitor(definition, params.baseUrl));
      continue;
    }

    results.push(
      runSmokeArtifactMonitor(definition, smokeArtifact, params.artifactPath, generatedAt)
    );
  }

  let persisted = false;
  if (params.persist !== false) {
    persisted = await persistSyntheticMonitorResults(results);
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
      smokeArtifactSchemaVersion: smokeArtifact.schemaVersion,
      smokeArtifactGeneratedAt: smokeArtifact.generatedAt,
      smokeArtifactAgeMinutes: smokeArtifactEvaluation.ageMinutes,
      smokeFreshnessThresholdMinutes: smokeArtifactEvaluation.freshnessThresholdMinutes,
      smokeFreshnessState,
      smokeEvidenceSource: 'artifact' as const,
      persisted,
    },
    lastSuccessfulByMonitorKey,
  };
}

export async function getCurrentLaunchSyntheticStatus(
  params: Parameters<typeof runLaunchSyntheticMonitors>[0],
  now = new Date()
): Promise<CurrentLaunchSyntheticStatus> {
  const evaluation = await runLaunchSyntheticMonitors(params, now);
  const rows = evaluation.results.map((result) =>
    mapResultToStatusRow(result, now, {
      lastSuccessfulCheckedAt:
        evaluation.lastSuccessfulByMonitorKey.get(result.monitorKey) ??
        (result.status === 'pass' ? result.checkedAt : null) ??
        null,
      evidenceSource: 'live',
      refreshState: result.monitorGroup === 'endpoint' ? 'not_attempted' : 'not_applicable',
    })
  );

  const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
    (monitorKey) => !rows.some((row) => row.monitorKey === monitorKey)
  );
  const readiness = evaluateLaunchReadiness(rows, missingMonitorKeys);

  return {
    generatedAt: evaluation.generatedAt,
    rows,
    missingMonitorKeys,
    ok: readiness.ok,
    readinessState: readiness.readinessState,
    source: 'live',
    liveRefresh: buildEmptyLiveRefreshSummary('live'),
    evidence: evaluation.evidence,
  };
}

export async function getLaunchSyntheticStatusWithFreshHttpRevalidation(
  params: {
    baseUrl: string;
    artifactPath: string;
    persistedStatus?: PersistedLaunchSyntheticStatus;
  },
  now = new Date()
): Promise<CurrentLaunchSyntheticStatus> {
  const persisted =
    params.persistedStatus ??
    (await getPersistedLaunchSyntheticStatus({ artifactPath: params.artifactPath }, now));

  const refreshMonitorKeys = new Set(getHttpMonitorKeysNeedingRefresh(persisted));
  const persistedRowMap = new Map(persisted.rows.map((row) => [row.monitorKey, row] as const));
  const lastSuccessfulByMonitorKey = await getLastSuccessfulMonitorRunMap();

  const refreshedHttpRows = await Promise.all(
    getHttpMonitorDefinitions()
      .filter((definition) => refreshMonitorKeys.has(definition.monitorKey))
      .map(async (definition) => {
        const persistedRow = persistedRowMap.get(definition.monitorKey);
        const refreshState = persistedRow ? 'refreshed_from_stale' : 'refreshed_from_missing';
        const result = await executeHttpMonitor(definition, params.baseUrl);

        return mapResultToStatusRow(result, now, {
          lastSuccessfulCheckedAt:
            result.status === 'pass'
              ? result.checkedAt
              : (lastSuccessfulByMonitorKey.get(definition.monitorKey) ?? null),
          evidenceSource: 'live',
          refreshState,
        });
      })
  );

  const retainedHttpRows = persisted.rows
    .filter((row) => {
      const definition = getLaunchMonitorDefinition(row.monitorKey);
      return (
        definition != null &&
        isHttpMonitorDefinition(definition) &&
        !refreshMonitorKeys.has(row.monitorKey)
      );
    })
    .map((row) => ({
      ...row,
      evidenceSource: 'persisted' as const,
      refreshState: 'retained_persisted' as const,
    }));

  const smokeRows = persisted.rows
    .filter((row) => {
      const definition = getLaunchMonitorDefinition(row.monitorKey);
      return definition != null && isSmokeArtifactMonitorDefinition(definition);
    })
    .map((row) => ({
      ...row,
      evidenceSource: 'persisted' as const,
      refreshState: 'not_applicable' as const,
    }));

  const rows = buildPersistedRowsInContractOrder(
    [...retainedHttpRows, ...refreshedHttpRows],
    smokeRows
  );
  const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
    (monitorKey) => !rows.some((row) => row.monitorKey === monitorKey)
  );
  const readiness = evaluateLaunchReadiness(rows, missingMonitorKeys);

  return {
    generatedAt: now.toISOString(),
    rows,
    missingMonitorKeys,
    ok: readiness.ok,
    readinessState: readiness.readinessState,
    source: 'live',
    liveRefresh: {
      attempted: refreshMonitorKeys.size > 0,
      refreshedMonitorKeys: [...refreshMonitorKeys],
      recoveredMonitorKeys: refreshedHttpRows
        .filter((row) => row.status === 'pass' && row.freshnessState === 'fresh')
        .map((row) => row.monitorKey),
      failedMonitorKeys: refreshedHttpRows
        .filter((row) => row.status !== 'pass' || row.freshnessState !== 'fresh')
        .map((row) => row.monitorKey),
      finalHttpEvidenceSource:
        refreshMonitorKeys.size === 0
          ? 'persisted'
          : retainedHttpRows.length === 0
            ? 'live'
            : 'mixed',
      error: null,
    },
    evidence: {
      source: 'live',
      artifactPath: persisted.evidence.artifactPath,
      smokeArtifactSchemaVersion: persisted.evidence.smokeArtifactSchemaVersion,
      smokeArtifactGeneratedAt: persisted.evidence.smokeArtifactGeneratedAt,
      smokeArtifactAgeMinutes: persisted.evidence.smokeArtifactAgeMinutes,
      smokeFreshnessThresholdMinutes: persisted.evidence.smokeFreshnessThresholdMinutes,
      smokeFreshnessState: persisted.evidence.smokeFreshnessState,
      smokeEvidenceSource: persisted.evidence.smokeEvidenceSource,
      persisted: false,
    },
  };
}

export async function getPersistedLaunchSyntheticStatus(
  params: { artifactPath: string },
  now = new Date()
): Promise<PersistedLaunchSyntheticStatus> {
  const latest = await getLatestLaunchSyntheticStatus(now);
  const lastSuccessfulByMonitorKey = new Map(
    latest.rows.map((row) => [row.monitorKey, row.lastSuccessfulCheckedAt] as const)
  );
  const endpointRows = latest.rows.filter((row) => {
    const definition = LAUNCH_MONITOR_DEFINITIONS.find(
      (item) => item.monitorKey === row.monitorKey
    );
    return definition?.kind === 'http';
  });
  const persistedSmokeRows = latest.rows.filter((row) => {
    const definition = LAUNCH_MONITOR_DEFINITIONS.find(
      (item) => item.monitorKey === row.monitorKey
    );
    return definition?.kind === 'smoke_artifact';
  });
  const smokeMonitorDefinitions = getSmokeArtifactMonitorDefinitions();

  let smokeRows: LaunchSyntheticStatusRow[];
  let smokeArtifactSchemaVersion: number | null = null;
  let smokeArtifactGeneratedAt: string | null = null;
  let smokeArtifactAgeMinutes: number | null = null;
  let smokeFreshnessState: LaunchSmokeFreshnessState = 'missing';
  let smokeFreshnessThresholdMinutes = LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES;
  let smokeEvidenceSource: 'db' | 'artifact' | 'mixed' | 'missing' = 'missing';

  if (persistedSmokeRows.length === smokeMonitorDefinitions.length) {
    const persistedRows = buildPersistedRowsInContractOrder([], persistedSmokeRows).filter(
      (row) => row.monitorGroup !== 'endpoint'
    );
    const persistedSummary = summarizeSmokeEvidenceFromRows(persistedRows, now);
    let artifactRows: LaunchSyntheticStatusRow[] | null = null;
    let artifactSummary: ReturnType<typeof summarizeSmokeEvidenceFromRows> | null = null;

    try {
      const artifact = await readLaunchSmokeArtifactFromFile(params.artifactPath);
      artifactRows = buildSmokeArtifactStatusRows(
        artifact,
        params.artifactPath,
        lastSuccessfulByMonitorKey,
        now
      );
      artifactSummary = summarizeSmokeEvidenceFromRows(artifactRows, now);
    } catch (error) {
      if ((error as NodeJS.ErrnoException | undefined)?.code !== 'ENOENT') {
        throw error;
      }
    }

    const persistedGeneratedAt = persistedSummary.smokeArtifactGeneratedAt
      ? new Date(persistedSummary.smokeArtifactGeneratedAt).getTime()
      : 0;
    const artifactGeneratedAt = artifactSummary?.smokeArtifactGeneratedAt
      ? new Date(artifactSummary.smokeArtifactGeneratedAt).getTime()
      : 0;
    const artifactIsNewerAndFresh =
      artifactRows != null &&
      artifactSummary != null &&
      artifactSummary?.smokeFreshnessState === 'fresh' &&
      artifactGeneratedAt > persistedGeneratedAt;

    let summary = persistedSummary;
    if (artifactIsNewerAndFresh && artifactRows != null && artifactSummary != null) {
      smokeRows = artifactRows;
      summary = artifactSummary;
    } else {
      smokeRows = persistedRows;
    }
    smokeArtifactSchemaVersion = summary.smokeArtifactSchemaVersion;
    smokeArtifactGeneratedAt = summary.smokeArtifactGeneratedAt;
    smokeArtifactAgeMinutes = summary.smokeArtifactAgeMinutes;
    smokeFreshnessThresholdMinutes = summary.smokeFreshnessThresholdMinutes;
    smokeFreshnessState = summary.smokeFreshnessState;
    smokeEvidenceSource = artifactIsNewerAndFresh ? 'artifact' : 'db';
  } else {
    try {
      const artifact = await readLaunchSmokeArtifactFromFile(params.artifactPath);
      const artifactEvaluation = evaluateLaunchSmokeArtifact(artifact, { now });
      smokeArtifactSchemaVersion = artifact.schemaVersion;
      smokeArtifactGeneratedAt = artifact.generatedAt;
      smokeArtifactAgeMinutes = artifactEvaluation.ageMinutes;
      smokeFreshnessThresholdMinutes = artifactEvaluation.freshnessThresholdMinutes;
      smokeFreshnessState = artifactEvaluation.stale ? 'stale' : 'fresh';

      const artifactRows = buildSmokeArtifactStatusRows(
        artifact,
        params.artifactPath,
        lastSuccessfulByMonitorKey,
        now
      );

      if (persistedSmokeRows.length > 0) {
        const mergedRows = new Map(artifactRows.map((row) => [row.monitorKey, row] as const));
        for (const persistedRow of persistedSmokeRows) {
          mergedRows.set(persistedRow.monitorKey, persistedRow);
        }
        smokeRows = smokeMonitorDefinitions.flatMap((definition) => {
          const row = mergedRows.get(definition.monitorKey);
          return row ? [row] : [];
        });
        const summary = summarizeSmokeEvidenceFromRows(smokeRows, now);
        smokeArtifactSchemaVersion =
          summary.smokeArtifactSchemaVersion ?? smokeArtifactSchemaVersion;
        smokeArtifactGeneratedAt = summary.smokeArtifactGeneratedAt ?? smokeArtifactGeneratedAt;
        smokeArtifactAgeMinutes = summary.smokeArtifactAgeMinutes ?? smokeArtifactAgeMinutes;
        smokeFreshnessThresholdMinutes = summary.smokeFreshnessThresholdMinutes;
        smokeFreshnessState = summary.smokeFreshnessState;
        smokeEvidenceSource = 'mixed';
      } else {
        smokeRows = artifactRows;
        smokeEvidenceSource = 'artifact';
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException | undefined)?.code !== 'ENOENT') {
        throw error;
      }

      const missingRows = buildMissingSmokeArtifactRows(
        latest.rows,
        params.artifactPath,
        lastSuccessfulByMonitorKey,
        now
      );
      if (persistedSmokeRows.length > 0) {
        const mergedRows = new Map(missingRows.map((row) => [row.monitorKey, row] as const));
        for (const persistedRow of persistedSmokeRows) {
          mergedRows.set(persistedRow.monitorKey, persistedRow);
        }
        smokeRows = smokeMonitorDefinitions.flatMap((definition) => {
          const row = mergedRows.get(definition.monitorKey);
          return row ? [row] : [];
        });
        const summary = summarizeSmokeEvidenceFromRows(smokeRows, now);
        smokeArtifactSchemaVersion = summary.smokeArtifactSchemaVersion;
        smokeArtifactGeneratedAt = summary.smokeArtifactGeneratedAt;
        smokeArtifactAgeMinutes = summary.smokeArtifactAgeMinutes;
        smokeFreshnessThresholdMinutes = summary.smokeFreshnessThresholdMinutes;
        smokeFreshnessState = summary.smokeFreshnessState;
        smokeEvidenceSource = 'mixed';
      } else {
        smokeRows = missingRows;
        smokeEvidenceSource = 'missing';
      }
    }
  }

  const rows = buildPersistedRowsInContractOrder(endpointRows, smokeRows);
  const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
    (monitorKey) => !rows.some((row) => row.monitorKey === monitorKey)
  );
  const readiness = evaluateLaunchReadiness(rows, missingMonitorKeys);

  return {
    generatedAt: now.toISOString(),
    rows,
    missingMonitorKeys,
    ok: readiness.ok,
    readinessState: readiness.readinessState,
    source: 'persisted',
    liveRefresh: buildEmptyLiveRefreshSummary('persisted'),
    evidence: {
      source: 'persisted',
      artifactPath: params.artifactPath,
      smokeArtifactSchemaVersion,
      smokeArtifactGeneratedAt,
      smokeArtifactAgeMinutes,
      smokeFreshnessThresholdMinutes,
      smokeFreshnessState,
      smokeEvidenceSource,
      persisted: true,
    },
  };
}

export async function getLatestLaunchSyntheticStatus(now = new Date()) {
  const activeMonitorKeys = new Set(LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey));
  const execute = getDbExecute();
  if (!execute) {
    return {
      generatedAt: now.toISOString(),
      rows: [],
      missingMonitorKeys: LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey),
      ok: false,
    };
  }

  const [latestRuns, latestSuccessfulRuns] = await Promise.all([
    execute(sql`
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
  `),
    execute(sql`
    SELECT monitor_key, MAX(checked_at) AS last_successful_checked_at
    FROM synthetic_monitor_runs
    WHERE status = 'pass'
    GROUP BY monitor_key
  `),
  ]);

  const lastSuccessfulByMonitorKey = new Map(
    (latestSuccessfulRuns == null
      ? []
      : getRows<Record<string, unknown>>(latestSuccessfulRuns as any)
    ).map((row) => [
      String(row.monitor_key),
      row.last_successful_checked_at
        ? new Date(String(row.last_successful_checked_at)).toISOString()
        : row.checked_at
          ? new Date(String(row.checked_at)).toISOString()
          : null,
    ])
  );

  const rows = (latestRuns == null ? [] : getRows<Record<string, unknown>>(latestRuns as any))
    .filter((row) => activeMonitorKeys.has(String(row.monitor_key)))
    .map<LaunchSyntheticStatusRow>((row) => {
      const definition = getLaunchMonitorDefinition(String(row.monitor_key));
      const checkedAt = row.checked_at ? new Date(String(row.checked_at)) : null;
      const ageMinutes = checkedAt
        ? Math.max(0, Math.round((now.getTime() - checkedAt.getTime()) / 60_000))
        : null;
      const stale =
        definition != null ? ageMinutes != null && ageMinutes > definition.maxAgeMinutes : true;
      const freshnessState: LaunchSmokeFreshnessState = stale ? 'stale' : 'fresh';
      const status = stale ? 'degraded' : (String(row.status) as LaunchMonitorStatus);

      return {
        monitorKey: String(row.monitor_key),
        monitorGroup: String(row.monitor_group),
        status,
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
        freshnessState,
        blocking: freshnessState === 'fresh' && status !== 'pass',
        stale,
        lastSuccessfulCheckedAt: lastSuccessfulByMonitorKey.get(String(row.monitor_key)) ?? null,
        evidenceSource: 'persisted',
        refreshState: definition?.kind === 'http' ? 'not_attempted' : 'not_applicable',
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
    ok:
      missingMonitorKeys.length === 0 &&
      rows.every((row) => row.status === 'pass' && row.freshnessState === 'fresh'),
  };
}
