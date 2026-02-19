import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';
import { generateFairnessNote } from '@/lib/analytics/fairness-note-generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Vercel Cron Job: Fairness note generation + account-deletion workflow guard.
 *
 * Account deletion is now immediate in /api/user/account, so scheduled reminder/deletion
 * processing is intentionally disabled.
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

    const reminderResults: Array<Record<string, unknown>> = [];
    const deletionResults: Array<Record<string, unknown>> = [];

    log.info('cron.account_deletion_workflow.deletion_model_immediate', {
      message:
        'Scheduled reminder/deletion processing skipped because account deletion is immediate.',
    });

    let fairnessNoteId: string | null = null;
    let fairnessNoteStatus: 'success' | 'error' = 'success';

    try {
      const releaseVersion = now.toISOString().split('T')[0];
      fairnessNoteId = await generateFairnessNote(releaseVersion, 'system');

      log.info('cron.account_deletion_workflow.fairness_note_generated', {
        noteId: fairnessNoteId,
        releaseVersion,
      });
    } catch (error) {
      fairnessNoteStatus = 'error';
      log.error('cron.account_deletion_workflow.fairness_note_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      reminders: {
        processed: 0,
        results: reminderResults,
      },
      deletions: {
        processed: 0,
        results: deletionResults,
        mode: 'immediate',
      },
      fairnessNote: {
        status: fairnessNoteStatus,
        noteId: fairnessNoteId,
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
