/**
 * Legacy Messages API adapter.
 *
 * Canonical endpoint: /api/conversations/[conversationId]/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GET as getCanonicalConversationMessages,
  POST as postCanonicalConversationMessage,
} from '@/app/api/conversations/[conversationId]/messages/route';
import { addDeprecationHeaders } from '@/lib/api/deprecation';

const DeprecatedMessagesPath = '/api/conversations/{conversationId}/messages';

const SendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000),
  piiWarningShown: z.boolean().optional(),
});

const ListMessagesSchema = z.object({
  conversationId: z.string().uuid(),
});

type CanonicalMessage = {
  id: string;
  conversationId?: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
  status?: string;
  containsEmail?: boolean;
  containsPhone?: boolean;
  containsUrl?: boolean;
  sender?: {
    id: string;
  } | null;
};

function toLegacyMessage(message: CanonicalMessage, conversationId: string) {
  return {
    id: message.id,
    conversationId: message.conversationId || conversationId,
    senderId: message.sender?.id,
    content: message.content,
    sentAt: message.sentAt,
    readAt: message.readAt || null,
    status: message.status || 'sent',
    containsEmail: !!message.containsEmail,
    containsPhone: !!message.containsPhone,
    containsUrl: !!message.containsUrl,
  };
}

export async function GET(request: NextRequest) {
  try {
    const parsed = ListMessagesSchema.safeParse({
      conversationId: request.nextUrl.searchParams.get('conversationId'),
    });

    if (!parsed.success) {
      return addDeprecationHeaders(
        NextResponse.json({ error: 'conversationId is required' }, { status: 400 }),
        DeprecatedMessagesPath
      );
    }

    const canonicalResponse = await getCanonicalConversationMessages(request, {
      params: Promise.resolve({ conversationId: parsed.data.conversationId }),
    });

    const payload = await canonicalResponse.json().catch(() => null);

    if (!canonicalResponse.ok) {
      return addDeprecationHeaders(
        NextResponse.json(payload || { error: 'Failed to fetch messages' }, {
          status: canonicalResponse.status,
        }),
        DeprecatedMessagesPath
      );
    }

    const canonicalMessages = ((payload as any)?.messages || []) as CanonicalMessage[];
    const legacyMessages = canonicalMessages.map((message) =>
      toLegacyMessage(message, parsed.data.conversationId)
    );

    return addDeprecationHeaders(
      NextResponse.json({
        messages: legacyMessages,
        hasMore: Boolean((payload as any)?.hasMore),
      }),
      DeprecatedMessagesPath
    );
  } catch (error) {
    console.error('Get messages adapter error:', error);
    return addDeprecationHeaders(
      NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 }),
      DeprecatedMessagesPath
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = SendMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return addDeprecationHeaders(
        NextResponse.json(
          { error: 'Invalid input', details: parsed.error.errors },
          { status: 400 }
        ),
        DeprecatedMessagesPath
      );
    }

    const canonicalRequest = new NextRequest(
      `${request.nextUrl.origin}/api/conversations/${parsed.data.conversationId}/messages`,
      {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({
          content: parsed.data.content,
          piiWarningShown: parsed.data.piiWarningShown,
        }),
      }
    );

    const canonicalResponse = await postCanonicalConversationMessage(canonicalRequest, {
      params: Promise.resolve({ conversationId: parsed.data.conversationId }),
    });

    const payload = await canonicalResponse.json().catch(() => null);

    if (!canonicalResponse.ok) {
      return addDeprecationHeaders(
        NextResponse.json(payload || { error: 'Failed to send message' }, {
          status: canonicalResponse.status,
        }),
        DeprecatedMessagesPath
      );
    }

    const canonicalMessage = (payload as any)?.message as CanonicalMessage;
    return addDeprecationHeaders(
      NextResponse.json(
        {
          message: toLegacyMessage(canonicalMessage, parsed.data.conversationId),
          success: true,
        },
        { status: 201 }
      ),
      DeprecatedMessagesPath
    );
  } catch (error) {
    console.error('Send message adapter error:', error);
    return addDeprecationHeaders(
      NextResponse.json({ error: 'Failed to send message' }, { status: 500 }),
      DeprecatedMessagesPath
    );
  }
}
