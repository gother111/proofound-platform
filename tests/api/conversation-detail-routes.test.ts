import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      conversations: {
        findFirst: vi.fn(),
      },
      profiles: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  conversations: {
    id: Symbol('conversations.id'),
    participantOneId: Symbol('conversations.participantOneId'),
    participantTwoId: Symbol('conversations.participantTwoId'),
  },
  messages: {
    conversationId: Symbol('messages.conversationId'),
    sentAt: Symbol('messages.sentAt'),
  },
  profiles: {
    id: Symbol('profiles.id'),
    handle: Symbol('profiles.handle'),
    displayName: Symbol('profiles.displayName'),
    avatarUrl: Symbol('profiles.avatarUrl'),
  },
}));

vi.mock('@/lib/privacy/pii-detection', () => ({
  detectPII: vi.fn(),
  shouldBlockMessage: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { POST as updateConversation } from '@/app/api/conversations/[conversationId]/route';
import { POST as sendConversationMessage } from '@/app/api/conversations/[conversationId]/messages/route';

function mockAuthenticatedUser() {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null,
      }),
    },
  });
}

function malformedRequest(url: string) {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: '{',
  });
}

describe('conversation detail routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedUser();
  });

  it('returns 400 for malformed JSON on conversation settings updates', async () => {
    const response = await updateConversation(
      malformedRequest('http://localhost/api/conversations/conversation-1'),
      { params: Promise.resolve({ conversationId: 'conversation-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(db.query.conversations.findFirst).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON when sending conversation messages', async () => {
    const response = await sendConversationMessage(
      malformedRequest('http://localhost/api/conversations/conversation-1/messages'),
      { params: Promise.resolve({ conversationId: 'conversation-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(db.query.conversations.findFirst).not.toHaveBeenCalled();
  });
});
