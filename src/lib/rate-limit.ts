/**
 * Rate Limiting Utilities
 *
 * Provides rate limiting for various API endpoints to prevent abuse.
 * Verification requests: 5/hour, 20/day per user
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 11
 */

import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { detectRateLimitExceeded } from '@/lib/security/incident-detection';
import { CAPABILITY_TOKEN_CLASSES, inspectCapabilityToken } from '@/lib/security/capability-tokens';
import { getRows } from '@/lib/db/rows';

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  verification: {
    hourly: 5,
    daily: 20,
  },
  dataExport: {
    hourly: 3,
    daily: 10,
  },
  messages: {
    perMinute: 10,
    perHour: 100,
  },
} as const;

/**
 * Check if user has exceeded verification rate limit
 *
 * Limits:
 * - 5 requests per hour
 * - 20 requests per 24 hours
 *
 * @param userId - User ID to check
 * @returns Object with allowed status and remaining counts
 */
export async function checkVerificationRateLimit(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  hourlyCount: number;
  hourlyLimit: number;
  hourlyRemaining: number;
  dailyCount: number;
  dailyLimit: number;
  dailyRemaining: number;
}> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const hourlyCount = await countRecentCanonicalVerificationRequests(userId, oneHourAgo);
    const hourlyLimit = RATE_LIMITS.verification.hourly;
    const hourlyRemaining = Math.max(0, hourlyLimit - hourlyCount);

    // Check hourly limit
    if (hourlyCount >= hourlyLimit) {
      detectRateLimitExceeded(userId, '/api/verification', hourlyCount, hourlyLimit);

      return {
        allowed: false,
        reason: `Rate limit exceeded: ${hourlyLimit} verification requests per hour. Try again later.`,
        hourlyCount,
        hourlyLimit,
        hourlyRemaining: 0,
        dailyCount: hourlyCount,
        dailyLimit: RATE_LIMITS.verification.daily,
        dailyRemaining: 0,
      };
    }

    const dailyCount = await countRecentCanonicalVerificationRequests(userId, oneDayAgo);
    const dailyLimit = RATE_LIMITS.verification.daily;
    const dailyRemaining = Math.max(0, dailyLimit - dailyCount);

    // Check daily limit
    if (dailyCount >= dailyLimit) {
      detectRateLimitExceeded(userId, '/api/verification', dailyCount, dailyLimit);

      return {
        allowed: false,
        reason: `Rate limit exceeded: ${dailyLimit} verification requests per 24 hours. Try again tomorrow.`,
        hourlyCount,
        hourlyLimit,
        hourlyRemaining,
        dailyCount,
        dailyLimit,
        dailyRemaining: 0,
      };
    }

    // Within limits
    return {
      allowed: true,
      hourlyCount,
      hourlyLimit,
      hourlyRemaining,
      dailyCount,
      dailyLimit,
      dailyRemaining,
    };
  } catch (error) {
    log.error('rate_limit.check_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
    });

    // Fail closed - deny if error checking limits
    return {
      allowed: false,
      reason: 'Unable to verify rate limit. Please try again later.',
      hourlyCount: 0,
      hourlyLimit: RATE_LIMITS.verification.hourly,
      hourlyRemaining: 0,
      dailyCount: 0,
      dailyLimit: RATE_LIMITS.verification.daily,
      dailyRemaining: 0,
    };
  }
}

async function countRecentCanonicalVerificationRequests(
  userId: string,
  createdAfter: Date
): Promise<number> {
  const result = await db.execute(sql`
    SELECT COUNT(DISTINCT COALESCE(source_request_id::text, id::text)) AS request_count
    FROM verification_records
    WHERE owner_type = 'individual_profile'
      AND owner_id = ${userId}::uuid
      AND created_at >= ${createdAfter.toISOString()}::timestamptz
      AND metadata->>'requestTransport' IN (
        'skill_verification_request',
        'impact_verification_request',
        'custom_verification_bundle'
      )
  `);

  const row = getRows(result)[0] as { request_count?: number | string } | undefined;
  const count = Number(row?.request_count ?? 0);
  return Number.isFinite(count) ? count : 0;
}

/**
 * Generate unique verification token
 *
 * Format: base64url(random 32 bytes) for URL safety
 *
 * @returns URL-safe token string
 */
export function generateVerificationToken(): string {
  // Generate 32 random bytes
  const buffer = new Uint8Array(32);
  crypto.getRandomValues(buffer);

  // Convert to base64url (URL-safe)
  const base64 = Buffer.from(buffer).toString('base64');
  const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  return base64url;
}

/**
 * Calculate token expiration date (14 days from now)
 *
 * @returns Date object 14 days in the future
 */
export function getTokenExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14); // 14 days
  return expiryDate;
}

/**
 * Check if verification token is valid
 *
 * @param token - Token to validate
 * @returns Object with validation status
 */
export async function validateVerificationToken(token: string): Promise<{
  valid: boolean;
  reason?: string;
  request?: any;
}> {
  try {
    const tokenClasses = [
      CAPABILITY_TOKEN_CLASSES.SKILL_VERIFICATION_RESPONSE,
      CAPABILITY_TOKEN_CLASSES.IMPACT_VERIFICATION_RESPONSE,
      CAPABILITY_TOKEN_CLASSES.CUSTOM_VERIFICATION_RESPONSE,
    ] as const;

    for (const tokenClass of tokenClasses) {
      const lookup = await inspectCapabilityToken(token, {
        tokenClass,
        metadata: { surface: 'legacy_rate_limit.validate_token' },
      });

      if (!lookup.ok) {
        if (lookup.reason === 'invalid') {
          continue;
        }

        return {
          valid: false,
          reason:
            lookup.reason === 'expired'
              ? 'Verification token has expired'
              : 'Verification request is no longer available',
        };
      }

      return {
        valid: true,
        request: {
          sourceId: lookup.token.source_id || null,
          tokenClass,
        },
      };
    }

    return {
      valid: false,
      reason: 'Invalid verification token',
    };
  } catch (error) {
    log.error('token_validation.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      valid: false,
      reason: 'Unable to validate token',
    };
  }
}

/**
 * Simple in-memory rate limiter for high-frequency endpoints
 * Uses sliding window algorithm
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if request is allowed
   *
   * @param key - Unique identifier (userId + endpoint)
   * @param limit - Max requests
   * @param windowMs - Time window in milliseconds
   * @returns True if allowed
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Remove old timestamps outside window
    const validTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    if (validTimestamps.length >= limit) {
      return false;
    }

    // Add current timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return true;
  }

  /**
   * Clear old entries (run periodically to prevent memory leaks)
   */
  cleanup(olderThanMs: number = 3600000): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter((ts) => now - ts < olderThanMs);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

// Global rate limiter instance for message sending
export const messageRateLimiter = new InMemoryRateLimiter();

// Cleanup old entries every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    messageRateLimiter.cleanup();
  }, 3600000); // 1 hour
}

/**
 * Check message sending rate limit
 *
 * @param userId - User ID
 * @returns Object with allowed status
 */
export function checkMessageRateLimit(userId: string): {
  allowed: boolean;
  reason?: string;
} {
  const perMinuteKey = `${userId}:messages:minute`;
  const perHourKey = `${userId}:messages:hour`;

  // Check per-minute limit (10 messages)
  const allowedPerMinute = messageRateLimiter.check(
    perMinuteKey,
    RATE_LIMITS.messages.perMinute,
    60 * 1000 // 1 minute
  );

  if (!allowedPerMinute) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: 10 messages per minute',
    };
  }

  // Check per-hour limit (100 messages)
  const allowedPerHour = messageRateLimiter.check(
    perHourKey,
    RATE_LIMITS.messages.perHour,
    60 * 60 * 1000 // 1 hour
  );

  if (!allowedPerHour) {
    return {
      allowed: false,
      reason: 'Rate limit exceeded: 100 messages per hour',
    };
  }

  return { allowed: true };
}

/**
 * Generic rate limit checker (for backwards compatibility)
 * Delegates to specific rate limit functions
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; reason?: string }> {
  // For verification requests, use checkVerificationRateLimit
  const result = await checkVerificationRateLimit(identifier);
  return {
    allowed: result.allowed,
    reason: result.reason,
  };
}

/**
 * Get rate limit identifier from request
 * Uses user ID if available, otherwise IP address
 */
export function getRateLimitIdentifier(userId?: string, ipAddress?: string): string {
  return userId || ipAddress || 'anonymous';
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(limit: number, remaining: number, resetAt?: Date) {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': resetAt ? Math.floor(resetAt.getTime() / 1000).toString() : '',
  };
}
