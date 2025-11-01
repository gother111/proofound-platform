/**
 * Messages API
 * 
 * Send text-only messages within conversations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { messages, conversations } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000, 'Message cannot exceed 2000 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = SendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { conversationId, content } = validation.data;

    // Verify conversation exists and user is a participant
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation.length) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conv = conversation[0];

    // Check if user is a participant
    const isParticipant =
      conv.participantOneId === user.id || conv.participantTwoId === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Insert message
    const newMessage = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        content,
      })
      .returning();

    // Update conversation's lastMessageAt and preview
    const preview = content.length > 100 ? content.substring(0, 100) + '...' : content;
    
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // TODO: Emit analytics event for message sent
    // TODO: Send real-time notification via Supabase Realtime

    return NextResponse.json(
      {
        message: newMessage[0],
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!conversationId) {
      return NextResponse.json(
        { error: 'conversationId is required' },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const conversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!conversation.length) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const conv = conversation[0];
    const isParticipant =
      conv.participantOneId === user.id || conv.participantTwoId === user.id;

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'You are not a participant in this conversation' },
        { status: 403 }
      );
    }

    // Fetch messages
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.sentAt)
      .limit(limit)
      .offset(offset);

    // Mark unread messages as read (messages sent by the other party)
    const unreadIds = conversationMessages
      .filter((m) => m.senderId !== user.id && !m.readAt)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.senderId, conv.participantOneId === user.id ? conv.participantTwoId : conv.participantOneId)
          )
        );
    }

    return NextResponse.json({
      messages: conversationMessages,
      hasMore: conversationMessages.length === limit,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
