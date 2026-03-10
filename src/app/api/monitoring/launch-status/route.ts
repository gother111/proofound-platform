import { NextResponse } from 'next/server';

import { LAUNCH_MONITOR_DEFINITIONS } from '@/lib/launch/contracts';
import { getLatestLaunchSyntheticStatus } from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const latest = await getLatestLaunchSyntheticStatus();

    return NextResponse.json({
      ok: latest.ok,
      generatedAt: latest.generatedAt,
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
