import { archivedCronResponse } from '@/lib/api/cron-auth';

export const dynamic = 'force-dynamic';

/**
 * Legacy cron endpoint retained for backwards compatibility.
 * Account deletion is immediate and no scheduled deletion processing is required.
 */
export async function GET() {
  return archivedCronResponse(
    'Scheduled deletion processing is retired because account deletion is immediate in the locked launch MVP.'
  );
}
