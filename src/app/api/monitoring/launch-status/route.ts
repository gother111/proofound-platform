import { NextResponse } from 'next/server';

import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { buildLaunchStatusReport } from '@/lib/launch/status-report';
import {
  getHttpMonitorKeysNeedingRefresh,
  getLaunchSyntheticStatusWithFreshHttpRevalidation,
  getPersistedLaunchSyntheticStatus,
} from '@/lib/launch/synthetic-monitors';
import type {
  LaunchLiveRefreshSummary,
  LaunchSyntheticStatusSnapshot,
} from '@/lib/launch/synthetic-monitors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const unauthorized = requireInternalOpsRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  const artifactPath =
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';

  try {
    const persisted = await getPersistedLaunchSyntheticStatus({
      artifactPath,
    });
    const refreshMonitorKeys = getHttpMonitorKeysNeedingRefresh(persisted);
    let latest: LaunchSyntheticStatusSnapshot = persisted;
    let liveRefreshOverride: Partial<LaunchLiveRefreshSummary> | undefined;

    if (refreshMonitorKeys.length > 0) {
      try {
        latest = await getLaunchSyntheticStatusWithFreshHttpRevalidation({
          baseUrl: new URL(request.url).origin,
          artifactPath,
          persistedStatus: persisted,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown live refresh error';
        console.error('Live launch-status refresh failed; returning persisted status', error);
        liveRefreshOverride = {
          attempted: true,
          refreshedMonitorKeys: refreshMonitorKeys,
          recoveredMonitorKeys: [],
          failedMonitorKeys: refreshMonitorKeys,
          finalHttpEvidenceSource: 'persisted',
          error: message,
        };
      }
    }

    const report = buildLaunchStatusReport(latest, {
      liveRefresh: liveRefreshOverride,
    });

    return NextResponse.json(report, {
      status: report.readinessState === 'blocked' ? 503 : 200,
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
