import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_PROXY_TIMEOUT_MS = 10000;

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

export async function proxyCvRequestToPython(
  request: NextRequest,
  endpointPath: '/wizard-suggest' | '/suggest',
  timeoutMs = DEFAULT_PROXY_TIMEOUT_MS
): Promise<NextResponse> {
  const baseUrl = resolveBaseUrl(request);
  const targetUrl = `${baseUrl}/api/python/cv_import${endpointPath}${request.nextUrl.search}`;

  const bodyBuffer = await request.arrayBuffer();
  const contentType = resolveContentType(request);

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (contentType) {
    headers['content-type'] = contentType;
  }

  const internalSecret = process.env.CV_IMPORT_PROXY_INTERNAL_SECRET?.trim();
  if (internalSecret) {
    headers['x-cv-proxy-secret'] = internalSecret;
  }

  const response = await withTimeout(
    fetch(targetUrl, {
      method: 'POST',
      headers,
      body: bodyBuffer,
      cache: 'no-store',
    }),
    timeoutMs
  );

  const rawText = await response.text();

  if (!rawText) {
    return NextResponse.json(
      {
        error:
          endpointPath === '/wizard-suggest'
            ? 'Failed to process CV wizard suggestions'
            : 'Failed to process CV documents',
        message: 'Python CV service returned an empty response.',
      },
      { status: 502 }
    );
  }

  try {
    const jsonPayload = JSON.parse(rawText);
    return NextResponse.json(jsonPayload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        error:
          endpointPath === '/wizard-suggest'
            ? 'Failed to process CV wizard suggestions'
            : 'Failed to process CV documents',
        message: rawText,
      },
      { status: response.status >= 400 ? response.status : 502 }
    );
  }
}
