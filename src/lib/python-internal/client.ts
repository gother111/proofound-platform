import type { NextRequest } from 'next/server';

import {
  PYTHON_INTERNAL_CONTRACT_VERSION,
  PythonInternalWorkerResponseSchema,
  type PythonInternalJobType,
  type PythonInternalWorkerResponse,
} from '@/lib/python-internal/contracts';
import {
  getPythonInternalServiceSecret,
  resolvePythonInternalServiceBaseUrl,
} from '@/lib/python-internal/service';
import { withTimeout } from '@/lib/python-internal/request-utils';

const DEFAULT_PYTHON_INTERNAL_JOB_TIMEOUT_MS = 15000;

export async function executePythonInternalJob(params: {
  request: NextRequest;
  jobId: string;
  jobType: PythonInternalJobType;
  payload: Record<string, unknown>;
  timeoutMs?: number;
}): Promise<PythonInternalWorkerResponse> {
  const secret = getPythonInternalServiceSecret();
  if (!secret) {
    throw new Error('Python internal service secret is not configured.');
  }

  const baseUrl = resolvePythonInternalServiceBaseUrl(params.request);
  const targetUrl = new URL('/api/python/cv_import', `${baseUrl}/`);
  targetUrl.searchParams.set('endpoint', 'internal-job');

  const response = await withTimeout(
    fetch(targetUrl.toString(), {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-python-service-secret': secret,
        'x-proofound-contract-version': PYTHON_INTERNAL_CONTRACT_VERSION,
      },
      body: JSON.stringify({
        job_id: params.jobId,
        job_type: params.jobType,
        payload: params.payload,
      }),
      cache: 'no-store',
    }),
    params.timeoutMs ?? DEFAULT_PYTHON_INTERNAL_JOB_TIMEOUT_MS
  );

  const rawText = await response.text();
  if (!rawText) {
    throw new Error('Python internal job response was empty.');
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error(`Python internal job returned non-JSON response (status ${response.status}).`);
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Python internal job failed with status ${response.status}.`;
    throw new Error(message);
  }

  const parsed = PythonInternalWorkerResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Python internal job returned an invalid contract response.');
  }

  return parsed.data;
}
