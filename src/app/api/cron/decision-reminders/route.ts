/**
 * Decision Reminders + Performance Health Check Cron Job
 *
 * Schedule: Daily at 10:00 AM UTC
 *
 * This job performs launch-critical tasks in sequence:
 * 1. Process decision reminders for pending interviews
 * 2. Run performance health check and alert if SLA breached (PRD Part 8, lines 1813-1817)
 * 3. Dispatch low-frequency re-engagement work piggybacked on this cron slot
 *
 * Combined to optimize Vercel cron job usage (2 cron limit on current plan)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireInternalOpsRequest } from '@/lib/api/cron-auth';
import { processDecisionReminders } from '@/lib/decisions/automation';
import { checkPerformanceHealth, sendPerformanceAlert } from '@/lib/analytics/health-check';
import {
  getWeeklyDigestAvailability,
  processWeeklyDigests,
} from '@/lib/notifications/weekly-digest';
import { processVerificationRequestReminders } from '@/lib/verification/request-reminders';
import { log } from '@/lib/log';
import { sanitizeErrorForLog } from '@/lib/privacy/log-redaction';
import { processWorkflowAsyncJobs } from '@/lib/workflow/processor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const unauthorized = requireInternalOpsRequest(req);
    if (unauthorized) {
      log.warn('decision.reminders.cron.unauthorized', {
        authHeader: req.headers.get('authorization') ? 'present' : 'missing',
      });
      return unauthorized;
    }

    // ========================================
    // STEP 1: Process Decision Reminders
    // ========================================

    log.info('decision.reminders.cron.start');

    const decisionResult = await processDecisionReminders();

    log.info('decision.reminders.cron.complete', decisionResult);

    const workflowResult = await processWorkflowAsyncJobs(100);

    let verificationReminders: {
      status: 'success' | 'error';
      checked?: number;
      due?: number;
      sent?: number;
      skipped?: number;
      errors?: number;
      reason?: string;
    };

    try {
      const reminderResult = await processVerificationRequestReminders();
      verificationReminders = {
        status: 'success',
        checked: reminderResult.checked,
        due: reminderResult.due,
        sent: reminderResult.sent,
        skipped: reminderResult.skipped,
        errors: reminderResult.errors.length,
      };
    } catch (error) {
      log.error('verification_request_reminders.cron.failed', {
        error: sanitizeErrorForLog(error),
      });
      verificationReminders = {
        status: 'error',
        reason: 'Verification request reminder processing failed',
      };
    }

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
        error: sanitizeErrorForLog(error),
      });
      // Continue execution even if health check fails
    }

    // ========================================
    // Final Summary
    // ========================================

    // Weekly digest orchestration piggybacks on the daily cron to avoid extra Vercel cron slots.
    let weeklyDigest: {
      status: 'skipped' | 'success' | 'error';
      processed?: number;
      emailed?: number;
      createdInApp?: number;
      skipped?: number;
      errors?: number;
      reason?: string;
    } = { status: 'skipped', reason: 'Not scheduled today' };

    const digestAvailability = getWeeklyDigestAvailability();
    const isMondayUtc = new Date().getUTCDay() === 1;
    if (!digestAvailability.enabled) {
      weeklyDigest = { status: 'skipped', reason: digestAvailability.reason || 'Disabled' };
    } else if (!isMondayUtc) {
      weeklyDigest = { status: 'skipped', reason: 'Runs on Monday UTC only' };
    } else {
      try {
        const digestResult = await processWeeklyDigests(false);
        weeklyDigest = {
          status: 'success',
          processed: digestResult.processed,
          emailed: digestResult.emailed,
          createdInApp: digestResult.createdInApp,
          skipped: digestResult.skipped,
          errors: digestResult.errors.length,
        };
      } catch (error) {
        log.error('weekly_digest.cron.failed', {
          error: sanitizeErrorForLog(error),
        });
        weeklyDigest = {
          status: 'error',
          reason: 'Weekly digest processing failed',
        };
      }
    }

    return NextResponse.json({
      success: true,
      decisionReminders: decisionResult,
      workflowJobs: workflowResult,
      performanceHealthCheck: {
        status: healthCheckStatus,
        healthy: healthStatus?.healthy ?? null,
        breaches: healthStatus?.breaches.length ?? 0,
        metrics: healthStatus?.metrics ?? null,
      },
      verificationReminders,
      weeklyDigest,
    });
  } catch (error) {
    log.error('decision.reminders.cron.failed', {
      error: sanitizeErrorForLog(error),
    });
    return NextResponse.json({ error: 'Failed to process decision reminders' }, { status: 500 });
  }
}
