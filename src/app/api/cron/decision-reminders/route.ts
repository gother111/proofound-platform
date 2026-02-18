/**
 * Decision Reminders + Performance Health Check Cron Job
 *
 * Schedule: Daily at 10:00 AM UTC
 *
 * This job performs two tasks in sequence:
 * 1. Process decision reminders for pending interviews
 * 2. Run performance health check and alert if SLA breached (PRD Part 8, lines 1813-1817)
 *
 * Combined to optimize Vercel cron job usage (2 cron limit on current plan)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processDecisionReminders } from '@/lib/decisions/automation';
import { checkPerformanceHealth, sendPerformanceAlert } from '@/lib/analytics/health-check';
import { requireInternalApiRequest } from '@/lib/api/auth';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authFailure = requireInternalApiRequest(req);
    if (authFailure) {
      log.warn('decision.reminders.cron.unauthorized', {
        authHeader: req.headers.get('authorization') ? 'present' : 'missing',
        hasConfiguredSecret: Boolean(process.env.INTERNAL_API_SECRET || process.env.CRON_SECRET),
      });
      return authFailure;
    }

    // ========================================
    // STEP 1: Process Decision Reminders
    // ========================================

    log.info('decision.reminders.cron.start');

    const decisionResult = await processDecisionReminders();

    log.info('decision.reminders.cron.complete', decisionResult);

    // ========================================
    // STEP 2: Performance Health Check
    // ========================================

    log.info('performance.health_check.cron.start');

    let healthStatus = null;
    let healthCheckStatus = 'skipped';

    try {
      healthStatus = await checkPerformanceHealth();
      healthCheckStatus = healthStatus.healthy ? 'healthy' : 'unhealthy';

      // Send alert if unhealthy
      if (!healthStatus.healthy) {
        await sendPerformanceAlert(healthStatus);
        log.warn('performance.health_check.alert_sent', {
          breaches: healthStatus.breaches.length,
          metrics: healthStatus.metrics,
        });
      }

      log.info('performance.health_check.cron.complete', {
        status: healthCheckStatus,
        breaches: healthStatus.breaches.length,
      });
    } catch (error) {
      healthCheckStatus = 'error';
      log.error('performance.health_check.cron.failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Continue execution even if health check fails
    }

    // ========================================
    // Final Summary
    // ========================================

    return NextResponse.json({
      success: true,
      decisionReminders: decisionResult,
      performanceHealthCheck: {
        status: healthCheckStatus,
        healthy: healthStatus?.healthy ?? null,
        breaches: healthStatus?.breaches.length ?? 0,
        metrics: healthStatus?.metrics ?? null,
      },
    });
  } catch (error) {
    log.error('decision.reminders.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to process decision reminders' }, { status: 500 });
  }
}
