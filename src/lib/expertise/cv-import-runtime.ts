import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

import { parseCvImportEngineMode, type CvImportEngineMode } from '@/lib/expertise/gemini/config';

type CvImportRateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
};

const rateLimitState = new Map<string, number[]>();
type RequestLike = Request | NextRequest;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export function createRequestId(request: RequestLike): string {
  const incoming = request.headers.get('x-request-id')?.trim();
  if (incoming && incoming.length > 0) {
    return incoming.slice(0, 128);
  }
  return nanoid(12);
}

export function withRequestId<T extends NextResponse>(response: T, requestId: string): T {
  response.headers.set('x-request-id', requestId);
  return response;
}

export function jsonWithRequestId(
  requestId: string,
  payload: unknown,
  status = 200,
  initHeaders?: HeadersInit
): NextResponse {
  const response = NextResponse.json(payload, {
    status,
    headers: initHeaders,
  });
  return withRequestId(response, requestId);
}

export function resolveCvImportEngineMode(request: RequestLike): CvImportEngineMode {
  const searchParams =
    'nextUrl' in request ? request.nextUrl.searchParams : new URL(request.url).searchParams;
  const queryMode = searchParams.get('engine')?.trim().toLowerCase();
  if (
    queryMode === 'auto' ||
    queryMode === 'typescript' ||
    queryMode === 'python' ||
    queryMode === 'gemini'
  ) {
    return queryMode;
  }

  return parseCvImportEngineMode(process.env.CV_IMPORT_ENGINE_MODE);
}

export function enforceCvImportUserRateLimit(params: {
  userId: string;
  route: string;
  now?: number;
}): CvImportRateLimitResult {
  const now = params.now ?? Date.now();
  const limit = parsePositiveInt(process.env.CV_IMPORT_USER_RATE_LIMIT_MAX, 12);
  const windowSeconds = parsePositiveInt(process.env.CV_IMPORT_USER_RATE_LIMIT_WINDOW_SECONDS, 60);
  const windowMs = windowSeconds * 1000;
  const key = `${params.userId}:${params.route}`;

  const timestamps = rateLimitState.get(key) || [];
  const valid = timestamps.filter((ts) => now - ts < windowMs);

  if (valid.length >= limit) {
    const oldest = valid[0] || now;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  valid.push(now);
  rateLimitState.set(key, valid);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - valid.length),
    retryAfterSeconds: 0,
  };
}

export function shouldProxyToPython(contentType: string, mode: CvImportEngineMode): boolean {
  if (contentType.startsWith('multipart/form-data')) {
    return mode !== 'gemini';
  }
  if (mode === 'python') {
    return true;
  }
  if (mode === 'typescript' || mode === 'gemini') {
    return false;
  }
  return process.env.CV_IMPORT_FORCE_PYTHON === 'true';
}
