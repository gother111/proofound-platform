import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  conversationFindFirst: vi.fn(),
  matchReviewStateFindFirst: vi.fn(),
  update: vi.fn(),
  recordRevealEvent: vi.fn(),
  unlockFullIdentityForMatch: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      conversations: {
        findFirst: mocks.conversationFindFirst,
      },
      matchReviewStates: {
        findFirst: mocks.matchReviewStateFindFirst,
      },
      profiles: {
        findFirst: vi.fn(),
      },
    },
    update: mocks.update,
  },
  conversations: {
    id: 'id',
  },
  profiles: {
    id: 'id',
  },
}));

vi.mock('@/lib/matching/review-contract', () => ({
  recordRevealEvent: mocks.recordRevealEvent,
  unlockFullIdentityForMatch: mocks.unlockFullIdentityForMatch,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

import { POST } from '@/app/api/conversations/[conversationId]/reveal/route';

function mockConversationUpdateReturning(rows: Array<Record<string, unknown>>) {
  const returning = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });

  mocks.update.mockReturnValueOnce({ set });
}

describe('POST /api/conversations/[conversationId]/reveal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    });
  });

  it('keeps reveal pending after the first participant requests it', async () => {
    mocks.conversationFindFirst.mockResolvedValue({
      id: 'conversation-1',
      matchId: 'match-1',
      participantOneId: 'user-1',
      participantTwoId: 'candidate-1',
      participantOneWantsReveal: false,
      participantTwoWantsReveal: false,
      stage: 'masked',
      revealedAt: null,
    });
    mocks.matchReviewStateFindFirst.mockResolvedValue({
      matchId: 'match-1',
      assignmentId: 'assignment-1',
      profileId: 'candidate-1',
      orgId: 'org-1',
      revealScope: 'shortlist_identity',
    });
    mockConversationUpdateReturning([
      {
        id: 'conversation-1',
        matchId: 'match-1',
        participantOneId: 'user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: true,
        participantTwoWantsReveal: false,
        stage: 'masked',
        revealedAt: null,
      },
    ]);

    const response = await POST(
      new NextRequest('http://localhost/api/conversations/conversation-1/reveal', {
        method: 'POST',
      }),
      {
        params: Promise.resolve({ conversationId: 'conversation-1' }),
      }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.revealed).toBe(false);
    expect(body.waitingForOther).toBe(true);
    expect(mocks.recordRevealEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        outcome: 'no_op',
        grantedScope: 'shortlist_identity',
      })
    );
    expect(mocks.unlockFullIdentityForMatch).not.toHaveBeenCalled();
  });

  it('completes reveal only after the second participant approves', async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'candidate-1',
        },
      },
      error: null,
    });
    mocks.conversationFindFirst.mockResolvedValue({
      id: 'conversation-1',
      matchId: 'match-1',
      participantOneId: 'user-1',
      participantTwoId: 'candidate-1',
      participantOneWantsReveal: true,
      participantTwoWantsReveal: false,
      stage: 'masked',
      revealedAt: null,
    });
    mockConversationUpdateReturning([
      {
        id: 'conversation-1',
        matchId: 'match-1',
        participantOneId: 'user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: true,
        participantTwoWantsReveal: true,
        stage: 'masked',
        revealedAt: null,
      },
    ]);
    mockConversationUpdateReturning([
      {
        id: 'conversation-1',
        matchId: 'match-1',
        participantOneId: 'user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: true,
        participantTwoWantsReveal: true,
        stage: 'revealed',
        revealedAt: new Date('2026-03-14T12:00:00Z'),
      },
    ]);

    const response = await POST(
      new NextRequest('http://localhost/api/conversations/conversation-1/reveal', {
        method: 'POST',
      }),
      {
        params: Promise.resolve({ conversationId: 'conversation-1' }),
      }
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.revealed).toBe(true);
    expect(body.conversation.stage).toBe('revealed');
    expect(mocks.unlockFullIdentityForMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        unlockTrigger: 'conversation_reveal',
      })
    );
  });
});
