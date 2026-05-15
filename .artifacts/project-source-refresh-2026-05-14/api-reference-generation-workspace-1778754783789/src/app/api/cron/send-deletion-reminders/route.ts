import { archivedCronResponse } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';

/**
 * Legacy cron endpoint retained for backwards compatibility.
 * Account deletion is immediate, so grace-period reminders are not sent.
 */
export async function GET() {
  return archivedCronResponse(
    'Deletion reminder processing is retired because account deletion is immediate in the locked launch MVP.'
  );
}
