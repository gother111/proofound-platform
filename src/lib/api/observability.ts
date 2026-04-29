import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import * as Sentry from '@sentry/nextjs';
import { log, logContext } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import { withPerformanceMonitoring } from '@/lib/performance/api-monitor';

export type ApiObservabilityContext = {
  requestId: string;
  path: string;
  method: string;
  userAgent?: string;
};

export interface ApiObservabilityOptions {
  trackPerformance?: boolean;
  slowThresholdMs?: number;
}

export function jsonErrorWithRequest(
  requestId: string,
  message: string,
  status = 400,
  details?: unknown
) {
  const payload: Record<string, unknown> = {
    error: message,
    requestId,
  };

  if (details !== undefined) {
    payload.details = details;
    if (typeof details === 'string') {
      payload.message = details;
    } else if (typeof details === 'object' && details && 'message' in details) {
      const maybeMessage = (details as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        payload.message = maybeMessage;
      }
    }
  }

  return NextResponse.json(payload, { status });
}

export async function withApiObservability<T extends NextResponse>(
  request: NextRequest,
  routeName: string,
  handler: (context: ApiObservabilityContext) => Promise<T>,
  options: ApiObservabilityOptions = {}
): Promise<T> {
  const requestId = request.headers.get('x-request-id') || nanoid(12);
  const context: ApiObservabilityContext = {
    requestId,
    path: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
  };

  const slowThresholdMs = options.slowThresholdMs ?? 1500;
  const trackPerformance = options.trackPerformance !== false;

  return logContext.run(context, async () => {
    const startTime = Date.now();

    try {
      const response = trackPerformance
        ? await withPerformanceMonitoring(request, routeName, () => handler(context))
        : await handler(context);

      const durationMs = Date.now() - startTime;
      if (slowThresholdMs && durationMs > slowThresholdMs) {
        log.warn('api.slow', {
          route: routeName,
          durationMs,
          requestId,
          path: context.path,
          method: context.method,
        });
      }

      response.headers.set('x-request-id', requestId);
      return response;
    } catch (error) {
      const durationMs = Date.now() - startTime;

      log.error('api.error', {
        route: routeName,
        durationMs,
        requestId,
        path: context.path,
        method: context.method,
        error: sanitizeErrorForLog(error),
      });

      Sentry.withScope((scope) => {
        scope.setTag('request_id', requestId);
        scope.setTag('route', routeName);
        scope.setTag('method', context.method);
        scope.setContext('request', {
          requestId,
          path: context.path,
          method: context.method,
        });

        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage('Non-error thrown in API handler');
        }
      });

      const response = NextResponse.json(
        { error: 'Internal server error', requestId },
        { status: 500 }
      );
      response.headers.set('x-request-id', requestId);
      return response as T;
    }
  });
}
