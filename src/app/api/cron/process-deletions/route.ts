import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * Legacy cron endpoint retained for backwards compatibility.
 * Account deletion is immediate and no scheduled deletion processing is required.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn('cron.process_deletions.unauthorized', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    processed: 0,
    mode: 'immediate_deletion_enabled',
    message: 'Scheduled deletion processing is disabled because account deletion is immediate.',
  });
}
