import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * Legacy cron endpoint retained for backwards compatibility.
 * Account deletion is immediate, so grace-period reminders are not sent.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    log.warn('cron.send_deletion_reminders.unauthorized', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    processed: 0,
    mode: 'immediate_deletion_enabled',
    message: 'Deletion reminders are disabled because account deletion is immediate.',
  });
}
