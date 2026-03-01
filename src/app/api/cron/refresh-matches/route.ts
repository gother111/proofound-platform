import { NextRequest, NextResponse } from 'next/server';

import { log } from '@/lib/log';
import {
  countPendingRefreshJobs,
  enqueueProfiles,
  isMatchingRefreshQueueEnabled,
  listProfilesForRefresh,
} from '@/lib/matching/refresh-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron job to enqueue match refresh work for active matching profiles.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      log.error('cron.refresh-matches.unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isMatchingRefreshQueueEnabled()) {
      const duration = Date.now() - startTime;
      log.info('cron.refresh-matches.queue-disabled', { durationMs: duration });
      return NextResponse.json({
        success: true,
        skipped: 'queue_disabled',
        durationMs: duration,
      });
    }

    const profileLimit = 100;
    const profileIds = await listProfilesForRefresh(profileLimit);

    if (profileIds.length === 0) {
      const duration = Date.now() - startTime;
      return NextResponse.json({
        success: true,
        message: 'No profiles found for refresh queue.',
        attempted: 0,
        enqueued: 0,
        pending: 0,
        durationMs: duration,
      });
    }

    const enqueueResult = await enqueueProfiles(profileIds, 'cron');
    const pending = await countPendingRefreshJobs();
    const duration = Date.now() - startTime;

    log.info('cron.refresh-matches.enqueued', {
      attemptedProfiles: enqueueResult.attempted,
      enqueuedJobs: enqueueResult.enqueued,
      pendingJobs: pending,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      attempted: enqueueResult.attempted,
      enqueued: enqueueResult.enqueued,
      pending,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    log.error('cron.refresh-matches.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
    });

    return NextResponse.json(
      {
        error: 'Refresh queue enqueue failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
