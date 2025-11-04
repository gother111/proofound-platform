import { NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';
import { getAllMetrics } from '@/lib/analytics/metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/health-check
 *
 * Comprehensive health check endpoint for production monitoring.
 * Checks database connectivity, critical metrics, and system health.
 *
 * This endpoint should be called by:
 * 1. Vercel Cron (every 5 minutes)
 * 2. Uptime monitoring service (BetterUptime, Pingdom, etc.)
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'unhealthy' | 'warning'; message?: string }> =
    {};

  try {
    // 1. Database connectivity check
    try {
      await db.execute(sql`SELECT 1`);
      checks.database = { status: 'healthy' };
    } catch (dbError) {
      checks.database = {
        status: 'unhealthy',
        message: dbError instanceof Error ? dbError.message : 'Database connection failed',
      };
      log.error('health.check.database.failed', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
    }

    // 2. Database query performance check
    try {
      const queryStart = Date.now();
      await db.select().from(profiles).limit(1);
      const queryDuration = Date.now() - queryStart;

      if (queryDuration > 1000) {
        checks.databasePerformance = {
          status: 'warning',
          message: `Slow query: ${queryDuration}ms`,
        };
      } else {
        checks.databasePerformance = { status: 'healthy' };
      }
    } catch (queryError) {
      checks.databasePerformance = {
        status: 'unhealthy',
        message: 'Query failed',
      };
    }

    // 3. Metrics calculation health check
    try {
      const metrics = await getAllMetrics();

      // Check TTSC (Time to Signed Contract)
      if (metrics.ttsc && metrics.ttsc.median > 35) {
        checks.ttsc = {
          status: 'warning',
          message: `TTSC median ${metrics.ttsc.median} days exceeds target of 30 days`,
        };

        log.warn('health.check.ttsc.exceeds.target', {
          median: metrics.ttsc.median,
          target: 30,
        });
      } else {
        checks.ttsc = { status: 'healthy' };
      }

      // Check TTFQI (Time to First Qualified Introduction)
      if (metrics.ttfqi && metrics.ttfqi.median > 96) {
        checks.ttfqi = {
          status: 'warning',
          message: `TTFQI median ${metrics.ttfqi.median} hours exceeds target of 72 hours`,
        };

        log.warn('health.check.ttfqi.exceeds.target', {
          median: metrics.ttfqi.median,
          target: 72,
        });
      } else {
        checks.ttfqi = { status: 'healthy' };
      }

      // Check PAC (Purpose-Alignment Contribution)
      if (metrics.pac) {
        if (metrics.pac.acceptanceLift < 15) {
          checks.pac_acceptance = {
            status: 'warning',
            message: `PAC acceptance lift ${metrics.pac.acceptanceLift.toFixed(1)}% below target of 20%`,
          };
        } else {
          checks.pac_acceptance = { status: 'healthy' };
        }

        if (metrics.pac.contractLift < 12) {
          checks.pac_contract = {
            status: 'warning',
            message: `PAC contract lift ${metrics.pac.contractLift.toFixed(1)}% below target of 15%`,
          };
        } else {
          checks.pac_contract = { status: 'healthy' };
        }
      }
    } catch (metricsError) {
      checks.metrics = {
        status: 'unhealthy',
        message: 'Metrics calculation failed',
      };
      log.error('health.check.metrics.failed', {
        error: metricsError instanceof Error ? metricsError.message : 'Unknown error',
      });
    }

    // 4. Overall health status
    const unhealthyChecks = Object.values(checks).filter((c) => c.status === 'unhealthy');
    const warningChecks = Object.values(checks).filter((c) => c.status === 'warning');

    const overallStatus =
      unhealthyChecks.length > 0 ? 'unhealthy' : warningChecks.length > 0 ? 'warning' : 'healthy';

    const duration = Date.now() - startTime;

    log.info('health.check.completed', {
      status: overallStatus,
      duration,
      unhealthyCount: unhealthyChecks.length,
      warningCount: warningChecks.length,
    });

    // Return appropriate status code
    const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        durationMs: duration,
        checks,
      },
      { status: statusCode }
    );
  } catch (error) {
    log.error('health.check.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
}
