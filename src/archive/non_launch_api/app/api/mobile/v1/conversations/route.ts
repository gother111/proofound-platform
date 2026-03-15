import { and, desc, eq, or, sql } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/db';
import { conversations, messages, profiles } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || '20'), 50);
    const offset = Math.max(Number(request.nextUrl.searchParams.get('offset') || '0'), 0);

    const rows = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.participantOneId, auth.user.id),
          eq(conversations.participantTwoId, auth.user.id)
        )
      )
      .orderBy(desc(conversations.lastMessageAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const enriched = await Promise.all(
      items.map(async (conversation) => {
        const otherPartyId =
          conversation.participantOneId === auth.user.id
            ? conversation.participantTwoId
            : conversation.participantOneId;

        const [[otherParty], [lastMessage], unreadRow] = await Promise.all([
          db
            .select({
              id: profiles.id,
              displayName: profiles.displayName,
              persona: profiles.persona,
              avatarUrl: profiles.avatarUrl,
            })
            .from(profiles)
            .where(eq(profiles.id, otherPartyId))
            .limit(1),
          db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversation.id))
            .orderBy(desc(messages.sentAt))
            .limit(1),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(messages)
            .where(
              and(
                eq(messages.conversationId, conversation.id),
                eq(messages.senderId, otherPartyId),
                sql`${messages.readAt} IS NULL`
              )
            ),
        ]);

        return {
          id: conversation.id,
          stage: conversation.stage,
          assignmentId: conversation.assignmentId,
          matchId: conversation.matchId,
          lastMessageAt: conversation.lastMessageAt,
          otherParty: {
            id: otherParty?.id ?? otherPartyId,
            displayName:
              conversation.stage === 'revealed'
                ? otherParty?.displayName || 'Unknown'
                : otherParty?.persona === 'org_member'
                  ? 'Organization'
                  : 'Candidate',
            avatarUrl: conversation.stage === 'revealed' ? (otherParty?.avatarUrl ?? null) : null,
            persona: otherParty?.persona ?? 'unknown',
          },
          lastMessage: lastMessage ?? null,
          unreadCount: unreadRow[0]?.count ?? 0,
        };
      })
    );

    return mobileSuccess({
      items: enriched,
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    console.error('[mobile.conversations.get] failed', error);
    return mobileError('internal_error', 'Failed to load conversations', 500);
  }
}
