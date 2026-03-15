import { and, desc, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
    const offset = Math.max(Number(searchParams.get('offset') || '0'), 0);
    const unreadOnly = searchParams.get('unread') === 'true';

    const where = unreadOnly
      ? and(eq(notifications.userId, auth.user.id), eq(notifications.read, false))
      : eq(notifications.userId, auth.user.id);

    const rows = await db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return mobileSuccess({
      items,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error('[mobile.notifications.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch notifications', 500);
  }
}
