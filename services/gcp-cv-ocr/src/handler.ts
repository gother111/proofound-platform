import { randomUUID } from 'node:crypto';

import { InMemoryNonceStore, type NonceStore, verifyHmacRequest } from './auth';
import { createOcrProvider, OcrProviderError, type OcrProvider } from './provider';
import { resolveLimits, validateExtractPayload } from './validation';

type Env = Record<string, string | undefined>;

export type GcpCvOcrHandlerOptions = {
  env?: Env;
  nowMs?: () => number;
  nonceStore?: NonceStore;
  provider?: OcrProvider;
  providerTimeoutMs?: number;
  requestIdFactory?: () => string;
  documentIdFactory?: () => string;
};

const DEFAULT_PROVIDER_TIMEOUT_MS = 8000;
const DEFAULT_RESPONSE_TEXT_LIMIT = 30000;
const SIGNED_URL_PATTERN =
  /https?:\/\/[^\s"'<>]*(?:x-amz-signature|x-goog-signature|signature=|token=)[^\s"'<>]*/gi;
const STORAGE_PATH_PATTERN =
  /\b(?:gs|s3):\/\/[^\s"'<>]+|\b(?:cv-import-temp|user-uploads-private|proofound-uploads)\/[^\s"'<>]+/gi;
const SECRET_PATTERN =
  /\b(?:api[_-]?key|authorization|bearer|secret|token)\s*[:=]\s*['"]?[^'",\s;}]+/gi;
const RAW_FILENAME_PATTERN = /\b[\w.-]+\.(?:pdf|docx?|png|jpe?g|tiff?|webp)\b/gi;

const sharedNonceStore = new InMemoryNonceStore();

export function createGcpCvOcrHandler(options: GcpCvOcrHandlerOptions = {}) {
  const env = options.env ?? process.env;
  const nonceStore = options.nonceStore ?? sharedNonceStore;
  const provider = options.provider ?? createOcrProvider(env);
  const nowMs = options.nowMs ?? Date.now;
  const providerTimeoutMs = options.providerTimeoutMs ?? DEFAULT_PROVIDER_TIMEOUT_MS;
  const requestIdFactory =
    options.requestIdFactory ?? (() => `ocr_${randomUUID().replaceAll('-', '')}`);
  const documentIdFactory =
    options.documentIdFactory ?? (() => `doc_${randomUUID().replaceAll('-', '')}`);

  return async function handleGcpCvOcrRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' && (url.pathname === '/health' || url.pathname === '/healthz')) {
      return jsonResponse(200, {
        status: 'ok',
        service: 'gcp-cv-ocr',
      });
    }

    if (request.method !== 'POST' || url.pathname !== '/extract') {
      return jsonResponse(404, {
        status: 'error',
        error: {
          code: 'not_found',
          message: 'Endpoint not found.',
        },
      });
    }

    const requestId = requestIdFactory();
    const startedAt = nowMs();
    const rawBody = await request.text();
    const auth = verifyHmacRequest({
      headers: request.headers,
      rawBody,
      secret: env.GCP_CV_OCR_SHARED_SECRET?.trim() || null,
      nowMs: startedAt,
      nonceStore,
    });

    if (!auth.ok) {
      return safeErrorResponse(
        401,
        requestId,
        auth.code === 'stale_timestamp' ? 'stale_timestamp' : 'unauthorized'
      );
    }

    if (isOcrProviderExpired(env.GCP_CV_OCR_EXPIRES_AT, startedAt)) {
      return safeErrorResponse(503, requestId, 'ocr_expired');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return safeErrorResponse(400, requestId, 'bad_json');
    }

    const validation = validateExtractPayload(payload, resolveLimits(env));
    if (!validation.ok) {
      return safeErrorResponse(
        400,
        requestId,
        validation.code === 'file_too_large' ? 'file_too_large' : validation.code
      );
    }

    const documentId = documentIdFactory();

    try {
      const providerOutput = await withTimeout(
        provider.extract({
          documentId,
          contentType: validation.document.contentType,
          fileBytes: validation.document.fileBytes,
          pageCount: validation.document.pageCount,
        }),
        providerTimeoutMs
      );
      const text = truncateText(redactSensitiveText(providerOutput.text));

      return jsonResponse(200, {
        status: 'completed',
        provider: providerOutput.provider,
        requestId,
        documentId,
        pageCount: validation.document.pageCount,
        text,
        metadata: {
          confidence: clampConfidence(providerOutput.confidence),
          elapsedMs: Math.max(0, Math.round(nowMs() - startedAt)),
          textLength: text.length,
          truncated: text.length < providerOutput.text.length,
        },
        warnings: [],
      });
    } catch (error) {
      const code =
        error instanceof OcrProviderError && error.code === 'provider_timeout'
          ? 'provider_timeout'
          : 'provider_error';
      return safeErrorResponse(code === 'provider_timeout' ? 504 : 502, requestId, code);
    }
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new OcrProviderError('OCR provider request timed out.', 'provider_timeout'));
    }, timeoutMs);

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

function safeErrorResponse(statusCode: number, requestId: string, code: string): Response {
  return jsonResponse(statusCode, {
    status: 'error',
    requestId,
    error: {
      code,
      message: safeErrorMessage(code),
    },
  });
}

function safeErrorMessage(code: string): string {
  switch (code) {
    case 'bad_mime':
      return 'Unsupported document MIME type.';
    case 'file_too_large':
      return 'Document exceeds the configured size limit.';
    case 'too_many_pages':
      return 'Document exceeds the configured page limit.';
    case 'provider_timeout':
      return 'OCR provider timed out.';
    case 'provider_error':
      return 'OCR provider failed.';
    case 'stale_timestamp':
      return 'Request timestamp is outside the allowed window.';
    case 'bad_json':
      return 'Request body must be valid JSON.';
    case 'ocr_expired':
      return 'OCR provider has expired.';
    default:
      return 'Request could not be processed.';
  }
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function truncateText(value: string): string {
  return value.length > DEFAULT_RESPONSE_TEXT_LIMIT
    ? value.slice(0, DEFAULT_RESPONSE_TEXT_LIMIT)
    : value;
}

function redactSensitiveText(value: string): string {
  return value
    .replace(SIGNED_URL_PATTERN, '[redacted-url]')
    .replace(STORAGE_PATH_PATTERN, '[redacted-path]')
    .replace(SECRET_PATTERN, '[redacted-secret]')
    .replace(RAW_FILENAME_PATTERN, '[redacted-file]');
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function isOcrProviderExpired(expiresAtValue: string | undefined, nowMs: number): boolean {
  const trimmed = expiresAtValue?.trim();
  if (!trimmed) {
    return false;
  }

  const expiresAtMs = Date.parse(trimmed);
  return !Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs;
}
