import { getInternalApiSecret } from '@/lib/api/auth';
import { resolvePythonInternalServiceBaseUrl } from '@/lib/python-internal/service';

const DEFAULT_PYTHON_INTERNAL_WORKER_WAKE_TIMEOUT_MS = 2_500;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

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
