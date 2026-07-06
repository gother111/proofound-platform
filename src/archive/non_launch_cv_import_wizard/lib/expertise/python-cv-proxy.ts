import { NextRequest, NextResponse } from 'next/server';

import {
  PYTHON_INTERNAL_CONTRACT_VERSION,
  PythonCvImportExtractResponseSchema,
  PythonCvImportSuggestResponseSchema,
  PythonCvImportWizardSuggestResponseSchema,
} from '@/archive/non_launch_python_internal/lib/python-internal/contracts';
import {
  getPythonInternalServiceSecret,
  resolvePythonInternalServiceBaseUrl,
} from '@/archive/non_launch_python_internal/lib/python-internal/service';
import { withTimeout } from '@/archive/non_launch_python_internal/lib/python-internal/request-utils';

const DEFAULT_PROXY_TIMEOUT_MS = 10000;
const PROXY_UNAVAILABLE_CODE = 'CV_IMPORT_PROXY_UNAVAILABLE';
const PROXY_TIMEOUT_CODE = 'CV_IMPORT_PROXY_TIMEOUT';
const PROXY_INVALID_CONTRACT_CODE = 'CV_IMPORT_PROXY_INVALID_CONTRACT';
const MULTIPART_METADATA_INVALID_CODE = 'CV_IMPORT_MULTIPART_METADATA_INVALID';
const UPLOAD_METADATA_ENCODING_ERROR_MESSAGE =
  'Upload metadata contains unsupported characters. Please rename the PDF and retry.';
const UTF8_CODEC_ERROR_PATTERN =
  /utf-8['"]?\s+codec\s+can'?t\s+decode\s+byte|can't decode byte.*utf-8|invalid continuation byte/i;
type EndpointPath = '/wizard-suggest' | '/suggest' | '/extract';

function resolveContentType(request: NextRequest): string | null {
  const contentType = request.headers.get('content-type');
  return contentType && contentType.trim().length > 0 ? contentType : null;
}

function resolveGenericErrorLabel(endpointPath: EndpointPath): string {
  if (endpointPath === '/extract') {
    return 'Failed to extract CV text';
  }
  return endpointPath === '/wizard-suggest'
    ? 'Failed to process CV wizard suggestions'
    : 'Failed to process CV documents';
}

function containsUtf8CodecError(value: string): boolean {
  return UTF8_CODEC_ERROR_PATTERN.test(value.toLowerCase());
}

function normalizeCodecErrorPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  let changed = false;
  const next: Record<string, unknown> = { ...record };

  for (const key of ['error', 'message', 'detail']) {
    const value = record[key];
    if (typeof value === 'string' && containsUtf8CodecError(value)) {
      next[key] = UPLOAD_METADATA_ENCODING_ERROR_MESSAGE;
      changed = true;
    }
  }

  if (!changed) {
    return payload;
  }

  next.code = MULTIPART_METADATA_INVALID_CODE;
  return next;
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

function resolveContractSchema(endpointPath: EndpointPath) {
  if (endpointPath === '/wizard-suggest') {
    return PythonCvImportWizardSuggestResponseSchema;
  }
  if (endpointPath === '/suggest') {
    return PythonCvImportSuggestResponseSchema;
  }
  return PythonCvImportExtractResponseSchema;
}

export async function proxyCvRequestToPython(
  request: NextRequest,
  endpointPath: EndpointPath,
  timeoutMs = DEFAULT_PROXY_TIMEOUT_MS
): Promise<NextResponse> {
  const contentType = resolveContentType(request);
  const isMultipart = Boolean(contentType?.startsWith('multipart/form-data'));
  const body: BodyInit | null = isMultipart ? request.body : await request.arrayBuffer();

  const headers: Record<string, string> = {
    accept: 'application/json',
  };

  if (contentType) {
    headers['content-type'] = contentType;
  }

  const internalSecret = getPythonInternalServiceSecret();
  if (!internalSecret) {
    return buildUnavailableResponse(
      endpointPath,
      'Python internal service secret is not configured.',
      503
    );
  }

  headers['x-python-service-secret'] = internalSecret;
  headers['x-cv-proxy-secret'] = internalSecret;
  headers['x-proofound-contract-version'] = PYTHON_INTERNAL_CONTRACT_VERSION;

  let targetUrl: string;
  try {
    const baseUrl = resolvePythonInternalServiceBaseUrl(request);
    targetUrl = resolveTargetUrl(request, baseUrl, endpointPath);
  } catch (error) {
    return buildUnavailableResponse(
      endpointPath,
      error instanceof Error ? error.message : 'Python CV service is unavailable.',
      503
    );
  }

  let response: Response;
  try {
    const fetchInit: RequestInit & { duplex?: 'half' } = {
      method: 'POST',
      headers,
      body: body ?? undefined,
      cache: 'no-store',
    };

    if (isMultipart && body) {
      fetchInit.duplex = 'half';
    }

    response = await withTimeout(fetch(targetUrl, fetchInit), timeoutMs);
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
    const jsonPayload = normalizeCodecErrorPayload(JSON.parse(rawText));

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

    if (response.ok) {
      const parsed = resolveContractSchema(endpointPath).safeParse(jsonPayload);
      if (!parsed.success) {
        return buildUnavailableResponse(
          endpointPath,
          'Python CV service returned an invalid contract response.',
          502,
          PROXY_INVALID_CONTRACT_CODE
        );
      }

      return NextResponse.json(parsed.data, { status: response.status });
    }

    return NextResponse.json(jsonPayload, { status: response.status });
  } catch {
    if (containsUtf8CodecError(rawText)) {
      return NextResponse.json(
        {
          error: resolveGenericErrorLabel(endpointPath),
          message: UPLOAD_METADATA_ENCODING_ERROR_MESSAGE,
          code: MULTIPART_METADATA_INVALID_CODE,
        },
        { status: response.status >= 400 ? response.status : 502 }
      );
    }

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
