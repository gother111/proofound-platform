/**
 * Conversation Messages API
 *
 * GET - Fetch messages for a specific conversation
 * POST - Send a new message in a conversation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { messages, conversations, profiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const SendMessageSchema = z.object({
  content: z.string().min(1).max(2000, 'Message cannot exceed 2000 characters'),
});

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

/**
 * GET /api/conversations/[conversationId]/messages
 * Fetch messages for a specific conversation
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await context.params;

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

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch messages
    const conversationMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sentAt))
      .limit(limit)
      .offset(offset);

    // Get profiles for message senders if identities are revealed (stage 2)
    const enrichedMessages = await Promise.all(
      conversationMessages.map(async (message) => {
        let senderName = 'Unknown';
        
        // If conversation is in stage 2, fetch actual names
        if (conv.stage === 2) {
          const senderProfile = await db
            .select({ displayName: profiles.displayName })
            .from(profiles)
            .where(eq(profiles.id, message.senderId))
            .limit(1);
          
          senderName = senderProfile[0]?.displayName || 'Anonymous';
        } else {
          // Stage 1: Use masked identities
          const isParticipantOne = message.senderId === conv.participantOneId;
          senderName = isParticipantOne ? 'Party One' : 'Party Two';
        }

        return {
          ...message,
          senderName,
          isOwnMessage: message.senderId === user.id,
        };
      })
    );

    // Mark unread messages as read (messages sent by the other party)
    const unreadMessageIds = conversationMessages
      .filter((m) => m.senderId !== user.id && !m.readAt)
      .map((m) => m.id);

    if (unreadMessageIds.length > 0) {
      const otherPartyId =
        conv.participantOneId === user.id ? conv.participantTwoId : conv.participantOneId;
      
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.senderId, otherPartyId)
          )
        );
    }

    return NextResponse.json({
      messages: enrichedMessages,
      conversationStage: conv.stage,
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

/**
 * POST /api/conversations/[conversationId]/messages
 * Send a new message in a conversation
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Parse and validate request body
    const body = await request.json();
    const validation = SendMessageSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { content } = validation.data;

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

    // Check if conversation is active
    if (conv.status !== 'active') {
      return NextResponse.json(
        { error: 'This conversation is no longer active' },
        { status: 400 }
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

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Get sender info for response
    let senderName = 'You';
    if (conv.stage === 2) {
      const senderProfile = await db
        .select({ displayName: profiles.displayName })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
      
      senderName = senderProfile[0]?.displayName || 'You';
    }

    return NextResponse.json(
      {
        message: {
          ...newMessage[0],
          senderName,
          isOwnMessage: true,
        },
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

