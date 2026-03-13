import { NextResponse } from 'next/server';

import {
  LAUNCH_MONITOR_DEFINITIONS,
  LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
} from '@/lib/launch/contracts';
import {
  getCurrentLaunchSyntheticStatus,
  getLatestLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

type PersistedMonitorRow = Awaited<
  ReturnType<typeof getLatestLaunchSyntheticStatus>
>['rows'][number];

function buildSummary(
  rows: Array<{ severity: string; status: string }>,
  missingMonitorKeys: string[]
) {
  return {
    expectedMonitors: LAUNCH_MONITOR_DEFINITIONS.length,
    reportedMonitors: rows.length,
    missingMonitors: missingMonitorKeys.length,
    p1Failures: rows.filter((row) => row.severity === 'p1' && row.status === 'fail').length,
    p2Failures: rows.filter((row) => row.severity === 'p2' && row.status === 'fail').length,
  };
}

function buildMissingSmokeRows(
  rows: PersistedMonitorRow[],
  artifactPath: string
): PersistedMonitorRow[] {
  const rowMap = new Map<string, PersistedMonitorRow>(
    rows.map((row) => [row.monitorKey, row] as const)
  );
  const nowIso = new Date().toISOString();

  return LAUNCH_MONITOR_DEFINITIONS.reduce<PersistedMonitorRow[]>((acc, definition) => {
    const existing = rowMap.get(definition.monitorKey);

    if (definition.kind === 'smoke_artifact') {
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
    }

    if (existing) {
      acc.push(existing);
    }

    return acc;
  }, []);
}

export async function GET(request: Request) {
  const artifactPath =
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';

  try {
    const requestOrigin = new URL(request.url).origin;
    const baseUrl =
      process.env.LAUNCH_MONITOR_BASE_URL ||
      requestOrigin ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';
    const latest = await getCurrentLaunchSyntheticStatus({
      baseUrl,
      artifactPath,
      persist: false,
    });
    const summary = buildSummary(latest.rows, latest.missingMonitorKeys);

    return NextResponse.json(
      {
        ok: latest.ok,
        readinessState: latest.readinessState,
        generatedAt: latest.generatedAt,
        source: latest.source,
        evidence: latest.evidence,
        summary,
        missingMonitorKeys: latest.missingMonitorKeys,
        monitors: latest.rows,
      },
      { status: latest.readinessState === 'ready' ? 200 : 503 }
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      const latest = await getLatestLaunchSyntheticStatus();
      const monitors = buildMissingSmokeRows(latest.rows, artifactPath);
      const missingMonitorKeys = LAUNCH_MONITOR_DEFINITIONS.map((item) => item.monitorKey).filter(
        (monitorKey) => !monitors.some((row) => row.monitorKey === monitorKey)
      );

      return NextResponse.json(
        {
          ok: false,
          readinessState: 'blocked',
          generatedAt: latest.generatedAt,
          source: 'persisted',
          evidence: {
            source: 'persisted',
            artifactPath,
            smokeArtifactGeneratedAt: null,
            smokeArtifactAgeMinutes: null,
            smokeFreshnessThresholdMinutes: LAUNCH_SMOKE_FRESHNESS_THRESHOLD_MINUTES,
            smokeFreshnessState: 'missing',
            persisted: true,
          },
          summary: buildSummary(monitors, missingMonitorKeys),
          missingMonitorKeys,
          monitors,
        },
        { status: 503 }
      );
    }

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
