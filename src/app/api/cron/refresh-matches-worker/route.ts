import { NextRequest, NextResponse } from 'next/server';

import { getInternalApiSecret, requireInternalApiRequest } from '@/lib/api/auth';
import { log } from '@/lib/log';
import {
  claimJobs,
  countPendingRefreshJobs,
  isMatchingRefreshQueueEnabled,
  markJobFailure,
  markJobSuccess,
  resolveMatchingRefreshWorkerBatchSize,
  resolveMatchingRefreshWorkerConcurrency,
} from '@/lib/matching/refresh-queue';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function runWithConcurrency<T>(
  values: T[],
  concurrency: number,
  worker: (value: T) => Promise<void>
): Promise<void> {
  if (!values.length) {
    return;
  }

  const safeConcurrency = Math.max(1, concurrency);
  let index = 0;

  const runners = Array.from({ length: Math.min(safeConcurrency, values.length) }, async () => {
    while (index < values.length) {
      const current = values[index];
      index += 1;
      await worker(current);
    }
  });

  await Promise.all(runners);
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  const unauthorized = requireInternalApiRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  if (!isMatchingRefreshQueueEnabled()) {
    return NextResponse.json({ success: true, skipped: 'queue_disabled' });
  }

  const internalSecret = getInternalApiSecret();
  if (!internalSecret) {
    return NextResponse.json(
      { error: 'Missing INTERNAL_API_SECRET/CRON_SECRET configuration' },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!baseUrl) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_SITE_URL is not configured' }, { status: 500 });
  }

  try {
    const batchSize = resolveMatchingRefreshWorkerBatchSize();
    const concurrency = resolveMatchingRefreshWorkerConcurrency();
    const claimedJobs = await claimJobs(batchSize);

    if (claimedJobs.length === 0) {
      const pending = await countPendingRefreshJobs();
      return NextResponse.json({
        success: true,
        claimed: 0,
        processed: 0,
        successCount: 0,
        errorCount: 0,
        pending,
        durationMs: Date.now() - startTime,
      });
    }

    let successCount = 0;
    let errorCount = 0;

    await runWithConcurrency(claimedJobs, concurrency, async (job) => {
      try {
        const response = await fetch(`${baseUrl}/api/match/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-api-key': internalSecret,
          },
          body: JSON.stringify({
            userId: job.profileId,
            k: 20,
          }),
        });

        if (response.ok) {
          await markJobSuccess(job.id);
          successCount += 1;
          return;
        }

        const body = await response.text();
        const errorMessage = `status=${response.status}; body=${body.slice(0, 1000)}`;
        await markJobFailure(job.id, errorMessage);
        errorCount += 1;
      } catch (error) {
        await markJobFailure(
          job.id,
          error instanceof Error ? error.message : 'Unknown worker error'
        );
        errorCount += 1;
      }
    });

    const pending = await countPendingRefreshJobs();
    const duration = Date.now() - startTime;

    log.info('cron.refresh-matches-worker.completed', {
      claimed: claimedJobs.length,
      successCount,
      errorCount,
      pending,
      batchSize,
      concurrency,
      durationMs: duration,
    });

    return NextResponse.json({
      success: true,
      claimed: claimedJobs.length,
      processed: claimedJobs.length,
      successCount,
      errorCount,
      pending,
      batchSize,
      concurrency,
      durationMs: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error('cron.refresh-matches-worker.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
    });

    return NextResponse.json(
      {
        error: 'Refresh queue worker failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
