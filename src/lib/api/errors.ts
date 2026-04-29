import { NextResponse } from 'next/server';
import { ZodError, type ZodIssue } from 'zod';

import { log } from '@/lib/log';
import { sanitizeErrorForLog, sanitizeLogPayload } from '@/lib/privacy/log-redaction';

export const GENERIC_UNEXPECTED_API_ERROR = 'Something went wrong. Please try again later.';

export function isProductionRuntime() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

export function safeValidationIssues(error: ZodError | ZodIssue[]) {
  const issues = Array.isArray(error) ? error : error.issues;
  return issues.map((issue) => ({
    path: issue.path.map(String),
    message: issue.message,
    code: issue.code,
  }));
}

export function safeApiErrorResponse(input: {
  event: string;
  error: unknown;
  status?: number;
  requestId?: string;
  publicMessage?: string;
  context?: Record<string, unknown>;
}) {
  const status = input.status ?? 500;
  const publicMessage =
    status >= 500 && isProductionRuntime()
      ? (input.publicMessage ?? GENERIC_UNEXPECTED_API_ERROR)
      : (input.publicMessage ?? GENERIC_UNEXPECTED_API_ERROR);

  log.error(input.event, {
    ...(input.context ? sanitizeLogPayload(input.context) : {}),
    ...(input.requestId ? { requestId: input.requestId } : {}),
    status,
    error: sanitizeErrorForLog(input.error),
  });

  const payload: Record<string, unknown> = {
    error: publicMessage,
  };

  if (input.requestId) {
    payload.requestId = input.requestId;
  }

  return NextResponse.json(payload, { status });
}

export function safeValidationErrorResponse(input: {
  error: ZodError | ZodIssue[];
  requestId?: string;
  message?: string;
  status?: number;
}) {
  const payload: Record<string, unknown> = {
    error: input.message ?? 'Validation failed',
    details: safeValidationIssues(input.error),
  };

  if (input.requestId) {
    payload.requestId = input.requestId;
  }

  return NextResponse.json(payload, { status: input.status ?? 400 });
}
