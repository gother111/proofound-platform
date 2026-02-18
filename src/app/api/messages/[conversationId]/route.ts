import { NextRequest } from 'next/server';
import { GET as getConversationMessages } from '@/app/api/conversations/[conversationId]/messages/route';

export const dynamic = 'force-dynamic';

/**
 * Legacy compatibility endpoint.
 * Canonical route: /api/conversations/[conversationId]/messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  const proxiedUrl = new URL(request.url);
  proxiedUrl.pathname = `/api/conversations/${conversationId}/messages`;

  const proxiedRequest = new NextRequest(proxiedUrl, {
    method: 'GET',
    headers: request.headers,
  });

  return getConversationMessages(proxiedRequest, {
    params: Promise.resolve({ conversationId }),
  });
}
