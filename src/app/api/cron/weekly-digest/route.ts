import { NextRequest, NextResponse } from 'next/server';

import { processWeeklyDigests } from '@/lib/notifications/weekly-digest';
import { log } from '@/lib/log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      log.warn('weekly-digest.cron.unauthorized', {
        authHeader: authHeader ? 'present' : 'missing',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const force = request.nextUrl.searchParams.get('force') === 'true';
    const result = await processWeeklyDigests(force);

    log.info('weekly-digest.cron.complete', {
      processed: result.processed,
      emailed: result.emailed,
      createdInApp: result.createdInApp,
      skipped: result.skipped,
      errors: result.errors.length,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    log.error('weekly-digest.cron.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Weekly digest cron failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
