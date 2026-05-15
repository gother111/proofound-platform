import { archivedCronResponse } from '@/lib/api/cron-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Legacy compatibility endpoint for the retired account-deletion cron workflow.
 *
 * Account deletion is immediate in /api/user/account, so scheduled reminder/deletion
 * processing is intentionally disabled in the locked launch MVP.
 */
export async function GET() {
  return archivedCronResponse(
    'Account deletion is immediate in the locked launch MVP; scheduled account-deletion workflow processing is retired.'
  );
}
