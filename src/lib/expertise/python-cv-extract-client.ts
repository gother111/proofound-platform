import type { NextRequest } from 'next/server';

import {
  PYTHON_INTERNAL_CONTRACT_VERSION,
  PythonCvImportExtractResponseSchema,
} from '@/lib/python-internal/contracts';
import {
  getPythonInternalServiceSecret,
  resolvePythonInternalServiceBaseUrl,
} from '@/lib/python-internal/service';
import { parsePositiveInt, withTimeout } from '@/lib/python-internal/request-utils';

const DEFAULT_PYTHON_EXTRACT_TIMEOUT_MS = 55_000;

export class PythonCvExtractError extends Error {
  code?: string;
  status: number;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'PythonCvExtractError';
    this.status = status;
    this.code = code;
  }
}

function resolveTargetUrl(request?: NextRequest): string {
  try {
    const baseUrl = resolvePythonInternalServiceBaseUrl(request);
    const targetUrl = new URL('/api/python/cv_import', `${baseUrl}/`);
    targetUrl.searchParams.set('endpoint', 'extract');
    return targetUrl.toString();
  } catch (error) {
    throw new PythonCvExtractError(
      error instanceof Error ? error.message : 'Python CV extract service is unavailable.',
      503,
      'CV_IMPORT_PROXY_UNAVAILABLE'
    );
  }
}

export function resolvePythonExtractTimeoutMs(): number {
  return parsePositiveInt(
    process.env.CV_IMPORT_PYTHON_EXTRACT_TIMEOUT_MS,
    DEFAULT_PYTHON_EXTRACT_TIMEOUT_MS
  );
}

function readPayloadMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim().length > 0) {
      return record.message.trim();
    }
    if (typeof record.error === 'string' && record.error.trim().length > 0) {
      return record.error.trim();
    }
  }

  return fallback;
}

function readPayloadCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const code = (payload as Record<string, unknown>).code;
  return typeof code === 'string' && code.trim().length > 0 ? code.trim() : undefined;
}

export async function extractPdfTextViaPython(params: {
  request?: NextRequest;
  fileName: string;
  documentId: string;
  context: 'cv';
  buffer: Buffer;
  timeoutMs?: number;
}) {
  const secret = getPythonInternalServiceSecret();
  if (!secret) {
    throw new PythonCvExtractError('Python internal service secret is not configured.', 503);
  }

  const formData = new FormData();
  formData.append(
    'files',
    new Blob([new Uint8Array(params.buffer)], { type: 'application/pdf' }),
    params.fileName
  );
  formData.append('document_ids', params.documentId);
  formData.append('contexts', params.context);

  let response: Response;
  try {
    response = await withTimeout(
      fetch(resolveTargetUrl(params.request), {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'x-python-service-secret': secret,
          'x-cv-proxy-secret': secret,
          'x-proofound-contract-version': PYTHON_INTERNAL_CONTRACT_VERSION,
        },
        body: formData,
        cache: 'no-store',
      }),
      params.timeoutMs ?? resolvePythonExtractTimeoutMs()
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      throw new PythonCvExtractError(
        'Python CV extract service timed out.',
        504,
        'CV_IMPORT_PROXY_TIMEOUT'
      );
    }
    throw new PythonCvExtractError(
      error instanceof Error ? error.message : 'Python CV extract request failed.',
      503,
      'CV_IMPORT_PROXY_UNAVAILABLE'
    );
  }

  const rawText = await response.text();
  if (!rawText) {
    throw new PythonCvExtractError(
      'Python CV extract service returned an empty response.',
      502,
      'CV_IMPORT_PROXY_INVALID_CONTRACT'
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new PythonCvExtractError(
      `Python CV extract service returned non-JSON response (status ${response.status}).`,
      response.status >= 400 ? response.status : 502,
      response.status >= 500 ? 'CV_IMPORT_PROXY_UNAVAILABLE' : 'CV_IMPORT_PROXY_INVALID_CONTRACT'
    );
  }

  if (!response.ok) {
    throw new PythonCvExtractError(
      readPayloadMessage(payload, `Python CV extract failed with status ${response.status}.`),
      response.status,
      readPayloadCode(payload)
    );
  }

  const parsed = PythonCvImportExtractResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PythonCvExtractError(
      'Python CV extract service returned an invalid contract response.',
      502,
      'CV_IMPORT_PROXY_INVALID_CONTRACT'
    );
  }

  const document = parsed.data.documents.find((entry) => entry.document_id === params.documentId);
  if (!document) {
    throw new PythonCvExtractError(
      'Python CV extract service did not return the requested document.',
      502,
      'CV_IMPORT_PROXY_INVALID_CONTRACT'
    );
  }

  return document;
}
