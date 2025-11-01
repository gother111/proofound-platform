/**
 * Database Health Check Utility
 * 
 * Provides a simple way to test database connectivity
 * and log connection issues for debugging production problems.
 */

import { db } from '@/db';
import { log } from '@/lib/log';
import { sql } from 'drizzle-orm';

/**
 * Check if the database connection is healthy
 * 
 * @returns true if database is reachable, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Simple query to test connection
    const result = await db.execute(sql`SELECT 1 as health`);
    
    log.info('database.health.ok', { 
      connected: true,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (error) {
    log.error('database.health.failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    
    return false;
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

