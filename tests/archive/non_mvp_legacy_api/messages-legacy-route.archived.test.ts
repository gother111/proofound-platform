import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { GET as legacyMessagesGet, POST as legacyMessagesPost } from '@/app/api/messages/route';
import { GET as legacyConversationMessagesGet } from '@/app/api/messages/[conversationId]/route';
import { createClient } from '@/lib/supabase/server';
import {
  GET as canonicalMessagesGet,
  POST as canonicalMessagesPost,
} from '@/app/api/conversations/[conversationId]/messages/route';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/app/api/conversations/[conversationId]/messages/route', () => ({
  GET: vi.fn(),
  POST: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
  },
}));

describe('legacy messages adapters', () => {
  const conversationId = '11111111-1111-4111-8111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-legacy' } },
          error: null,
        }),
      },
    } as any);
  });

  it('GET /api/messages preserves payload shape and emits deprecation headers', async () => {
    vi.mocked(canonicalMessagesGet).mockResolvedValue(
      NextResponse.json({
        messages: [
          {
            id: 'message-1',
            content: 'Hello',
            sender: { id: 'user-2' },
            isOwnMessage: false,
          },
        ],
      })
    );

    const response = await legacyMessagesGet(
      new NextRequest(`http://localhost/api/messages?conversationId=${conversationId}`)
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.messages[0].id).toBe('message-1');
    expect(payload.messages[0].senderId).toBe('user-2');
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toBeTruthy();
    expect(response.headers.get('Link')).toContain(`/api/conversations/${conversationId}/messages`);
  });

  it('POST /api/messages preserves success shape and emits deprecation headers', async () => {
    vi.mocked(canonicalMessagesPost).mockResolvedValue(
      NextResponse.json(
        {
          message: { id: 'message-2', content: 'Hi there' },
        },
        { status: 201 }
      )
    );

    const response = await legacyMessagesPost(
      new NextRequest('http://localhost/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          content: 'Hi there',
        }),
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(payload.message.id).toBe('message-2');
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toBeTruthy();
    expect(response.headers.get('Link')).toContain(`/api/conversations/${conversationId}/messages`);
  });

  it('GET /api/messages/[conversationId] proxies and emits deprecation headers', async () => {
    vi.mocked(canonicalMessagesGet).mockResolvedValue(
      NextResponse.json(
        {
          messages: [{ id: 'message-3', content: 'Legacy by id' }],
        },
        { status: 200 }
      )
    );

    const response = await legacyConversationMessagesGet(
      new NextRequest(`http://localhost/api/messages/${conversationId}`),
      { params: Promise.resolve({ conversationId }) }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.messages[0].id).toBe('message-3');
    expect(response.headers.get('Deprecation')).toBe('true');
    expect(response.headers.get('Sunset')).toBeTruthy();
    expect(response.headers.get('Link')).toContain(`/api/conversations/${conversationId}/messages`);
  });
});
