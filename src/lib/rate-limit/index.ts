/**
 * Rate Limiting Middleware
 *
 * Implements token bucket rate limiting using Vercel KV (Redis)
 * Default: 100 requests per minute per IP address
 */

import { kv } from '@vercel/kv';
import { NextRequest } from 'next/server';
import { log } from '@/lib/log';

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

  /**
   * Deny requests when the backing limiter is not configured or unavailable.
   * Use this for unauthenticated public abuse surfaces that should degrade immediately.
   */
  requiresLimiter?: boolean;

  /**
   * Deny requests when a configured limiter provider errors.
   * This lets local/dev missing-KV paths keep auth/CSRF behavior while production provider
   * failures still close high-risk endpoints.
   */
  failClosedOnProviderError?: boolean;

  /**
   * Use an in-memory limiter when KV is not configured outside launch environments.
   * This keeps local browser verification rate limited without weakening staging/production.
   */
  allowLocalFallback?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp when the limit resets
  unavailable?: boolean;
  failureReason?: 'missing_configuration' | 'provider_error';
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  windowSeconds: 60, // 1 minute
  requiresLimiter: false,
};

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const LOCAL_RATE_LIMIT_MAX_ENTRIES = 1024;

const RATE_LIMIT_ENV_KEYS = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'] as const;
const LOCAL_SMOKE_RATE_LIMIT_FALLBACK_ENV_KEY = 'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK';

interface LocalRateLimitEntry {
  count: number;
  reset: number;
}

function getLocalRateLimitStore(): Map<string, LocalRateLimitEntry> {
  const globalStore = globalThis as typeof globalThis & {
    __PROFOUND_RATE_LIMIT_STORE__?: Map<string, LocalRateLimitEntry>;
  };

  if (!globalStore.__PROFOUND_RATE_LIMIT_STORE__) {
    globalStore.__PROFOUND_RATE_LIMIT_STORE__ = new Map<string, LocalRateLimitEntry>();
  }

  return globalStore.__PROFOUND_RATE_LIMIT_STORE__;
}

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

  return ip.replace(/[^a-zA-Z0-9.:-]/g, '_');
}

function isMutatingMethod(method: string): boolean {
  return MUTATING_METHODS.has(method.toUpperCase());
}

export function isRateLimiterConfigured(
  env: Pick<NodeJS.ProcessEnv, string> = process.env
): boolean {
  return Boolean(env.KV_REST_API_URL?.trim()) && Boolean(env.KV_REST_API_TOKEN?.trim());
}

export function isLaunchRateLimitRequired(
  env: Pick<NodeJS.ProcessEnv, string> = process.env
): boolean {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();
  const appEnv = (env.NEXT_PUBLIC_APP_ENV || env.APP_ENV)?.trim().toLowerCase();
  const explicitLaunchAppEnv = appEnv === 'production' || appEnv === 'staging';
  const localSmokeFallbackEnabled = env[LOCAL_SMOKE_RATE_LIMIT_FALLBACK_ENV_KEY] === '1';

  if (localSmokeFallbackEnabled && !vercelEnv && !explicitLaunchAppEnv) {
    return false;
  }

  return (
    nodeEnv === 'production' ||
    vercelEnv === 'production' ||
    vercelEnv === 'preview' ||
    explicitLaunchAppEnv
  );
}

export function getRateLimitDependencyStatus(env: Pick<NodeJS.ProcessEnv, string> = process.env) {
  const required = isLaunchRateLimitRequired(env);
  const configured = isRateLimiterConfigured(env);
  const missing = RATE_LIMIT_ENV_KEYS.filter((key) => !env[key]?.trim());

  return {
    ok: !required || configured,
    required,
    configured,
    missing,
  };
}

function unavailableResult(
  config: RateLimitConfig,
  failureReason: RateLimitResult['failureReason']
): RateLimitResult {
  const reset = Date.now() + config.windowSeconds * 1000;
  const shouldDeny =
    config.requiresLimiter ||
    (failureReason === 'provider_error' && config.failClosedOnProviderError === true);

  return {
    success: !shouldDeny,
    limit: config.limit,
    remaining: shouldDeny ? 0 : config.limit,
    reset,
    unavailable: true,
    failureReason,
  };
}

function localRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const store = getLocalRateLimitStore();
  const existing = store.get(key);

  for (const [entryKey, entry] of store) {
    if (entry.reset <= now) {
      store.delete(entryKey);
    }
  }

  if (!existing && store.size >= LOCAL_RATE_LIMIT_MAX_ENTRIES) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: now + windowMs,
    };
  }

  const current =
    existing && existing.reset > now
      ? { count: existing.count + 1, reset: existing.reset }
      : { count: 1, reset: now + windowMs };

  store.set(key, current);

  const remaining = Math.max(0, config.limit - current.count);

  return {
    success: current.count <= config.limit,
    limit: config.limit,
    remaining,
    reset: current.reset,
  };
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
    if (!isRateLimiterConfigured() || !kv) {
      if (finalConfig.allowLocalFallback && !isLaunchRateLimitRequired()) {
        return localRateLimit(key, finalConfig);
      }

      return unavailableResult(finalConfig, 'missing_configuration');
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
    log.error('rate_limit.provider_check_failed', {
      identifier,
      error,
    });
    return unavailableResult(finalConfig, 'provider_error');
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const RATE_LIMITS = {
  /** Standard low-risk API rate limit: 100 req/min */
  api: { limit: 100, windowSeconds: 60, identifier: 'api' },

  /** Mutation-heavy fallback: 40 req/min */
  apiMutation: {
    limit: 40,
    windowSeconds: 60,
    identifier: 'api-mutation',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Matching API rate limit: 30 req/min (computationally expensive) */
  matching: {
    limit: 30,
    windowSeconds: 60,
    identifier: 'matching',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Assistive AI endpoints: 12 req/min */
  aiAssistive: {
    limit: 12,
    windowSeconds: 60,
    identifier: 'ai-assistive',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Auth endpoints: 10 req/min (prevent brute force) */
  auth: {
    limit: 10,
    windowSeconds: 60,
    identifier: 'auth',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** CSRF token issuance: read-heavy setup endpoint, separated from auth brute-force limits */
  csrf: {
    limit: 120,
    windowSeconds: 60,
    identifier: 'csrf-token',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Work-email send/verify: 5 req/min */
  workEmail: {
    limit: 5,
    windowSeconds: 60,
    identifier: 'work-email',
    requiresLimiter: true,
    failClosedOnProviderError: true,
  },

  /** Email sending: 20 req/min */
  email: {
    limit: 20,
    windowSeconds: 60,
    identifier: 'email',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** File uploads: 8 req/min */
  upload: {
    limit: 8,
    windowSeconds: 60,
    identifier: 'upload',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Verification requests/responses: 20 req/5 min */
  verification: {
    limit: 20,
    windowSeconds: 300,
    identifier: 'verification',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Public token preview/submit routes: 12 req/5 min */
  publicToken: {
    limit: 12,
    windowSeconds: 300,
    identifier: 'public-token',
    requiresLimiter: true,
    failClosedOnProviderError: true,
  },

  /** Conversation reveal and intro initiation: 10 req/min */
  revealIntro: {
    limit: 10,
    windowSeconds: 60,
    identifier: 'reveal-intro',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Public Page and trust page views: 80 req/min (read-heavy but public) */
  public: { limit: 80, windowSeconds: 60, identifier: 'public' },

  /** Wellbeing check-ins: 5 req/min */
  wellbeing: {
    limit: 5,
    windowSeconds: 60,
    identifier: 'wellbeing',
    requiresLimiter: true,
    failClosedOnProviderError: true,
    allowLocalFallback: true,
  },

  /** Non-API page views: 240 req/min */
  site: { limit: 240, windowSeconds: 60, identifier: 'site' },
} as const;

export type RateLimitProfile = keyof typeof RATE_LIMITS;

export function getRateLimitProfileForPathname(
  pathname: string,
  method = 'GET'
): (typeof RATE_LIMITS)[RateLimitProfile] | null {
  if (
    pathname === '/api/health' ||
    pathname === '/health' ||
    pathname.startsWith('/_next') ||
    /\.(ico|png|jpg|jpeg|gif|svg|css|js|webp|mp4|m4v|webm|mov|woff2?|ttf|otf|map|txt|xml|webmanifest)$/.test(
      pathname
    )
  ) {
    return null;
  }

  if (!pathname.startsWith('/api')) {
    return RATE_LIMITS.site;
  }

  if (
    /^\/api\/verify\/[^/]+$/.test(pathname) ||
    /^\/api\/verify\/custom\/[^/]+$/.test(pathname) ||
    /^\/api\/feedback\/token\/[^/]+$/.test(pathname) ||
    /^\/api\/candidate-invites\/[^/]+(?:\/claim|\/proof-card)?$/.test(pathname)
  ) {
    return RATE_LIMITS.publicToken;
  }

  if (pathname.startsWith('/api/verification/work-email/')) {
    return RATE_LIMITS.workEmail;
  }

  if (pathname.startsWith('/api/upload')) {
    return RATE_LIMITS.upload;
  }

  if (pathname === '/api/csrf-token') {
    return RATE_LIMITS.csrf;
  }

  if (
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/user/email' ||
    pathname === '/api/user/password' ||
    pathname === '/api/user/account'
  ) {
    return RATE_LIMITS.auth;
  }

  if (
    /^\/api\/conversations\/[^/]+\/reveal$/.test(pathname) ||
    (pathname === '/api/conversations' && isMutatingMethod(method)) ||
    /^\/api\/conversations\/[^/]+\/messages$/.test(pathname)
  ) {
    return RATE_LIMITS.revealIntro;
  }

  if (
    pathname.startsWith('/api/verification/requests') ||
    pathname === '/api/verification/status'
  ) {
    return RATE_LIMITS.verification;
  }

  if (pathname.startsWith('/api/expertise/cv-import/') || pathname.startsWith('/api/ai/')) {
    return RATE_LIMITS.aiAssistive;
  }

  if (
    pathname === '/api/matching-profile' ||
    pathname.startsWith('/api/match/') ||
    pathname.startsWith('/api/matches/')
  ) {
    return RATE_LIMITS.matching;
  }

  if (pathname.startsWith('/api/portfolio/public/') || pathname.startsWith('/api/portfolio/org/')) {
    return RATE_LIMITS.public;
  }

  if (isMutatingMethod(method)) {
    return RATE_LIMITS.apiMutation;
  }

  return RATE_LIMITS.api;
}

/**
 * Create rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
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
