import type { NextRequest } from 'next/server';

import { processCvImportExtractJob } from '@/lib/expertise/cv-import-extract-worker';
import { executePythonInternalJob } from '@/lib/python-internal/client';
import {
  markPythonInternalJobFailure,
  markPythonInternalJobSuccess,
  type ClaimedPythonInternalJob,
} from '@/lib/python-internal/job-queue';

export type PythonInternalJobExecutionResult =
  | {
      status: 'completed';
      result: Record<string, unknown>;
    }
  | {
      status: 'failed';
      error: string;
      result?: Record<string, unknown>;
    };

function buildFailureResult(error: unknown): {
  error: string;
  message: string;
  code?: string;
} {
  return {
    error: error instanceof Error ? error.name : 'PythonInternalWorkerError',
    message: error instanceof Error ? error.message : 'Unknown Python internal worker error',
    code:
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'string'
        ? (error as { code: string }).code
        : undefined,
  };
}

export async function executeClaimedPythonInternalJob(params: {
  request: NextRequest;
  job: ClaimedPythonInternalJob;
}): Promise<PythonInternalJobExecutionResult> {
  try {
    const resultPayload =
      params.job.jobType === 'document_intelligence_extract_only'
        ? await processCvImportExtractJob({
            request: params.request,
            payload: params.job.payload,
          })
        : (
            await executePythonInternalJob({
              request: params.request,
              jobId: params.job.id,
              jobType: params.job.jobType,
              payload: params.job.payload,
            })
          ).result;

    await markPythonInternalJobSuccess(params.job.id, resultPayload);

    return {
      status: 'completed',
      result: resultPayload,
    };
  } catch (error) {
    const failureResult = buildFailureResult(error);

    await markPythonInternalJobFailure(params.job.id, failureResult.message, failureResult);

    return {
      status: 'failed',
      error: failureResult.message,
      result: failureResult,
    };
  }
}
