/**
 * Messages API - Send and fetch messages in a conversation
 *
 * GET - Fetch paginated messages
 * POST - Send new message with PII detection
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, conversations, messages, profiles } from '@/db';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
import { detectPII, shouldBlockMessage } from '@/lib/privacy/pii-detection';
import { log } from '@/lib/log';

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
}

/**
 * GET /api/conversations/[conversationId]/messages
 *
 * Fetch paginated messages for a conversation
 *
 * Query params:
 * - limit: Number of messages (default: 50, max: 100)
 * - before: Message ID to fetch messages before (pagination)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const beforeId = searchParams.get('before');

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a participant
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant =
      conversation.participantOneId === user.id || conversation.participantTwoId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages with RLS protection
    let query = db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.sentAt))
      .limit(limit);

    // TODO: Add pagination with beforeId if needed

    const messageList = await query;

    // Fetch sender profiles
    const senderIds = [...new Set(messageList.map((m) => m.senderId))];
    const senderProfiles = await db
      .select({
        id: profiles.id,
        handle: profiles.handle,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(inArray(profiles.id, senderIds));

    const senderMap = new Map(senderProfiles.map((p) => [p.id, p]));

    // Format messages with sender info
    const formattedMessages = messageList.map((msg) => {
      const sender = senderMap.get(msg.senderId);
      let senderInfo;

      if (conversation.stage === 'revealed') {
        // Stage 2: Show full sender profile
        senderInfo = sender;
      } else {
        // Stage 1: Show masked handle
        const isSenderParticipantOne = msg.senderId === conversation.participantOneId;
        senderInfo = {
          id: msg.senderId,
          handle: null,
          displayName: isSenderParticipantOne
            ? conversation.maskedHandleOne
            : conversation.maskedHandleTwo,
          avatarUrl: null,
        };
      }

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        content: msg.content,
        sentAt: msg.sentAt,
        readAt: msg.readAt,
        status: msg.status,
        containsEmail: msg.containsEmail,
        containsPhone: msg.containsPhone,
        containsUrl: msg.containsUrl,
        sender: senderInfo,
        isOwnMessage: msg.senderId === user.id,
      };
    });

    return NextResponse.json({
      messages: formattedMessages.reverse(), // Oldest first for display
      hasMore: messageList.length === limit,
      conversationStage: conversation.stage,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/conversations/[conversationId]/messages
 *
 * Send a new message with PII detection
 *
 * Body:
 * - content: Message text (max 2000 chars)
 * - piiWarningShown: Boolean - user confirmed PII warning
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, piiWarningShown = false } = body;

    // Validate content
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    if (trimmedContent.length > 2000) {
      return NextResponse.json({ error: 'Message exceeds 2000 character limit' }, { status: 400 });
    }

    // Verify user is a participant
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const isParticipant =
      conversation.participantOneId === user.id || conversation.participantTwoId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Detect PII in message content
    const piiDetection = detectPII(trimmedContent);

    // Check if message should be blocked (Stage 1 only)
    const blockCheck = shouldBlockMessage(
      trimmedContent,
      conversation.stage || 'masked',
      piiWarningShown
    );

    if (blockCheck.shouldBlock && !piiWarningShown) {
      // Return warning to user
      return NextResponse.json(
        {
          error: 'PII_DETECTED',
          message: blockCheck.reason,
          detection: blockCheck.detection,
          requiresConfirmation: true,
        },
        { status: 400 }
      );
    }

    // Insert message
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.id,
        content: trimmedContent,
        containsEmail: piiDetection.containsEmail,
        containsPhone: piiDetection.containsPhone,
        containsUrl: piiDetection.containsUrl,
        piiWarningShown: piiWarningShown && piiDetection.hasPII,
        status: 'sent',
      })
      .returning();

    // Log message sent event (without content for privacy)
    log.info('message.sent', {
      messageId: newMessage.id,
      conversationId,
      userId: user.id,
      hasPII: piiDetection.hasPII,
      piiWarningShown,
      stage: conversation.stage,
    });

    // Return created message
    return NextResponse.json(
      {
        message: {
          id: newMessage.id,
          conversationId: newMessage.conversationId,
          content: newMessage.content,
          sentAt: newMessage.sentAt,
          readAt: newMessage.readAt,
          status: newMessage.status,
          containsEmail: newMessage.containsEmail,
          containsPhone: newMessage.containsPhone,
          containsUrl: newMessage.containsUrl,
          isOwnMessage: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    log.error('message.send_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      conversationId: (await params).conversationId,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
