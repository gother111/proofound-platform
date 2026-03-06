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

export function resolvePythonInternalServiceBaseUrl(request?: Request | NextRequest): string {
  const configured = process.env.PYTHON_CV_IMPORT_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (request) {
    if ('nextUrl' in request) {
      const forwardedProto = request.headers.get('x-forwarded-proto');
      const forwardedHost = request.headers.get('x-forwarded-host');

      if (forwardedProto && forwardedHost) {
        return `${forwardedProto}://${forwardedHost}`;
      }

      return request.nextUrl.origin;
    }

    return new URL(request.url).origin;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    return siteUrl.replace(/\/$/, '');
  }

  return 'http://127.0.0.1:3000';
}
