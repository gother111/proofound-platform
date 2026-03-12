import { NextResponse } from 'next/server';

import { LAUNCH_MONITOR_DEFINITIONS } from '@/lib/launch/contracts';
import {
  getCurrentLaunchSyntheticStatus,
  getLatestLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

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

    return NextResponse.json({
      ok: latest.ok,
      generatedAt: latest.generatedAt,
      source: latest.source,
      evidence: latest.evidence,
      summary: {
        expectedMonitors: LAUNCH_MONITOR_DEFINITIONS.length,
        reportedMonitors: latest.rows.length,
        missingMonitors: latest.missingMonitorKeys.length,
        p1Failures: latest.rows.filter((row) => row.severity === 'p1' && row.status === 'fail')
          .length,
        p2Failures: latest.rows.filter((row) => row.severity === 'p2' && row.status === 'fail')
          .length,
      },
      missingMonitorKeys: latest.missingMonitorKeys,
      monitors: latest.rows,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') {
      const latest = await getLatestLaunchSyntheticStatus();

      return NextResponse.json({
        ok: latest.ok,
        generatedAt: latest.generatedAt,
        source: 'persisted',
        evidence: {
          source: 'persisted',
          artifactPath,
          smokeArtifactGeneratedAt: null,
          persisted: true,
        },
        summary: {
          expectedMonitors: LAUNCH_MONITOR_DEFINITIONS.length,
          reportedMonitors: latest.rows.length,
          missingMonitors: latest.missingMonitorKeys.length,
          p1Failures: latest.rows.filter((row) => row.severity === 'p1' && row.status === 'fail')
            .length,
          p2Failures: latest.rows.filter((row) => row.severity === 'p2' && row.status === 'fail')
            .length,
        },
        missingMonitorKeys: latest.missingMonitorKeys,
        monitors: latest.rows,
      });
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
