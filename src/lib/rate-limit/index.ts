/**
 * Rate Limiting Middleware
 *
 * Implements token bucket rate limiting using Vercel KV (Redis)
 * Default: 100 requests per minute per IP address
 */

import { kv } from '@vercel/kv';
import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  /**
   * Maximum requests allowed in the window
   */
  limit: number;

  /**
   * Window duration in seconds
   */
  windowSeconds: number;

  /**
   * Identifier for this rate limit (used as Redis key prefix)
   */
  identifier?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  windowSeconds: 60, // 1 minute
};

/**
 * Get client identifier from request
 * Uses IP address by default, falls back to 'anonymous'
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from headers (Vercel provides this)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'anonymous';

  return ip;
}

/**
 * Rate limit a request using token bucket algorithm
 *
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and metadata
 */
export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const clientId = getClientIdentifier(request);
  const identifier = finalConfig.identifier || 'api';
  const key = `ratelimit:${identifier}:${clientId}`;

  try {
    // Check if KV is available
    if (!kv) {
      console.warn('[RateLimit] Vercel KV not configured, skipping rate limiting');
      return {
        success: true,
        limit: finalConfig.limit,
        remaining: finalConfig.limit,
        reset: Date.now() + finalConfig.windowSeconds * 1000,
      };
    }

    const now = Date.now();
    const windowMs = finalConfig.windowSeconds * 1000;

    // Use Redis for distributed rate limiting
    const count = await kv.incr(key);

    // Set expiry on first request in window
    if (count === 1) {
      await kv.expire(key, finalConfig.windowSeconds);
    }

    // Get TTL for reset time
    const ttl = await kv.ttl(key);
    const reset = now + (ttl > 0 ? ttl * 1000 : windowMs);

    const remaining = Math.max(0, finalConfig.limit - count);
    const success = count <= finalConfig.limit;

    return {
      success,
      limit: finalConfig.limit,
      remaining,
      reset,
    };
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error);
    // On error, allow the request (fail open)
    return {
      success: true,
      limit: finalConfig.limit,
      remaining: finalConfig.limit,
      reset: Date.now() + finalConfig.windowSeconds * 1000,
    };
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const RATE_LIMITS = {
  /** Standard API rate limit: 100 req/min */
  api: { limit: 100, windowSeconds: 60, identifier: 'api' },

  /** Matching API rate limit: 30 req/min (computationally expensive) */
  matching: { limit: 30, windowSeconds: 60, identifier: 'matching' },

  /** Auth endpoints: 10 req/min (prevent brute force) */
  auth: { limit: 10, windowSeconds: 60, identifier: 'auth' },

  /** Email sending: 20 req/min */
  email: { limit: 20, windowSeconds: 60, identifier: 'email' },

  /** File uploads: 10 req/min */
  upload: { limit: 10, windowSeconds: 60, identifier: 'upload' },

  /** Public profile views: 200 req/min (read-heavy) */
  public: { limit: 200, windowSeconds: 60, identifier: 'public' },

  /** Wellbeing check-ins: 5 req/min */
  wellbeing: { limit: 5, windowSeconds: 60, identifier: 'wellbeing' },
} as const;

/**
 * Create rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}

/**
 * Check if rate limit is exceeded and return appropriate response
 * Returns null if request is allowed, Response object if rate limited
 */
export async function checkRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; result: RateLimitResult }> {
  const result = await rateLimit(request, config);
  return {
    allowed: result.success,
    result,
  };
}
