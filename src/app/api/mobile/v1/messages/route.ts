import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { conversations, messages, profiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';
import { notifyMessageReceived } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
});

async function getConversationForUser(conversationId: string, userId: string) {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) {
    return null;
  }

  const isParticipant =
    conversation.participantOneId === userId || conversation.participantTwoId === userId;

  return isParticipant ? conversation : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const conversationId = request.nextUrl.searchParams.get('conversationId');
    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '50'), 100);
    const offset = Math.max(Number(request.nextUrl.searchParams.get('offset') || '0'), 0);

    if (!conversationId) {
      return mobileError('validation_error', 'conversationId is required', 400);
    }

    const conversation = await getConversationForUser(conversationId, auth.user.id);
    if (!conversation) {
      return mobileError('forbidden', 'Conversation is not accessible', 403);
    }

    const items = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.sentAt)
      .limit(limit)
      .offset(offset);

    const unreadIds = items
      .filter((item) => item.senderId !== auth.user.id && !item.readAt)
      .map((item) => item.id);
    if (unreadIds.length > 0) {
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(
              messages.senderId,
              conversation.participantOneId === auth.user.id
                ? conversation.participantTwoId
                : conversation.participantOneId
            )
          )
        );
    }

    return mobileSuccess({
      items,
      hasMore: items.length === limit,
      nextOffset: items.length === limit ? offset + limit : null,
    });
  } catch (error) {
    console.error('[mobile.messages.get] failed', error);
    return mobileError('internal_error', 'Failed to load messages', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = SendMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid message payload',
        400,
        parsed.error.flatten()
      );
    }

    const conversation = await getConversationForUser(parsed.data.conversationId, auth.user.id);
    if (!conversation) {
      return mobileError('forbidden', 'Conversation is not accessible', 403);
    }

    const [created] = await db
      .insert(messages)
      .values({
        conversationId: parsed.data.conversationId,
        senderId: auth.user.id,
        content: parsed.data.content,
      })
      .returning();

    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, parsed.data.conversationId));

    const recipientId =
      conversation.participantOneId === auth.user.id
        ? conversation.participantTwoId
        : conversation.participantOneId;

    const [sender] = await db
      .select({
        displayName: profiles.displayName,
        handle: profiles.handle,
      })
      .from(profiles)
      .where(eq(profiles.id, auth.user.id))
      .limit(1);

    await notifyMessageReceived(
      recipientId,
      parsed.data.conversationId,
      sender?.displayName || sender?.handle || 'Someone',
      parsed.data.content
    );

    return mobileSuccess({ message: created }, 201);
  } catch (error) {
    console.error('[mobile.messages.post] failed', error);
    return mobileError('internal_error', 'Failed to send message', 500);
  }
}
