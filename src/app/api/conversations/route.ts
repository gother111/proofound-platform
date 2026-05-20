/**
 * Conversations API
 *
 * GET - List user's conversations with last message and unread count
 * POST - Create a new conversation (after mutual interest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { conversations, messages, profiles, assignments } from '@/db/schema';
import { eq, or, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { log } from '@/lib/log';
import {
  buildVisualConversations,
  visualMessagingFixturesEnabled,
} from '@/lib/messaging/visual-fixtures';
import {
  ConversationAccessError,
  ensureConversationForMatch,
  resolveConversationParticipantsForMatch,
} from '@/lib/messaging/conversation-access';

import { getMatchingVisualState } from '@/lib/matching/visual-fixtures';

// Schema for creating a conversation
const CreateConversationSchema = z.object({
  matchId: z.string().uuid(),
});

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

    if (visualMessagingFixturesEnabled()) {
      const visualState = getMatchingVisualState(request?.nextUrl);
      return NextResponse.json({
        conversations: visualState === 'empty' ? [] : buildVisualConversations(user.id),
        hasMore: false,
        nextOffset: null,
      });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch user's conversations with pagination
    const userConversations = await db
      .select({
        id: conversations.id,
        matchId: conversations.matchId,
        assignmentId: conversations.assignmentId,
        participantOneId: conversations.participantOneId,
        participantTwoId: conversations.participantTwoId,
        stage: conversations.stage,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(eq(conversations.participantOneId, user.id), eq(conversations.participantTwoId, user.id))
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit + 1) // Fetch one extra to check if there are more
      .offset(offset);

    // Check if there are more results
    const hasMore = userConversations.length > limit;
    const conversationsToReturn = hasMore ? userConversations.slice(0, limit) : userConversations;

    // Enrich conversations with additional data
    const enrichedConversations = await Promise.all(
      conversationsToReturn.map(async (conv) => {
        // Determine the other party
        const otherPartyId =
          conv.participantOneId === user.id ? conv.participantTwoId : conv.participantOneId;

        // Fetch other party profile
        const otherPartyProfile = await db
          .select({
            id: profiles.id,
            displayName: profiles.displayName,
            persona: profiles.persona,
            avatarUrl: profiles.avatarUrl,
          })
          .from(profiles)
          .where(eq(profiles.id, otherPartyId))
          .limit(1);

        // Fetch last message
        const lastMessage = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.sentAt))
          .limit(1);

        // Count unread messages (sent by other party)
        const unreadCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conv.id),
              eq(messages.senderId, otherPartyId),
              sql`${messages.readAt} IS NULL`
            )
          );

        // Fetch assignment context
        const assignment = conv.assignmentId
          ? await db
              .select({ role: assignments.role })
              .from(assignments)
              .where(eq(assignments.id, conv.assignmentId))
              .limit(1)
          : [];

        // Determine display name based on stage
        let displayName = 'Unknown';
        let displayAvatar = null;

        if (otherPartyProfile.length > 0) {
          const profile = otherPartyProfile[0];
          if (conv.stage === 'revealed') {
            // Stage 2: Identity revealed
            displayName = profile.displayName || 'Anonymous';
            displayAvatar = profile.avatarUrl;
          } else {
            // Stage 1: Masked
            displayName = profile.persona === 'individual' ? 'Candidate' : 'Organization';
            displayAvatar = null; // Use generic avatar
          }
        }

        return {
          id: conv.id,
          matchId: conv.matchId,
          assignmentId: conv.assignmentId,
          assignmentRole: assignment[0]?.role || null,
          otherParty: {
            id: conv.stage === 'revealed' ? otherPartyId : null,
            displayName,
            displayAvatar,
            persona: otherPartyProfile[0]?.persona || 'individual',
          },
          stage: conv.stage,
          lastMessage: lastMessage[0] || null,
          unreadCount: unreadCount[0]?.count || 0,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      })
    );

    return NextResponse.json({
      conversations: enrichedConversations,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

/**
 * POST /api/conversations
 *
 * Create a new conversation after mutual interest is confirmed.
 * This is called from the interest API when both parties have expressed interest.
 *
 * Required fields:
 * - matchId: The match that triggered the conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const validation = CreateConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { matchId } = validation.data;
    const participantContext = await resolveConversationParticipantsForMatch(matchId);

    const callerIsCandidate = user.id === participantContext.candidateId;
    const callerIsResolvedOrgRep = user.id === participantContext.orgParticipantId;
    if (!callerIsCandidate && !callerIsResolvedOrgRep) {
      return NextResponse.json(
        { error: 'You must be a participant to create a conversation' },
        { status: 403 }
      );
    }

    const { conversation, created } = await ensureConversationForMatch(matchId, {
      preferredOrgUserId: callerIsResolvedOrgRep ? user.id : undefined,
    });

    log.info(created ? 'conversation.created' : 'conversation.already_exists', {
      conversationId: conversation.id,
      matchId,
      assignmentId: participantContext.assignmentId,
      participantOneId: conversation.participantOneId,
      participantTwoId: conversation.participantTwoId,
    });

    return NextResponse.json(
      {
        conversation,
        created,
      },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    if (error instanceof ConversationAccessError) {
      if (error.code === 'MATCH_NOT_FOUND') {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }

      return NextResponse.json(
        { error: 'No eligible organization representative is available for this match' },
        { status: 409 }
      );
    }

    console.error('Create conversation error:', error);
    log.error('conversation.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
