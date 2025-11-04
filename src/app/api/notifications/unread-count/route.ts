import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/unread-count
 *
 * Get count of unread notifications for the current user
 */
export async function GET() {
  try {
    const user = await requireAuth();

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

    const unreadCount = result[0]?.count || 0;

    return NextResponse.json({ count: unreadCount });
  } catch (error) {
    log.error('notifications.unread-count.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to get unread count' },
      { status: 500 }
    );
  }
}
