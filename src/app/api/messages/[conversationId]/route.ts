import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

/**
 * GET /api/messages/[conversationId]
 *
 * Fetches messages for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
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

    const { conversationId } = params;

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(
        `individual_id.eq.${user.id},org_id.in.(select org_id from organization_members where user_id = '${user.id}')`
      )
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Cursor for pagination
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch messages
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('sent_at', before);
    } else if (offset > 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Reverse to show oldest first
    const orderedMessages = (messages || []).reverse();

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    log.info('messages.fetched', {
      userId: user.id,
      conversationId,
      messageCount: orderedMessages.length,
      unreadCount: unreadCount || 0,
    });

    return NextResponse.json({
      messages: orderedMessages,
      conversation: {
        id: conversation.id,
        stage: conversation.stage,
        status: conversation.status,
      },
      meta: {
        total: orderedMessages.length,
        unread: unreadCount || 0,
        hasMore: messages && messages.length === limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/messages/[conversationId]:', error);
    log.error('messages.fetch.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
