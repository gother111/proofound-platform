import { NextRequest, NextResponse } from 'next/server';

import { requireInternalApiRequest } from '@/lib/api/auth';
import { log } from '@/lib/log';
import {
  claimPythonInternalJobs,
  countPendingPythonInternalJobs,
  isPythonInternalJobsEnabled,
  resolvePythonInternalWorkerBatchSize,
  resolvePythonInternalWorkerConcurrency,
} from '@/lib/python-internal/job-queue';
import { executeClaimedPythonInternalJob } from '@/lib/python-internal/worker';

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

  if (!isPythonInternalJobsEnabled()) {
    return NextResponse.json({ success: true, skipped: 'python_internal_jobs_disabled' });
  }

  try {
    const batchSize = resolvePythonInternalWorkerBatchSize();
    const concurrency = resolvePythonInternalWorkerConcurrency();
    const claimedJobs = await claimPythonInternalJobs(batchSize);

    if (claimedJobs.length === 0) {
      const pending = await countPendingPythonInternalJobs();
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
      const outcome = await executeClaimedPythonInternalJob({
        request,
        job,
      });

      if (outcome.status === 'completed') {
        successCount += 1;
      } else {
        errorCount += 1;
      }
    });

    const pending = await countPendingPythonInternalJobs();
    const duration = Date.now() - startTime;

    log.info('cron.python_internal_worker.completed', {
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

    log.error('cron.python_internal_worker.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      durationMs: duration,
    });

    return NextResponse.json(
      {
        error: 'Python internal worker failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
