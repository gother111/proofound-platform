import {
  LAUNCH_MONITOR_DEFINITIONS,
  type LaunchNotReadyReason,
  type LaunchReadinessState,
} from '@/lib/launch/contracts';
import type {
  LaunchLiveRefreshSummary,
  LaunchSyntheticStatusRow,
  LaunchSyntheticStatusSnapshot,
} from '@/lib/launch/synthetic-monitors';

const HTTP_MONITOR_KEYS = new Set(
  LAUNCH_MONITOR_DEFINITIONS.filter((definition) => definition.kind === 'http').map(
    (definition) => definition.monitorKey
  )
);

type LaunchStatusSummary = {
  expectedMonitors: number;
  reportedMonitors: number;
  missingMonitors: number;
  p1Failures: number;
  p2Failures: number;
  staleMonitors: number;
  missingEvidenceMonitors: number;
  blockedMonitors: number;
};

type LaunchStatusFreshness = {
  evaluatedAt: string;
  smokeArtifactGeneratedAt: string | null;
  smokeArtifactAgeMinutes: number | null;
  smokeFreshnessThresholdMinutes: number;
  smokeFreshnessState: LaunchSyntheticStatusSnapshot['evidence']['smokeFreshnessState'];
};

export type LaunchStatusReport = {
  ok: boolean;
  readinessState: LaunchReadinessState;
  generatedAt: string;
  source: LaunchSyntheticStatusSnapshot['source'];
  evidence: LaunchSyntheticStatusSnapshot['evidence'];
  freshness: LaunchStatusFreshness;
  liveRefresh: LaunchLiveRefreshSummary;
  summary: LaunchStatusSummary;
  missingMonitorKeys: string[];
  notReadyReasons: LaunchNotReadyReason[];
  lastSuccessfulRuns: {
    byMonitorKey: Record<string, string | null>;
  };
  monitors: LaunchSyntheticStatusRow[];
};

function buildSummary(
  rows: LaunchSyntheticStatusRow[],
  missingMonitorKeys: string[]
): LaunchStatusSummary {
  const staleRows = rows.filter((row) => row.freshnessState === 'stale');
  const missingEvidenceRows = rows.filter((row) => row.freshnessState === 'missing');
  const blockingRows = rows.filter((row) => row.blocking === true);

  return {
    expectedMonitors: LAUNCH_MONITOR_DEFINITIONS.length,
    reportedMonitors: rows.length,
    missingMonitors: missingMonitorKeys.length,
    p1Failures: blockingRows.filter((row) => row.severity === 'p1').length,
    p2Failures: blockingRows.filter((row) => row.severity === 'p2').length,
    staleMonitors: staleRows.length,
    missingEvidenceMonitors: missingEvidenceRows.length,
    blockedMonitors: blockingRows.length + missingMonitorKeys.length,
  };
}

function buildReasonFromRows(
  rows: LaunchSyntheticStatusRow[],
  reason: Pick<
    LaunchNotReadyReason,
    'code' | 'message' | 'source' | 'freshnessState' | 'liveRefreshAttempted'
  >
): LaunchNotReadyReason | null {
  if (rows.length === 0) {
    return null;
  }

  return {
    ...reason,
    monitorKeys: rows.map((row) => row.monitorKey),
    checkedAt: rows.map((row) => row.checkedAt),
    lastSuccessfulCheckedAt: rows.map((row) => row.lastSuccessfulCheckedAt),
  };
}

function buildMissingReason(
  monitorKeys: string[],
  reason: Pick<
    LaunchNotReadyReason,
    'code' | 'message' | 'source' | 'freshnessState' | 'liveRefreshAttempted'
  >
): LaunchNotReadyReason | null {
  if (monitorKeys.length === 0) {
    return null;
  }

  return {
    ...reason,
    monitorKeys,
    checkedAt: monitorKeys.map(() => null),
    lastSuccessfulCheckedAt: monitorKeys.map(() => null),
  };
}

export function buildLaunchBlockingReasons(
  rows: LaunchSyntheticStatusRow[],
  missingMonitorKeys: string[],
  liveRefresh: LaunchLiveRefreshSummary
) {
  const liveFailingHttpRows = rows.filter(
    (row) =>
      HTTP_MONITOR_KEYS.has(row.monitorKey) &&
      row.freshnessState === 'fresh' &&
      row.status !== 'pass' &&
      row.blocking === true
  );
  const stalePersistedHttpRows = rows.filter(
    (row) => HTTP_MONITOR_KEYS.has(row.monitorKey) && row.freshnessState === 'stale'
  );
  const staleSmokeRows = rows.filter(
    (row) => !HTTP_MONITOR_KEYS.has(row.monitorKey) && row.freshnessState === 'stale'
  );
  const missingSmokeRows = rows.filter(
    (row) => !HTTP_MONITOR_KEYS.has(row.monitorKey) && row.freshnessState === 'missing'
  );
  const failingSmokeRows = rows.filter(
    (row) =>
      !HTTP_MONITOR_KEYS.has(row.monitorKey) &&
      row.freshnessState === 'fresh' &&
      row.status !== 'pass' &&
      row.blocking === true
  );
  const missingPersistedHttpMonitorKeys = missingMonitorKeys.filter((monitorKey) =>
    HTTP_MONITOR_KEYS.has(monitorKey)
  );

  return [
    buildReasonFromRows(liveFailingHttpRows, {
      code: 'live_endpoint_failure',
      message:
        'Launch readiness is blocked by a failing launch-critical endpoint. Fix the live endpoint failure before launch.',
      source: liveRefresh.attempted ? 'live_http' : 'persisted_http',
      freshnessState: 'fresh',
      liveRefreshAttempted: liveRefresh.attempted,
    }),
    buildReasonFromRows(stalePersistedHttpRows, {
      code: 'stale_persisted_monitor_evidence',
      message:
        'Launch readiness is blocked because persisted endpoint evidence is stale and cannot be trusted until a fresh live check succeeds.',
      source: 'persisted_http',
      freshnessState: 'stale',
      liveRefreshAttempted: liveRefresh.attempted,
    }),
    buildMissingReason(missingPersistedHttpMonitorKeys, {
      code: 'missing_persisted_monitor_evidence',
      message:
        'Launch readiness is blocked because required persisted endpoint evidence is missing and a fresh live check did not establish readiness.',
      source: 'persisted_http',
      freshnessState: 'missing',
      liveRefreshAttempted: liveRefresh.attempted,
    }),
    buildReasonFromRows(staleSmokeRows, {
      code: 'stale_smoke_artifact',
      message:
        'Launch readiness is blocked because the launch smoke artifact is stale. Generate fresh smoke evidence before launch.',
      source: 'smoke_artifact',
      freshnessState: 'stale',
      liveRefreshAttempted: liveRefresh.attempted,
    }),
    buildReasonFromRows(missingSmokeRows, {
      code: 'missing_smoke_artifact',
      message:
        'Launch readiness is blocked because required launch smoke evidence is missing. Generate the smoke artifact before launch.',
      source: 'smoke_artifact',
      freshnessState: 'missing',
      liveRefreshAttempted: liveRefresh.attempted,
    }),
    buildReasonFromRows(failingSmokeRows, {
      code: 'smoke_corridor_failure',
      message:
        'Launch readiness is blocked by a failing launch smoke corridor. Fix the corridor failure and regenerate launch smoke evidence.',
      source: 'smoke_artifact',
      freshnessState: 'fresh',
      liveRefreshAttempted: liveRefresh.attempted,
    }),
  ].filter((reason): reason is LaunchNotReadyReason => reason !== null);
}

export function buildLaunchStatusReport(
  status: LaunchSyntheticStatusSnapshot,
  overrides: {
    liveRefresh?: Partial<LaunchLiveRefreshSummary>;
  } = {}
): LaunchStatusReport {
  const liveRefresh = {
    ...status.liveRefresh,
    ...overrides.liveRefresh,
  };
  const notReadyReasons = buildLaunchBlockingReasons(
    status.rows,
    status.missingMonitorKeys,
    liveRefresh
  );
  const lastSuccessfulRuns = Object.fromEntries(
    status.rows.map((row) => [row.monitorKey, row.lastSuccessfulCheckedAt] as const)
  );

  return {
    ok: status.readinessState === 'ready',
    readinessState: status.readinessState,
    generatedAt: status.generatedAt,
    source: status.source,
    evidence: status.evidence,
    freshness: {
      evaluatedAt: status.generatedAt,
      smokeArtifactGeneratedAt: status.evidence.smokeArtifactGeneratedAt,
      smokeArtifactAgeMinutes: status.evidence.smokeArtifactAgeMinutes,
      smokeFreshnessThresholdMinutes: status.evidence.smokeFreshnessThresholdMinutes,
      smokeFreshnessState: status.evidence.smokeFreshnessState,
    },
    liveRefresh,
    summary: buildSummary(status.rows, status.missingMonitorKeys),
    missingMonitorKeys: status.missingMonitorKeys,
    notReadyReasons,
    lastSuccessfulRuns: {
      byMonitorKey: lastSuccessfulRuns,
    },
    monitors: status.rows,
  };
}

export function formatLaunchBlockingReasons(reasons: LaunchNotReadyReason[]) {
  if (reasons.length === 0) {
    return 'No explicit blocking reasons were returned.';
  }

  return reasons
    .map((reason) =>
      [
        reason.code,
        reason.message,
        `source=${reason.source}`,
        `freshness=${reason.freshnessState}`,
        `liveRefreshAttempted=${String(reason.liveRefreshAttempted)}`,
        reason.monitorKeys.length > 0 ? `monitors=${reason.monitorKeys.join(',')}` : '',
      ]
        .filter(Boolean)
        .join(' | ')
    )
    .join('; ');
}
