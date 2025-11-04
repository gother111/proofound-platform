/**
 * Rate Limiting Middleware Helpers
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitHeaders, RateLimitConfig } from './index';

/**
 * Wrap an API route handler with rate limiting
 *
 * @example
 * ```ts
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true });
 *   },
 *   { limit: 10, windowSeconds: 60 }
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: Partial<RateLimitConfig> = {}
) {
  return async function rateLimitedHandler(
    request: NextRequest,
    ...args: any[]
  ): Promise<NextResponse> {
    const { allowed, result } = await checkRateLimit(request, config);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            ...getRateLimitHeaders(result),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Call the original handler
    const response = await handler(request, ...args);

    // Add rate limit headers to response
    const headers = getRateLimitHeaders(result);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Manual rate limit check for use inside route handlers
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitCheck = await requireRateLimit(request, { limit: 10 });
 *   if (!rateLimitCheck) {
 *     return; // Response already sent
 *   }
 *
 *   // Continue with handler logic
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
export async function requireRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: true } | NextResponse> {
  const { allowed, result } = await checkRateLimit(request, config);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          ...getRateLimitHeaders(result),
          'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return { allowed: true };
}
