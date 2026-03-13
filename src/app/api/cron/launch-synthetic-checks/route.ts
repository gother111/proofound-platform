import { NextRequest, NextResponse } from 'next/server';

import { getCronAuthStatus } from '@/lib/api/cron-auth';
import { log } from '@/lib/log';
import { runLaunchSyntheticMonitors } from '@/lib/launch/synthetic-monitors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  const authStatus = getCronAuthStatus(request);

  if (authStatus === 'misconfigured') {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Cron misconfigured' }, { status: 500 }),
    };
  }

  if (authStatus === 'unauthorized') {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true as const };
}

export async function GET(request: NextRequest) {
  const auth = isAuthorized(request);
  if (!auth.ok) {
    return auth.response;
  }

  const baseUrl =
    process.env.LAUNCH_MONITOR_BASE_URL ||
    request.nextUrl.origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  const artifactPath =
    process.env.LAUNCH_SMOKE_ARTIFACT_PATH || '.artifacts/launch-smoke-report.json';

  try {
    const result = await runLaunchSyntheticMonitors({
      baseUrl,
      artifactPath,
      persist: true,
    });

    log.info('cron.launch_synthetic_checks.completed', {
      baseUrl,
      artifactPath,
      ok: result.ok,
      pass: result.summary.pass,
      degraded: result.summary.degraded,
      fail: result.summary.fail,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 503 });
  } catch (error) {
    log.error('cron.launch_synthetic_checks.failed', {
      baseUrl,
      artifactPath,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        ok: false,
        error: 'Launch synthetic checks failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
