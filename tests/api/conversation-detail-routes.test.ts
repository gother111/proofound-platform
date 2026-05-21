import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const drizzle = vi.hoisted(() => ({
  and: vi.fn((...conditions: unknown[]) => ({ conditions, op: 'and' })),
  desc: vi.fn((field: unknown) => ({ field, op: 'desc' })),
  eq: vi.fn((field: unknown, value: unknown) => ({ field, op: 'eq', value })),
  inArray: vi.fn((field: unknown, values: unknown[]) => ({ field, op: 'inArray', values })),
  lt: vi.fn((field: unknown, value: unknown) => ({ field, op: 'lt', value })),
  or: vi.fn((...conditions: unknown[]) => ({ conditions, op: 'or' })),
}));

vi.mock('drizzle-orm', () => drizzle);

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
    id: Symbol('messages.id'),
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
import {
  GET as getConversationMessages,
  POST as sendConversationMessage,
} from '@/app/api/conversations/[conversationId]/messages/route';

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

  it('honors the before cursor when fetching conversation messages', async () => {
    (db.query.conversations.findFirst as any).mockResolvedValue({
      id: 'conversation-1',
      participantOneId: 'user-1',
      participantTwoId: 'user-2',
      maskedHandleOne: 'Submission A',
      maskedHandleTwo: 'Reviewer B',
      stage: 'masked',
    });

    const cursorSentAt = new Date('2026-05-19T08:00:00.000Z');
    const cursorWhere = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([{ sentAt: cursorSentAt }]),
    });
    const cursorFrom = vi.fn().mockReturnValue({ where: cursorWhere });

    const messagesLimit = vi.fn().mockResolvedValue([
      {
        id: 'message-older',
        conversationId: 'conversation-1',
        senderId: 'user-2',
        content: 'Older proof-safe reply',
        sentAt: new Date('2026-05-19T07:30:00.000Z'),
        readAt: null,
        status: 'sent',
        containsEmail: false,
        containsPhone: false,
        containsUrl: false,
      },
    ]);
    const messagesOrderBy = vi.fn().mockReturnValue({ limit: messagesLimit });
    const messagesWhere = vi.fn().mockReturnValue({ orderBy: messagesOrderBy });
    const messagesFrom = vi.fn().mockReturnValue({ where: messagesWhere });

    const profilesWhere = vi.fn().mockResolvedValue([
      {
        id: 'user-2',
        handle: 'reviewer-b',
        displayName: 'Reviewer B',
        avatarUrl: null,
      },
    ]);
    const profilesFrom = vi.fn().mockReturnValue({ where: profilesWhere });

    (db.select as any)
      .mockReturnValueOnce({ from: cursorFrom })
      .mockReturnValueOnce({ from: messagesFrom })
      .mockReturnValueOnce({ from: profilesFrom });

    const response = await getConversationMessages(
      new NextRequest(
        'http://localhost/api/conversations/conversation-1/messages?limit=20&before=cursor-1'
      ),
      { params: Promise.resolve({ conversationId: 'conversation-1' }) }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(drizzle.lt).toHaveBeenCalledWith(expect.anything(), cursorSentAt);
    expect(messagesLimit).toHaveBeenCalledWith(20);
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0]).toMatchObject({
      id: 'message-older',
      sender: {
        displayName: 'Reviewer B',
        handle: null,
      },
    });
    expect(body.hasMore).toBe(false);
  });
});
