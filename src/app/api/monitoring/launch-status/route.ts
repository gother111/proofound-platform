import { NextResponse } from 'next/server';

import { LAUNCH_MONITOR_DEFINITIONS } from '@/lib/launch/contracts';
import { getPersistedLaunchSyntheticStatus } from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

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

export async function GET(_request: Request) {
  const artifactPath =
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';

  try {
    const latest = await getPersistedLaunchSyntheticStatus({
      artifactPath,
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
