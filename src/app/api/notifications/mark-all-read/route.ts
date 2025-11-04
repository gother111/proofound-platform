import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/mark-all-read
 *
 * Mark all notifications as read for the current user
 */
export async function POST() {
  try {
    const user = await requireAuth();

    await db
      .update(notifications)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

    log.info('notifications.marked-all-read', {
      userId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('notifications.mark-all-read.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}
