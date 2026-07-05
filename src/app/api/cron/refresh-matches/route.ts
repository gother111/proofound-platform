import { NextRequest, NextResponse } from 'next/server';

import { safeApiErrorResponse } from '@/lib/api/errors';
import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { MATCHING_ENABLED } from '@/lib/featureFlags';
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
    const unauthorized = requireInternalOpsRequest(request);
    if (unauthorized) {
      log.error('cron.refresh-matches.unauthorized');
      return unauthorized;
    }

    if (!MATCHING_ENABLED) {
      const duration = Date.now() - startTime;
      log.info('cron.refresh-matches.matching-disabled', { durationMs: duration });
      return NextResponse.json({
        success: true,
        skipped: 'matching_disabled',
        durationMs: duration,
      });
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

    return safeApiErrorResponse({
      event: 'cron.refresh-matches.failed',
      error,
      status: 500,
      publicMessage: 'Refresh queue enqueue failed',
      context: {
        durationMs: duration,
      },
    });
  }
}
