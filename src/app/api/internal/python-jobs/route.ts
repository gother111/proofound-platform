import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { requireInternalApiRequest } from '@/lib/api/auth';
import { log } from '@/lib/log';
import { EnqueuePythonInternalJobsRequestSchema } from '@/lib/python-internal/contracts';
import {
  countPendingPythonInternalJobs,
  enqueuePythonInternalJobs,
  isPythonInternalJobsEnabled,
} from '@/lib/python-internal/job-queue';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const unauthorized = requireInternalApiRequest(request);
  if (unauthorized) {
    return unauthorized;
  }

  if (!isPythonInternalJobsEnabled()) {
    return NextResponse.json({
      success: true,
      skipped: 'python_internal_jobs_disabled',
      enqueued: [],
      pending: 0,
    });
  }

  try {
    const payload = EnqueuePythonInternalJobsRequestSchema.parse(await request.json());
    const enqueued = await enqueuePythonInternalJobs(
      payload.jobs.map((job) => ({
        jobType: job.job_type,
        payload: job.payload as Record<string, unknown>,
        maxAttempts: job.max_attempts,
        source: (job.source ?? 'manual') as 'manual' | 'cron' | 'admin' | 'retry',
      }))
    );
    const pending = await countPendingPythonInternalJobs();

    log.info('internal.python_jobs.enqueued', {
      count: enqueued.length,
      pending,
      jobTypes: enqueued.map((job) => job.jobType),
    });

    return NextResponse.json({
      success: true,
      enqueued,
      pending,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    log.error('internal.python_jobs.enqueue_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to enqueue Python internal jobs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
