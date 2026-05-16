/**
 * Conversation API - Get conversation details and request identity reveal
 *
 * GET - Fetch conversation with participant details
 * POST - Update conversation settings (read status, etc.)
 *
 * Reference: DATA_SECURITY_PRIVACY_ARCHITECTURE.md Section 10
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db, conversations, profiles } from '@/db';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{
    conversationId: string;
  }>;
}

/**
 * GET /api/conversations/[conversationId]
 *
 * Fetch conversation details with participant info
 *
 * Returns:
 * - Conversation metadata
 * - Participant profiles (based on stage)
 * - Reveal status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Fetch conversation with RLS protection
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user is a participant
    const isParticipant =
      conversation.participantOneId === user.id || conversation.participantTwoId === user.id;

    if (!isParticipant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Determine other participant
    const otherParticipantId =
      conversation.participantOneId === user.id
        ? conversation.participantTwoId
        : conversation.participantOneId;

    // Fetch participant profiles based on stage
    let otherParticipant = null;

    if (conversation.stage === 'revealed') {
      // Stage 2: Show full profile
      otherParticipant = await db.query.profiles.findFirst({
        where: eq(profiles.id, otherParticipantId),
        columns: {
          id: true,
          handle: true,
          displayName: true,
          avatarUrl: true,
          persona: true,
        },
      });
    } else {
      // Stage 1: Show masked handle only
      const maskedHandle =
        conversation.participantOneId === user.id
          ? conversation.maskedHandleTwo
          : conversation.maskedHandleOne;

      otherParticipant = {
        id: otherParticipantId,
        handle: null,
        displayName: maskedHandle,
        avatarUrl: null,
        persona: 'unknown' as const,
        masked: true,
      };
    }

    // Determine if current user can/has requested reveal
    const currentUserWantsReveal =
      conversation.participantOneId === user.id
        ? conversation.participantOneWantsReveal
        : conversation.participantTwoWantsReveal;

    const otherUserWantsReveal =
      conversation.participantOneId === user.id
        ? conversation.participantTwoWantsReveal
        : conversation.participantOneWantsReveal;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        matchId: conversation.matchId,
        stage: conversation.stage,
        revealedAt: conversation.revealedAt,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        currentUserWantsReveal,
        otherUserWantsReveal,
        canReveal: conversation.stage === 'masked', // Can only request reveal in Stage 1
      },
      otherParticipant,
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/conversations/[conversationId]
 *
 * Update conversation settings
 * (Currently unused - reserved for future features like muting, archiving)
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

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { action } = body as { action?: unknown };

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

    // Handle different actions
    switch (action) {
      case 'mark_read':
        // Mark all messages as read (handled by messages API)
        return NextResponse.json({ success: true, message: 'Marked as read' });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating conversation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
