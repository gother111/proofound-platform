/**
 * Legacy Messages API adapter.
 *
 * Canonical implementation lives at:
 * - GET /api/conversations/[conversationId]/messages
 * - POST /api/conversations/[conversationId]/messages
 *
 * This route keeps backward compatibility for existing clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GET as getConversationMessages,
  POST as postConversationMessage,
} from '@/app/api/conversations/[conversationId]/messages/route';

const LegacySendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000, 'Message cannot exceed 2000 characters'),
  piiWarningShown: z.boolean().optional(),
});

function buildConversationRequestUrl(request: NextRequest, conversationId: string) {
  const url = new URL(request.url);
  url.pathname = `/api/conversations/${conversationId}/messages`;
  return url;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
  }

  const proxiedUrl = buildConversationRequestUrl(request, conversationId);
  proxiedUrl.searchParams.delete('conversationId');

  const proxiedRequest = new NextRequest(proxiedUrl, {
    method: 'GET',
    headers: request.headers,
  });

  const canonicalResponse = await getConversationMessages(proxiedRequest, {
    params: Promise.resolve({ conversationId }),
  });

  const payload = await canonicalResponse.json();
  if (!canonicalResponse.ok) {
    return NextResponse.json(payload, { status: canonicalResponse.status });
  }

  const normalizedMessages = Array.isArray(payload.messages)
    ? payload.messages.map((message: any) => ({
        ...message,
        senderId: message.sender?.id ?? (message.isOwnMessage ? 'self' : 'unknown'),
      }))
    : [];

  return NextResponse.json({
    ...payload,
    messages: normalizedMessages,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = LegacySendMessageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { conversationId, content, piiWarningShown } = parsed.data;
  const proxiedUrl = buildConversationRequestUrl(request, conversationId);

  const proxiedRequest = new NextRequest(proxiedUrl, {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ content, piiWarningShown }),
  });

  const canonicalResponse = await postConversationMessage(proxiedRequest, {
    params: Promise.resolve({ conversationId }),
  });

  const payload = await canonicalResponse.json();
  if (!canonicalResponse.ok) {
    return NextResponse.json(payload, { status: canonicalResponse.status });
  }

  return NextResponse.json(
    {
      ...payload,
      success: true,
    },
    { status: canonicalResponse.status }
  );
}
