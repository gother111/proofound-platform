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
import { checkPerformanceSLAs, sendAlertNotifications } from '@/lib/performance/alerting';
import { aggregateMetrics } from '@/lib/performance/api-monitor';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    console.error('Unauthorized cron job attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting performance check...');

    // Step 1: Aggregate raw metrics into percentile metrics
    await aggregateMetrics(1); // Last 1 hour

    // Step 2: Check metrics against SLAs
    const result = await checkPerformanceSLAs();

    console.log(
      `[Cron] Performance check complete: ${result.violations.length} violations, ${result.alertsCreated} new alerts`
    );

    // Step 3: Send notifications if there are critical or high severity violations
    const criticalOrHighViolations = result.violations.filter(
      (v) => v.severity === 'critical' || v.severity === 'high'
    );

    if (criticalOrHighViolations.length > 0) {
      await sendAlertNotifications(criticalOrHighViolations);
      console.log(
        `[Cron] Sent alert notifications for ${criticalOrHighViolations.length} critical/high violations`
      );
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
    console.error('[Cron] Performance check failed:', error);

    return NextResponse.json(
      {
        error: 'Performance check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
