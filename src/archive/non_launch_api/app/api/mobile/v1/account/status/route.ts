import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const [profile] = await db
      .select({
        id: profiles.id,
        deleted: profiles.deleted,
        deletionRequestedAt: profiles.deletionRequestedAt,
        deletionScheduledFor: profiles.deletionScheduledFor,
      })
      .from(profiles)
      .where(eq(profiles.id, auth.user.id))
      .limit(1);

    if (!profile) {
      return mobileError('not_found', 'Profile not found', 404);
    }

    return mobileSuccess({
      accountStatus: profile.deleted ? 'deleted' : 'active',
      deletionRequestedAt: profile.deletionRequestedAt?.toISOString() ?? null,
      deletionScheduledFor: profile.deletionScheduledFor?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[mobile.account.status.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch account status', 500);
  }
}
