import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GET as getConversationMessages } from '@/app/api/conversations/[conversationId]/messages/route';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const LEGACY_MESSAGES_SUNSET = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();

function withLegacyDeprecationHeaders(
  response: NextResponse,
  conversationId: string
): NextResponse {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', LEGACY_MESSAGES_SUNSET);
  response.headers.set(
    'Link',
    `</api/conversations/${conversationId}/messages>; rel="successor-version"`
  );
  return response;
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

/**
 * Legacy compatibility endpoint.
 * Canonical route: /api/conversations/[conversationId]/messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const callerUserId = await getLegacyCallerUserId();

  log.info('messages.legacy_api.used', {
    endpoint: '/api/messages/[conversationId]',
    method: 'GET',
    conversationId,
    userId: callerUserId,
  });

  const proxiedUrl = new URL(request.url);
  proxiedUrl.pathname = `/api/conversations/${conversationId}/messages`;

  const proxiedRequest = new NextRequest(proxiedUrl, {
    method: 'GET',
    headers: request.headers,
  });

  const canonicalResponse = await getConversationMessages(proxiedRequest, {
    params: Promise.resolve({ conversationId }),
  });
  const payload = await canonicalResponse.json();

  return withLegacyDeprecationHeaders(
    NextResponse.json(payload, { status: canonicalResponse.status }),
    conversationId
  );
}
