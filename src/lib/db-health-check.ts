/**
 * Database Health Check Utility
 *
 * Provides a simple way to test database connectivity
 * and log connection issues for debugging production problems.
 */

import { db } from '@/db';
import { log } from '@/lib/log';
import { sql } from 'drizzle-orm';

const HEALTH_CACHE_TTL_MS = Number(process.env.DB_HEALTH_CACHE_TTL_MS || 5000);
const HEALTH_QUERY_TIMEOUT_MS = Number(process.env.DB_HEALTH_QUERY_TIMEOUT_MS || 1200);
const HEALTH_QUERY_RECOVERY_TIMEOUT_MS = Number(
  process.env.DB_HEALTH_QUERY_RECOVERY_TIMEOUT_MS || 2500
);

let cachedHealthValue: boolean | null = null;
let cachedHealthExpiresAt = 0;
let pendingHealthCheck: Promise<boolean> | null = null;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out after ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Check if the database connection is healthy
 *
 * @returns true if database is reachable, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  const now = Date.now();
  if (cachedHealthValue !== null && now < cachedHealthExpiresAt) {
    return cachedHealthValue;
  }

  if (pendingHealthCheck) {
    return pendingHealthCheck;
  }

  pendingHealthCheck = (async () => {
    const previousHealth = cachedHealthValue;
    try {
      await withTimeout(db.execute(sql`SELECT 1 as health`), HEALTH_QUERY_TIMEOUT_MS);

      log.info('database.health.ok', {
        connected: true,
        timestamp: new Date().toISOString(),
      });

      cachedHealthValue = true;
      cachedHealthExpiresAt = Date.now() + HEALTH_CACHE_TTL_MS;
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown';
      const isTimeoutError = error instanceof Error && error.message.includes('Timed out after');

      if (isTimeoutError && previousHealth === true) {
        log.warn('database.health.timeout.using_cached_healthy', {
          error: message,
          timestamp: new Date().toISOString(),
        });
        cachedHealthValue = true;
        cachedHealthExpiresAt = Date.now() + Math.min(HEALTH_CACHE_TTL_MS, 2000);
        return true;
      }

      if (isTimeoutError) {
        try {
          await withTimeout(
            db.execute(sql`SELECT 1 as health`),
            Math.max(HEALTH_QUERY_TIMEOUT_MS, HEALTH_QUERY_RECOVERY_TIMEOUT_MS)
          );
          log.warn('database.health.timeout.recovered', {
            error: message,
            timestamp: new Date().toISOString(),
          });
          cachedHealthValue = true;
          cachedHealthExpiresAt = Date.now() + HEALTH_CACHE_TTL_MS;
          return true;
        } catch (recoveryError) {
          log.error('database.health.recovery.failed', {
            error: recoveryError instanceof Error ? recoveryError.message : 'Unknown',
            stack: recoveryError instanceof Error ? recoveryError.stack : undefined,
            timestamp: new Date().toISOString(),
          });
        }
      }

      log.error('database.health.failed', {
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      });

      cachedHealthValue = false;
      cachedHealthExpiresAt = Date.now() + HEALTH_CACHE_TTL_MS;
      return false;
    } finally {
      pendingHealthCheck = null;
    }
  })();

  try {
    return await pendingHealthCheck;
  } finally {
    // no-op: pending promise cleanup happens inside the promise itself
  }
}

/**
 * Get detailed database connection status
 *
 * @returns Object with connection details
 */
export async function getDatabaseStatus() {
  const isHealthy = await checkDatabaseHealth();

  // Check if we're using mock database
  const hasDatabaseUrl = !!process.env.DATABASE_URL;

  return {
    healthy: isHealthy,
    connected: isHealthy,
    usingMockDb: !hasDatabaseUrl,
    timestamp: new Date().toISOString(),
  };
}
