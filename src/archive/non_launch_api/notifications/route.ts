import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { notifications } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const CreateNotificationSchema = z.object({
  type: z.enum([
    'match_suggested',
    'intro_accepted',
    'message_received',
    'verification_requested',
    'verification_completed',
    'assignment_published',
    'interview_scheduled',
    'contract_signed',
    'weekly_digest',
  ]),
  title: z.string().min(1),
  message: z.string().min(1),
  actionUrl: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * GET /api/notifications
 *
 * Get user's notifications with pagination
 * Query params:
 * - limit: Number of items to return (default: 20, max: 50)
 * - offset: Number of items to skip (default: 0)
 * - unread: Filter unread only (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const searchParams = request.nextUrl.searchParams;

    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unread') === 'true';

    // Build query
    let query = db.select().from(notifications).where(eq(notifications.userId, user.id)).$dynamic();

    // Filter by read status if requested
    if (unreadOnly) {
      query = query.where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    }

    // Fetch notifications with pagination
    const userNotifications = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit + 1)
      .offset(offset);

    // Check if there are more results
    const hasMore = userNotifications.length > limit;
    const notificationsToReturn = hasMore ? userNotifications.slice(0, limit) : userNotifications;

    return NextResponse.json({
      items: notificationsToReturn,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    log.error('notifications.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 *
 * Create a new notification for a user
 * (Typically called by internal services, not directly by users)
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    const validatedData = CreateNotificationSchema.parse(body);

    const [notification] = await db
      .insert(notifications)
      .values({
        userId: user.id,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        actionUrl: validatedData.actionUrl,
        entityType: validatedData.entityType,
        entityId: validatedData.entityId,
        metadata: validatedData.metadata || {},
      })
      .returning();

    log.info('notification.created', {
      notificationId: notification.id,
      userId: user.id,
      type: notification.type,
    });

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('notification.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: 'Invalid notification data', details: error.errors },
        { status: 400 }
      );
    }

    log.error('notification.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
