/**
 * Conversations API
 * 
 * List user's conversations with last message and unread count
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { conversations, messages, profiles, assignments } from '@/db/schema';
import { eq, or, and, sql, desc } from 'drizzle-orm';

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

    // Fetch user's conversations
    const userConversations = await db
      .select({
        id: conversations.id,
        matchId: conversations.matchId,
        assignmentId: conversations.assignmentId,
        participantOneId: conversations.participantOneId,
        participantTwoId: conversations.participantTwoId,
        stage: conversations.stage,
        status: conversations.status,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.participantOneId, user.id),
          eq(conversations.participantTwoId, user.id)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // Enrich conversations with additional data
    const enrichedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        // Determine the other party
        const otherPartyId =
          conv.participantOneId === user.id
            ? conv.participantTwoId
            : conv.participantOneId;

        // Fetch other party profile
        const otherPartyProfile = await db
          .select({
            id: profiles.id,
            fullName: profiles.fullName,
            profileType: profiles.profileType,
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
          if (conv.stage === 2) {
            // Stage 2: Identity revealed
            displayName = profile.fullName || 'Anonymous';
            displayAvatar = profile.avatarUrl;
          } else {
            // Stage 1: Masked
            displayName =
              profile.profileType === 'individual'
                ? 'Candidate'
                : 'Organization';
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
            profileType: otherPartyProfile[0]?.profileType || 'individual',
          },
          stage: conv.stage,
          status: conv.status,
          lastMessage: lastMessage[0] || null,
          unreadCount: unreadCount[0]?.count || 0,
          lastMessageAt: conv.lastMessageAt,
          createdAt: conv.createdAt,
        };
      })
    );

    return NextResponse.json({
      conversations: enrichedConversations,
      total: enrichedConversations.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
