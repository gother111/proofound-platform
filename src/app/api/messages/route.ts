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
import { createClient } from '@/lib/supabase/server';
import {
  GET as getConversationMessages,
  POST as postConversationMessage,
} from '@/app/api/conversations/[conversationId]/messages/route';
import { log } from '@/lib/log';

const LegacySendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(2000, 'Message cannot exceed 2000 characters'),
  piiWarningShown: z.boolean().optional(),
});

const LEGACY_MESSAGES_SUNSET = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();

function withLegacyDeprecationHeaders(
  response: NextResponse,
  conversationId?: string
): NextResponse {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', LEGACY_MESSAGES_SUNSET);
  if (conversationId) {
    response.headers.set(
      'Link',
      `</api/conversations/${conversationId}/messages>; rel="successor-version"`
    );
  } else {
    response.headers.set('Link', '</api/conversations>; rel="successor-version"');
  }
  return response;
}

function buildConversationRequestUrl(request: NextRequest, conversationId: string) {
  const url = new URL(request.url);
  url.pathname = `/api/conversations/${conversationId}/messages`;
  return url;
}

async function getLegacyCallerUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const conversationId = searchParams.get('conversationId');
  const callerUserId = await getLegacyCallerUserId();

  log.info('messages.legacy_api.used', {
    endpoint: '/api/messages',
    method: 'GET',
    conversationId,
    userId: callerUserId,
  });

  if (!conversationId) {
    return withLegacyDeprecationHeaders(
      NextResponse.json({ error: 'conversationId is required' }, { status: 400 })
    );
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
    return withLegacyDeprecationHeaders(
      NextResponse.json(payload, { status: canonicalResponse.status }),
      conversationId
    );
  }

  const normalizedMessages = Array.isArray(payload.messages)
    ? payload.messages.map((message: any) => ({
        ...message,
        senderId: message.sender?.id ?? (message.isOwnMessage ? 'self' : 'unknown'),
      }))
    : [];

  return withLegacyDeprecationHeaders(
    NextResponse.json({
      ...payload,
      messages: normalizedMessages,
    }),
    conversationId
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = LegacySendMessageSchema.safeParse(body);
  const callerUserId = await getLegacyCallerUserId();

  log.info('messages.legacy_api.used', {
    endpoint: '/api/messages',
    method: 'POST',
    conversationId: parsed.success ? parsed.data.conversationId : null,
    userId: callerUserId,
  });

  if (!parsed.success) {
    return withLegacyDeprecationHeaders(
      NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
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
    return withLegacyDeprecationHeaders(
      NextResponse.json(payload, { status: canonicalResponse.status }),
      conversationId
    );
  }

  return withLegacyDeprecationHeaders(
    NextResponse.json(
      {
        ...payload,
        success: true,
      },
      { status: canonicalResponse.status }
    ),
    conversationId
  );
}
