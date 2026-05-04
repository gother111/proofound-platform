import { resolveGcpCvOcrConfig } from '@/lib/expertise/gcp-cv-ocr-config';
import {
  resolveGcpCvOcrOidcBearerToken,
  type VercelOidcTokenFactory,
} from '@/lib/expertise/gcp-cv-ocr-oidc';

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
  vercelOidcTokenFactory?: VercelOidcTokenFactory;
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
    config,
    fetchImpl: options.fetchImpl ?? fetch,
    timeoutMs: options.timeoutMs ?? DEFAULT_STATUS_TIMEOUT_MS,
    vercelOidcTokenFactory: options.vercelOidcTokenFactory,
  });

  return { status: reachable ? 'provider reachable' : 'fallback' };
}

async function probeProviderHealth(params: {
  config: ReturnType<typeof resolveGcpCvOcrConfig>;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  vercelOidcTokenFactory?: VercelOidcTokenFactory;
}): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);

  try {
    const headers = await buildHealthAuthHeaders(params);
    const init: RequestInit = {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    };
    if (headers) {
      init.headers = headers;
    }
    const response = await params.fetchImpl(`${params.config.baseUrl}/health`, init);

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

async function buildHealthAuthHeaders(params: {
  config: ReturnType<typeof resolveGcpCvOcrConfig>;
  fetchImpl: typeof fetch;
  vercelOidcTokenFactory?: VercelOidcTokenFactory;
}): Promise<Record<string, string> | undefined> {
  if (params.config.authMode !== 'oidc') {
    return undefined;
  }

  const token = await resolveGcpCvOcrOidcBearerToken({
    config: params.config,
    fetchImpl: params.fetchImpl,
    vercelOidcTokenFactory: params.vercelOidcTokenFactory,
  });
  return {
    authorization: `Bearer ${token}`,
  };
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
