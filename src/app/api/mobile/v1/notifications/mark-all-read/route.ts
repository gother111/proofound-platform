import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

/**
 * POST /api/mobile/v1/notifications/mark-all-read
 *
 * Mark all notifications as read for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const updated = await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, auth.user.id), eq(notifications.read, false)))
      .returning({ id: notifications.id });

    return mobileSuccess({ updatedCount: updated.length });
  } catch (error) {
    console.error('[mobile.notifications.markAllRead.post] failed', error);
    return mobileError('internal_error', 'Failed to mark all notifications as read', 500);
  }
}
