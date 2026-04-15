import type { NextRequest } from 'next/server';

const LOCAL_DEV_PYTHON_SERVICE_SECRET = 'proofound-local-python-service';

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  return '';
}

function isProductionLikeRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function getPythonInternalServiceSecret(): string {
  const configured = firstNonEmpty([
    process.env.PYTHON_INTERNAL_SERVICE_SECRET,
    process.env.CV_IMPORT_PROXY_INTERNAL_SECRET,
    process.env.INTERNAL_API_SECRET,
    process.env.CRON_SECRET,
  ]);

  if (configured) {
    return configured;
  }

  return isProductionLikeRuntime() ? '' : LOCAL_DEV_PYTHON_SERVICE_SECRET;
}

function normalizePythonBaseUrl(configured: string, allowLocalHttp: boolean): string {
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error('PYTHON_CV_IMPORT_BASE_URL is not a valid absolute URL.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocalHttpHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (parsed.protocol === 'https:') {
    return parsed.origin;
  }

  if (allowLocalHttp && parsed.protocol === 'http:' && isLocalHttpHost) {
    return parsed.origin;
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('PYTHON_CV_IMPORT_BASE_URL must use https outside local development.');
  }

  throw new Error('PYTHON_CV_IMPORT_BASE_URL must target a trusted https origin.');
}

export function resolvePythonInternalServiceBaseUrl(_request?: Request | NextRequest): string {
  const configured = process.env.PYTHON_CV_IMPORT_BASE_URL?.trim();
  if (configured) {
    return normalizePythonBaseUrl(configured, !isProductionLikeRuntime());
  }

  if (isProductionLikeRuntime()) {
    throw new Error(
      'PYTHON_CV_IMPORT_BASE_URL must be configured in production-like environments.'
    );
  }

  return 'http://127.0.0.1:3000';
}
