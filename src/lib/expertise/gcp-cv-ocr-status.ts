import { resolveGcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';

export const GCP_CV_OCR_SAFE_STATUSES = [
  'disabled',
  'configured',
  'expired',
  'fallback',
  'provider reachable',
] as const;

export type GcpCvOcrSafeStatus = (typeof GCP_CV_OCR_SAFE_STATUSES)[number];

type EnvReader = Record<string, string | undefined>;

export type ResolveGcpCvOcrSafeStatusOptions = {
  env?: EnvReader;
  now?: Date;
  probeProvider?: boolean;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export type GcpCvOcrSafeStatusReport = {
  status: GcpCvOcrSafeStatus;
};

const DEFAULT_STATUS_TIMEOUT_MS = 3000;

export async function resolveGcpCvOcrSafeStatus(
  options: ResolveGcpCvOcrSafeStatusOptions = {}
): Promise<GcpCvOcrSafeStatusReport> {
  const config = resolveGcpCvOcrConfig(options.env, options.now ?? new Date());

  if (!config.enabled) {
    return { status: 'disabled' };
  }

  if (config.unavailableReason === 'expired') {
    return { status: 'expired' };
  }

  if (!config.available || !config.baseUrl) {
    return { status: 'fallback' };
  }

  if (!options.probeProvider) {
    return { status: 'configured' };
  }

  const reachable = await probeProviderHealth({
    baseUrl: config.baseUrl,
    fetchImpl: options.fetchImpl ?? fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_STATUS_TIMEOUT_MS,
  });

  return { status: reachable ? 'provider reachable' : 'fallback' };
}

async function probeProviderHealth(params: {
  baseUrl: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
}): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const response = await params.fetchImpl(`${params.baseUrl}/health`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      return false;
    }

    const payload = await safeJson(response);
    return isRecord(payload) && payload.status === 'ok';
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
