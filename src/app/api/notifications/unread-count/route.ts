import { NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
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
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    try {
      const result = await db
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

      const unreadCount = result[0]?.count || 0;

      return NextResponse.json({ count: unreadCount });
    } catch (dbError) {
      // If database query fails, return 0 instead of erroring
      log.error('notifications.unread-count.db-failed', {
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
      });
      return NextResponse.json({ count: 0 });
    }
  } catch (error) {
    log.error('notifications.unread-count.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return 0 instead of erroring to prevent UI crashes
    return NextResponse.json({ count: 0 });
  }
}
