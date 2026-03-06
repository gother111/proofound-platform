import { NextRequest } from 'next/server';

import { createRequestId, jsonWithRequestId } from '@/lib/expertise/cv-import-runtime';
import {
  CV_IMPORT_EXTRACT_JOB_TYPE,
  CV_IMPORT_EXTRACT_POLL_AFTER_MS,
  CvImportExtractJobPayloadSchema,
  CvImportExtractJobResultSchema,
} from '@/lib/expertise/cv-import-wizard-extract';
import { getPythonInternalJob } from '@/lib/python-internal/job-queue';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const requestId = createRequestId(request);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonWithRequestId(requestId, { error: 'Unauthorized' }, 401);
  }

  const jobId = request.nextUrl.searchParams.get('job_id')?.trim();
  if (!jobId) {
    return jsonWithRequestId(requestId, { error: 'job_id is required' }, 400);
  }

  const job = await getPythonInternalJob(jobId);
  if (!job || job.jobType !== CV_IMPORT_EXTRACT_JOB_TYPE) {
    return jsonWithRequestId(requestId, { error: 'Extraction job not found' }, 404);
  }

  const payload = CvImportExtractJobPayloadSchema.safeParse(job.payload);
  if (!payload.success || payload.data.user_id !== user.id) {
    return jsonWithRequestId(requestId, { error: 'Extraction job not found' }, 404);
  }

  if (job.status === 'pending') {
    return jsonWithRequestId(requestId, {
      job_id: job.id,
      status: 'queued',
      poll_after_ms: CV_IMPORT_EXTRACT_POLL_AFTER_MS,
    });
  }

  if (job.status === 'leased') {
    return jsonWithRequestId(requestId, {
      job_id: job.id,
      status: 'processing',
      poll_after_ms: CV_IMPORT_EXTRACT_POLL_AFTER_MS,
    });
  }

  if (job.status === 'completed') {
    const result = CvImportExtractJobResultSchema.safeParse(job.result);
    if (!result.success) {
      return jsonWithRequestId(
        requestId,
        {
          job_id: job.id,
          status: 'failed',
          error: 'CV extraction completed with an invalid result payload.',
          message: 'CV extraction completed with an invalid result payload.',
          code: 'CV_IMPORT_EXTRACT_INVALID_RESULT',
        },
        500
      );
    }

    return jsonWithRequestId(requestId, {
      job_id: job.id,
      status: 'completed',
      documents: result.data.documents,
      failed_documents: result.data.failed_documents,
      cleanup_pending: result.data.cleanup_pending,
    });
  }

  const failureResult = job.result && typeof job.result === 'object' ? job.result : {};
  const failureRecord = failureResult as Record<string, unknown>;
  const failureMessage =
    typeof failureRecord.message === 'string' && failureRecord.message.trim().length > 0
      ? failureRecord.message.trim()
      : job.lastError || 'CV extraction failed.';
  const failureCode =
    typeof failureRecord.code === 'string' && failureRecord.code.trim().length > 0
      ? failureRecord.code.trim()
      : undefined;

  return jsonWithRequestId(requestId, {
    job_id: job.id,
    status: 'failed',
    error: failureMessage,
    message: failureMessage,
    ...(failureCode ? { code: failureCode } : {}),
  });
}
