/**
 * Cron Job: Performance SLA Checking
 *
 * Runs: Every hour
 * Purpose: Check performance metrics against SLAs and send alerts
 *
 * Configure in Vercel:
 * - Cron schedule: 0 * * * * (Every hour at :00)
 * - Path: /api/cron/performance-check
 * - Add CRON_SECRET to environment variables
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { log } from '@/lib/log';
import { checkPerformanceSLAs, sendAlertNotifications } from '@/lib/performance/alerting';
import { aggregateMetrics } from '@/lib/performance/api-monitor';

export async function GET(request: NextRequest) {
  const unauthorized = requireInternalOpsRequest(request);
  if (unauthorized) {
    log.warn('cron.performance-check.unauthorized');
    return unauthorized;
  }

  try {
    log.info('cron.performance-check.start');

    // Step 1: Aggregate raw metrics into percentile metrics
    await aggregateMetrics(1); // Last 1 hour

    // Step 2: Check metrics against SLAs
    const result = await checkPerformanceSLAs();

    log.info('cron.performance-check.complete', {
      violations: result.violations.length,
      alertsCreated: result.alertsCreated,
    });

    // Step 3: Send notifications if there are critical or high severity violations
    const criticalOrHighViolations = result.violations.filter(
      (v) => v.severity === 'critical' || v.severity === 'high'
    );

    if (criticalOrHighViolations.length > 0) {
      await sendAlertNotifications(criticalOrHighViolations);
      log.info('cron.performance-check.notifications_sent', {
        violations: criticalOrHighViolations.length,
      });
    }

    return NextResponse.json({
      success: true,
      metricsAggregated: true,
      violations: result.violations.length,
      alertsCreated: result.alertsCreated,
      notificationsSent: criticalOrHighViolations.length > 0,
      message: `Checked performance SLAs: ${result.violations.length} violations found, ${result.alertsCreated} new alerts created`,
    });
  } catch (error) {
    log.error('cron.performance-check.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Performance check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
