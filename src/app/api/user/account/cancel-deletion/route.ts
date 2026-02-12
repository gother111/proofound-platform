import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/account/cancel-deletion
 *
 * Deletion is immediate in the current model, so cancellation is not supported.
 */
export async function POST() {
  await requireAuth();

  return NextResponse.json(
    {
      error: 'Cancellation unavailable',
      message:
        'Account deletion is immediate and irreversible. There is no scheduled deletion state to cancel.',
    },
    { status: 410 }
  );
}
