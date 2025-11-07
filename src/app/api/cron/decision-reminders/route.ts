/**
 * Decision Reminders Cron Job
 *
 * Runs every 6 hours to check for interviews awaiting decisions
 * Sends reminders at: 24h, 40h, 48h (deadline), 54h (overdue)
 */

import { NextRequest, NextResponse } from 'next/server';
import { processDecisionReminders } from '@/lib/decisions/automation';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.warn('decision.reminders.cron.unauthorized', {
        authHeader: authHeader ? 'present' : 'missing',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    log.info('decision.reminders.cron.start');

    const result = await processDecisionReminders();

    log.info('decision.reminders.cron.complete', result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    log.error('decision.reminders.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to process decision reminders' }, { status: 500 });
  }
}
