/**
 * Conversations API
 *
 * GET - List user's conversations with last message and unread count
 * POST - Create a new conversation (after mutual interest)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { conversations, messages, profiles, assignments, matches } from '@/db/schema';
import { eq, or, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { log } from '@/lib/log';

// Schema for creating a conversation
const CreateConversationSchema = z.object({
  matchId: z.string().uuid(),
  assignmentId: z.string().uuid(),
  participantOneId: z.string().uuid(), // Individual
  participantTwoId: z.string().uuid(), // Org representative
});

type ConversationRow = typeof conversations.$inferSelect;

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
      conversationsToReturn.map(async (conv: ConversationRow) => {
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
            id: otherPartyId,
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
 * - assignmentId: The assignment being discussed
 * - participantOneId: First participant (typically the individual)
 * - participantTwoId: Second participant (typically the org representative)
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
    const body = await request.json();
    const validation = CreateConversationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { matchId, assignmentId, participantOneId, participantTwoId } = validation.data;

    // Verify user is one of the participants
    if (user.id !== participantOneId && user.id !== participantTwoId) {
      return NextResponse.json(
        { error: 'You must be a participant to create a conversation' },
        { status: 403 }
      );
    }

    // Check if conversation already exists for this match
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(eq(conversations.matchId, matchId))
      .limit(1);

    if (existingConversation.length > 0) {
      // Return existing conversation instead of creating duplicate
      log.info('conversation.already_exists', {
        matchId,
        conversationId: existingConversation[0].id,
      });
      return NextResponse.json({
        conversation: existingConversation[0],
        created: false,
      });
    }

    // Verify match exists
    const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);

    if (!match.length) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get participant profiles to generate masked handles
    const [participantOne, participantTwo] = await Promise.all([
      db
        .select({ persona: profiles.persona })
        .from(profiles)
        .where(eq(profiles.id, participantOneId))
        .limit(1),
      db
        .select({ persona: profiles.persona })
        .from(profiles)
        .where(eq(profiles.id, participantTwoId))
        .limit(1),
    ]);

    // Generate masked handles based on persona type
    // Format: "Candidate #ABC123" or "Organization Representative #XYZ789"
    const maskedHandleOne =
      participantOne[0]?.persona === 'individual'
        ? `Candidate #${nanoid(6).toUpperCase()}`
        : `Organization #${nanoid(6).toUpperCase()}`;

    const maskedHandleTwo =
      participantTwo[0]?.persona === 'individual'
        ? `Candidate #${nanoid(6).toUpperCase()}`
        : `Organization #${nanoid(6).toUpperCase()}`;

    // Create the conversation
    const [newConversation] = await db
      .insert(conversations)
      .values({
        matchId,
        assignmentId,
        participantOneId,
        participantTwoId,
        stage: 'masked', // Start with masked identities per PRD
        maskedHandleOne,
        maskedHandleTwo,
        lastMessageAt: new Date(),
      })
      .returning();

    log.info('conversation.created', {
      conversationId: newConversation.id,
      matchId,
      assignmentId,
      participantOneId,
      participantTwoId,
    });

    return NextResponse.json(
      {
        conversation: newConversation,
        created: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create conversation error:', error);
    log.error('conversation.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
