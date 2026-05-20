import { NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/account/cancel-deletion
 *
 * Legacy scheduled-deletion compatibility route archived outside the locked launch MVP.
 * Deletion is immediate in the current model, so cancellation is not supported.
 */
export async function POST() {
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(
    {
      error: 'Cancellation unavailable',
      message:
        'Account deletion is immediate and irreversible. There is no scheduled deletion state to cancel.',
    },
    { status: 410 }
  );
}
