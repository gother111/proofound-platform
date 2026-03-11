import { getInternalApiSecret } from '@/lib/api/auth';
import { parsePositiveInt, withTimeout } from '@/lib/python-internal/request-utils';
import { resolvePythonInternalServiceBaseUrl } from '@/lib/python-internal/service';

const DEFAULT_PYTHON_INTERNAL_WORKER_WAKE_TIMEOUT_MS = 2_500;

export function resolvePythonInternalWorkerWakeTimeoutMs(): number {
  return parsePositiveInt(
    process.env.CV_IMPORT_WORKER_WAKE_TIMEOUT_MS,
    DEFAULT_PYTHON_INTERNAL_WORKER_WAKE_TIMEOUT_MS
  );
}

export async function triggerPythonInternalWorker(
  params: {
    timeoutMs?: number;
  } = {}
): Promise<boolean> {
  const secret = getInternalApiSecret();
  if (!secret) {
    return false;
  }

  const baseUrl = resolvePythonInternalServiceBaseUrl();
  const targetUrl = new URL('/api/cron/python-internal-worker', `${baseUrl}/`);

  try {
    const response = await withTimeout(
      fetch(targetUrl.toString(), {
        method: 'GET',
        headers: {
          authorization: `Bearer ${secret}`,
        },
        cache: 'no-store',
      }),
      params.timeoutMs ?? resolvePythonInternalWorkerWakeTimeoutMs()
    );

    return response.ok;
  } catch {
    return false;
  }
}
