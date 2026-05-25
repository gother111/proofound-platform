/**
 * Caching Utilities
 *
 * Provides a unified caching interface using Vercel KV (Redis)
 * with fallback to in-memory caching for development
 */

import { kv } from '@vercel/kv';
import { log } from '@/lib/log';

// In-memory cache for development (when KV is not available)
const memoryCache = new Map<string, { value: unknown; expires: number }>();

// Cache key prefixes for organization
export const CACHE_KEYS = {
  TAXONOMY: 'taxonomy:',
  PROFILE: 'profile:',
  ORGANIZATION: 'org:',
  ASSIGNMENT: 'assignment:',
  MATCH_RESULTS: 'match:',
  USER_SKILLS: 'skills:',
} as const;

// Cache TTL (time to live) in seconds
export const CACHE_TTL = {
  TAXONOMY: 24 * 60 * 60, // 24 hours (rarely changes)
  PROFILE: 5 * 60, // 5 minutes (changes occasionally)
  ORGANIZATION: 15 * 60, // 15 minutes
  ASSIGNMENT: 10 * 60, // 10 minutes
  MATCH_RESULTS: 2 * 60, // 2 minutes (frequently updated)
  USER_SKILLS: 10 * 60, // 10 minutes
} as const;

function cacheKeyFamily(key: string): string {
  const matchedPrefix = Object.values(CACHE_KEYS).find((prefix) => key.startsWith(prefix));
  return matchedPrefix ? matchedPrefix.replace(/:$/, '') : 'unknown';
}

function cacheErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Check if we're in a Vercel environment with KV configured
 */
function hasKVConfigured(): boolean {
  return Boolean(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN && process.env.NODE_ENV !== 'test'
  );
}

/**
 * Get a value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    if (hasKVConfigured()) {
      const value = await kv.get<T>(key);
      return value;
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(key);
      if (cached && cached.expires > Date.now()) {
        return cached.value as T;
      }
      // Clean up expired entry
      if (cached) {
        memoryCache.delete(key);
      }
      return null;
    }
  } catch (error) {
    log.error('cache.get_failed', {
      keyFamily: cacheKeyFamily(key),
      errorMessage: cacheErrorMessage(error),
    });
    return null;
  }
}

/**
 * Set a value in cache with TTL
 */
export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    if (hasKVConfigured()) {
      await kv.set(key, value, { ex: ttlSeconds });
    } else {
      // Fallback to memory cache
      memoryCache.set(key, {
        value,
        expires: Date.now() + ttlSeconds * 1000,
      });
    }
  } catch (error) {
    log.error('cache.set_failed', {
      keyFamily: cacheKeyFamily(key),
      errorMessage: cacheErrorMessage(error),
    });
  }
}

/**
 * Delete a value from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    if (hasKVConfigured()) {
      await kv.del(key);
    } else {
      memoryCache.delete(key);
    }
  } catch (error) {
    log.error('cache.delete_failed', {
      keyFamily: cacheKeyFamily(key),
      errorMessage: cacheErrorMessage(error),
    });
  }
}

/**
 * Delete multiple values matching a pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    if (hasKVConfigured()) {
      // Get all keys matching pattern
      const keys: string[] = [];
      let cursor: string | number = 0;

      do {
        const result: [string | number, string[]] = await kv.scan(cursor, {
          match: pattern,
          count: 100,
        });
        cursor = result[0];
        keys.push(...result[1]);
      } while (cursor !== 0 && cursor !== '0');

      // Delete all matching keys
      if (keys.length > 0) {
        await kv.del(...keys);
      }
    } else {
      // Fallback to memory cache
      const regex = new RegExp(pattern.replace('*', '.*'));
      const keysToDelete = Array.from(memoryCache.keys()).filter((key) => regex.test(key));
      keysToDelete.forEach((key) => memoryCache.delete(key));
    }
  } catch (error) {
    log.error('cache.pattern_delete_failed', {
      patternFamily: cacheKeyFamily(pattern.replace('*', '')),
      errorMessage: cacheErrorMessage(error),
    });
  }
}

/**
 * Get or set pattern - fetch from cache or compute if missing
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Not in cache, fetch the value
  const value = await fetcher();

  // Store in cache
  await setCached(key, value, ttlSeconds);

  return value;
}

/**
 * Cache taxonomy data
 */
export async function cacheTaxonomy(taxonomy: unknown): Promise<void> {
  await setCached(`${CACHE_KEYS.TAXONOMY}full`, taxonomy, CACHE_TTL.TAXONOMY);
}

/**
 * Get cached taxonomy
 */
export async function getCachedTaxonomy<T>(): Promise<T | null> {
  return getCached<T>(`${CACHE_KEYS.TAXONOMY}full`);
}

/**
 * Cache user profile
 */
export async function cacheProfile(userId: string, profile: unknown): Promise<void> {
  await setCached(`${CACHE_KEYS.PROFILE}${userId}`, profile, CACHE_TTL.PROFILE);
}

/**
 * Get cached profile
 */
export async function getCachedProfile<T>(userId: string): Promise<T | null> {
  return getCached<T>(`${CACHE_KEYS.PROFILE}${userId}`);
}

/**
 * Invalidate profile cache
 */
export async function invalidateProfile(userId: string): Promise<void> {
  await deleteCached(`${CACHE_KEYS.PROFILE}${userId}`);
  // Also invalidate user skills cache
  await deleteCached(`${CACHE_KEYS.USER_SKILLS}${userId}`);
}

/**
 * Cache organization data
 */
export async function cacheOrganization(orgId: string, org: unknown): Promise<void> {
  await setCached(`${CACHE_KEYS.ORGANIZATION}${orgId}`, org, CACHE_TTL.ORGANIZATION);
}

/**
 * Get cached organization
 */
export async function getCachedOrganization<T>(orgId: string): Promise<T | null> {
  return getCached<T>(`${CACHE_KEYS.ORGANIZATION}${orgId}`);
}

/**
 * Invalidate organization cache
 */
export async function invalidateOrganization(orgId: string): Promise<void> {
  await deleteCached(`${CACHE_KEYS.ORGANIZATION}${orgId}`);
}

/**
 * Cache match results
 */
export async function cacheMatchResults(assignmentId: string, results: unknown): Promise<void> {
  await setCached(`${CACHE_KEYS.MATCH_RESULTS}${assignmentId}`, results, CACHE_TTL.MATCH_RESULTS);
}

/**
 * Get cached match results
 */
export async function getCachedMatchResults<T>(assignmentId: string): Promise<T | null> {
  return getCached<T>(`${CACHE_KEYS.MATCH_RESULTS}${assignmentId}`);
}

/**
 * Invalidate match results
 */
export async function invalidateMatchResults(assignmentId: string): Promise<void> {
  await deleteCached(`${CACHE_KEYS.MATCH_RESULTS}${assignmentId}`);
}

/**
 * Clear all caches (use with caution!)
 */
export async function clearAllCaches(): Promise<void> {
  if (hasKVConfigured()) {
    log.warn('cache.clear_all_requested');
    await kv.flushdb();
  } else {
    memoryCache.clear();
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  size?: number;
  keys?: number;
}> {
  if (hasKVConfigured()) {
    // Vercel KV REST does not expose DB-wide key counts; report backend type only.
    return { type: 'redis' };
  } else {
    return {
      type: 'memory',
      size: memoryCache.size,
      keys: memoryCache.size,
    };
  }
}
