import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Legacy compatibility endpoint for the retired account-deletion cron workflow.
 *
 * Account deletion is immediate in /api/user/account, so scheduled reminder/deletion
 * processing is intentionally disabled and fairness-note generation is owned by
 * /api/cron/fairness-note.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      log.error('cron.account_deletion_workflow.misconfigured', {
        message: 'CRON_SECRET is missing. Refusing to run cron job.',
      });
      return NextResponse.json({ error: 'Cron misconfigured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      log.warn('cron.account_deletion_workflow.unauthorized', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    log.info('cron.account_deletion_workflow.started', {
      timestamp: now.toISOString(),
    });

    log.info('cron.account_deletion_workflow.deletion_model_immediate', {
      message:
        'Scheduled reminder/deletion processing skipped because account deletion is immediate and fairness-note generation moved to /api/cron/fairness-note.',
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      mode: 'legacy_noop',
      message:
        'Account deletion is immediate. This endpoint remains for compatibility only and no longer generates fairness notes.',
      reminders: {
        processed: 0,
        results: [],
      },
      deletions: {
        processed: 0,
        results: [],
        mode: 'immediate',
      },
    });
  } catch (error) {
    log.error('cron.account_deletion_workflow.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Account deletion workflow failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
