import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROXY_TIMEOUT_MS = 10000;
const PROXY_UNAVAILABLE_CODE = 'CV_IMPORT_PROXY_UNAVAILABLE';
const PROXY_TIMEOUT_CODE = 'CV_IMPORT_PROXY_TIMEOUT';
type EndpointPath = '/wizard-suggest' | '/suggest';

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

function resolveBaseUrl(request: NextRequest): string {
  const configured = process.env.PYTHON_CV_IMPORT_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function resolveContentType(request: NextRequest): string | null {
  const contentType = request.headers.get('content-type');
  return contentType && contentType.trim().length > 0 ? contentType : null;
}

function resolveGenericErrorLabel(endpointPath: EndpointPath): string {
  return endpointPath === '/wizard-suggest'
    ? 'Failed to process CV wizard suggestions'
    : 'Failed to process CV documents';
}

function buildUnavailableResponse(
  endpointPath: EndpointPath,
  message: string,
  status = 503,
  code = PROXY_UNAVAILABLE_CODE
): NextResponse {
  return NextResponse.json(
    {
      error: resolveGenericErrorLabel(endpointPath),
      message,
      code,
    },
    { status }
  );
}

function hasCsrfFailure(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const record = payload as Record<string, unknown>;
  const error = typeof record.error === 'string' ? record.error.toLowerCase() : '';
  const message = typeof record.message === 'string' ? record.message.toLowerCase() : '';

  return (
    error.includes('csrf validation failed') ||
    message.includes('invalid or missing csrf token') ||
    message.includes('csrf')
  );
}

function resolveTargetUrl(
  request: NextRequest,
  baseUrl: string,
  endpointPath: EndpointPath
): string {
  const targetUrl = new URL('/api/python/cv_import', `${baseUrl}/`);
  targetUrl.searchParams.set('endpoint', endpointPath.replace(/^\//, ''));

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key !== 'endpoint') {
      targetUrl.searchParams.append(key, value);
    }
  });

  return targetUrl.toString();
}

export async function proxyCvRequestToPython(
  request: NextRequest,
  endpointPath: EndpointPath,
  timeoutMs = DEFAULT_PROXY_TIMEOUT_MS
): Promise<NextResponse> {
  const baseUrl = resolveBaseUrl(request);
  const targetUrl = resolveTargetUrl(request, baseUrl, endpointPath);

  const bodyBuffer = await request.arrayBuffer();
  const contentType = resolveContentType(request);

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (contentType) {
    headers['content-type'] = contentType;
  }

  const csrfToken = request.headers.get('x-csrf-token');
  if (csrfToken && csrfToken.trim().length > 0) {
    headers['x-csrf-token'] = csrfToken;
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader && cookieHeader.trim().length > 0) {
    headers['cookie'] = cookieHeader;
  }

  const internalSecret = process.env.CV_IMPORT_PROXY_INTERNAL_SECRET?.trim();
  if (internalSecret) {
    headers['x-cv-proxy-secret'] = internalSecret;
  }

  let response: Response;
  try {
    response = await withTimeout(
      fetch(targetUrl, {
        method: 'POST',
        headers,
        body: bodyBuffer,
        cache: 'no-store',
      }),
      timeoutMs
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      return buildUnavailableResponse(
        endpointPath,
        'Python CV service timed out. Falling back is recommended.',
        504,
        PROXY_TIMEOUT_CODE
      );
    }
    throw error;
  }

  const rawText = await response.text();

  if (!rawText) {
    return buildUnavailableResponse(
      endpointPath,
      'Python CV service returned an empty response.',
      502
    );
  }

  try {
    const jsonPayload = JSON.parse(rawText);

    if (response.status === 404) {
      return buildUnavailableResponse(
        endpointPath,
        'Python CV service route is unavailable. Falling back is recommended.'
      );
    }

    if (response.status === 403 && hasCsrfFailure(jsonPayload)) {
      return buildUnavailableResponse(
        endpointPath,
        'Python CV service rejected internal CSRF context. Falling back is recommended.'
      );
    }

    return NextResponse.json(jsonPayload, { status: response.status });
  } catch {
    if (response.status === 404 || response.status >= 500) {
      return buildUnavailableResponse(
        endpointPath,
        'Python CV service returned a non-JSON error response. Falling back is recommended.'
      );
    }

    return NextResponse.json(
      {
        error: resolveGenericErrorLabel(endpointPath),
        message: rawText,
      },
      { status: response.status >= 400 ? response.status : 502 }
    );
  }
}
