import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/mobile/v1/notifications/:id/read
 *
 * Mark a notification as read.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const { id } = await params;
    const parsedId = z.string().uuid().safeParse(id);
    if (!parsedId.success) {
      return mobileError('validation_error', 'Invalid notification id', 400);
    }

    const updated = await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, parsedId.data), eq(notifications.userId, auth.user.id)))
      .returning({ id: notifications.id });

    if (updated.length === 0) {
      return mobileError('not_found', 'Notification not found', 404);
    }

    return mobileSuccess({ id: updated[0].id, read: true });
  } catch (error) {
    console.error('[mobile.notifications.read.patch] failed', error);
    return mobileError('internal_error', 'Failed to mark notification as read', 500);
  }
}
