import { NextResponse } from 'next/server';

import { LAUNCH_MONITOR_DEFINITIONS, type LaunchNotReadyReason } from '@/lib/launch/contracts';
import {
  getLaunchSyntheticStatusWithFreshHttpRevalidation,
  getPersistedLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

function buildSummary(
  rows: Array<{
    severity: string;
    status: string;
    freshnessState?: 'fresh' | 'stale' | 'missing';
    blocking?: boolean;
  }>,
  missingMonitorKeys: string[]
) {
  const blockingRows = rows.filter((row) => row.blocking === true);
  const staleRows = rows.filter((row) => row.freshnessState === 'stale');
  const missingEvidenceRows = rows.filter((row) => row.freshnessState === 'missing');

  return {
    expectedMonitors: LAUNCH_MONITOR_DEFINITIONS.length,
    reportedMonitors: rows.length,
    missingMonitors: missingMonitorKeys.length,
    p1Failures: blockingRows.filter((row) => row.severity === 'p1').length,
    p2Failures: blockingRows.filter((row) => row.severity === 'p2').length,
    staleMonitors: staleRows.length,
    missingEvidenceMonitors: missingEvidenceRows.length,
    unverifiedMonitors: staleRows.length + missingEvidenceRows.length,
  };
}

const HTTP_MONITOR_KEYS = new Set(
  LAUNCH_MONITOR_DEFINITIONS.filter((definition) => definition.kind === 'http').map(
    (definition) => definition.monitorKey
  )
);

function buildNotReadyReasons(
  rows: Array<{
    monitorKey: string;
    monitorGroup: string;
    status: string;
    freshnessState?: 'fresh' | 'stale' | 'missing';
    blocking?: boolean;
  }>,
  missingMonitorKeys: string[]
): LaunchNotReadyReason[] {
  const freshFailingHttpMonitorKeys = rows
    .filter(
      (row) =>
        HTTP_MONITOR_KEYS.has(row.monitorKey) &&
        row.freshnessState === 'fresh' &&
        row.status !== 'pass' &&
        row.blocking === true
    )
    .map((row) => row.monitorKey);
  const freshFailingSmokeMonitorKeys = rows
    .filter(
      (row) =>
        !HTTP_MONITOR_KEYS.has(row.monitorKey) &&
        row.freshnessState === 'fresh' &&
        row.status !== 'pass' &&
        row.blocking === true
    )
    .map((row) => row.monitorKey);
  const staleHttpMonitorKeys = rows
    .filter((row) => HTTP_MONITOR_KEYS.has(row.monitorKey) && row.freshnessState === 'stale')
    .map((row) => row.monitorKey);
  const missingHttpMonitorKeys = missingMonitorKeys.filter((monitorKey) =>
    HTTP_MONITOR_KEYS.has(monitorKey)
  );
  const staleSmokeMonitorKeys = rows
    .filter((row) => !HTTP_MONITOR_KEYS.has(row.monitorKey) && row.freshnessState === 'stale')
    .map((row) => row.monitorKey);
  const missingSmokeMonitorKeys = rows
    .filter((row) => !HTTP_MONITOR_KEYS.has(row.monitorKey) && row.freshnessState === 'missing')
    .map((row) => row.monitorKey);

  const reasons: LaunchNotReadyReason[] = [];

  if (freshFailingHttpMonitorKeys.length > 0) {
    reasons.push({
      code: 'fresh_failing_http_monitor',
      message: 'Fresh failing HTTP monitor evidence is blocking launch readiness.',
      monitorKeys: freshFailingHttpMonitorKeys,
    });
  }

  if (freshFailingSmokeMonitorKeys.length > 0) {
    reasons.push({
      code: 'fresh_failing_smoke_monitor',
      message: 'A fresh failing launch corridor is blocking launch readiness.',
      monitorKeys: freshFailingSmokeMonitorKeys,
    });
  }

  if (staleHttpMonitorKeys.length > 0) {
    reasons.push({
      code: 'stale_http_evidence',
      message: 'Persisted HTTP monitor evidence is stale and needs live refresh.',
      monitorKeys: staleHttpMonitorKeys,
    });
  }

  if (missingHttpMonitorKeys.length > 0) {
    reasons.push({
      code: 'missing_http_evidence',
      message: 'Persisted HTTP monitor evidence is missing and launch readiness is unverified.',
      monitorKeys: missingHttpMonitorKeys,
    });
  }

  if (staleSmokeMonitorKeys.length > 0) {
    reasons.push({
      code: 'stale_smoke_artifact',
      message: 'Launch smoke evidence is stale and must be refreshed before launch is ready.',
      monitorKeys: staleSmokeMonitorKeys,
    });
  }

  if (missingSmokeMonitorKeys.length > 0) {
    reasons.push({
      code: 'missing_smoke_artifact',
      message: 'Launch smoke evidence is missing and launch readiness is unverified.',
      monitorKeys: missingSmokeMonitorKeys,
    });
  }

  return reasons;
}

function shouldRefreshLive(status: Awaited<ReturnType<typeof getPersistedLaunchSyntheticStatus>>) {
  if (
    status.rows.some(
      (row) =>
        HTTP_MONITOR_KEYS.has(row.monitorKey) &&
        (row.failureClass === 'stale_monitor_result' ||
          row.freshnessState !== 'fresh' ||
          row.stale ||
          row.observedState === 'stale')
    )
  ) {
    return true;
  }

  return status.missingMonitorKeys.some((monitorKey) => HTTP_MONITOR_KEYS.has(monitorKey));
}

export async function GET(request: Request) {
  const artifactPath =
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';

  try {
    const persisted = await getPersistedLaunchSyntheticStatus({
      artifactPath,
    });
    let latest: Awaited<
      ReturnType<
        | typeof getPersistedLaunchSyntheticStatus
        | typeof getLaunchSyntheticStatusWithFreshHttpRevalidation
      >
    > = persisted;

    if (shouldRefreshLive(persisted)) {
      try {
        latest = await getLaunchSyntheticStatusWithFreshHttpRevalidation({
          baseUrl: new URL(request.url).origin,
          artifactPath,
          persistedStatus: persisted,
        });
      } catch (error) {
        console.error('Live launch-status refresh failed; returning persisted status', error);
      }
    }

    const summary = buildSummary(latest.rows, latest.missingMonitorKeys);
    const notReadyReasons = buildNotReadyReasons(latest.rows, latest.missingMonitorKeys);

    return NextResponse.json(
      {
        ok: latest.ok,
        readinessState: latest.readinessState,
        generatedAt: latest.generatedAt,
        source: latest.source,
        evidence: latest.evidence,
        summary,
        missingMonitorKeys: latest.missingMonitorKeys,
        notReadyReasons,
        monitors: latest.rows,
      },
      { status: latest.readinessState === 'blocked' ? 503 : 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to load launch status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
