import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  listUsers: vi.fn(),
  conversationFindFirst: vi.fn(),
  matchReviewStateFindFirst: vi.fn(),
  profileFindFirst: vi.fn(),
  update: vi.fn(),
  recordRevealEvent: vi.fn(),
  syncRevealRequestTimeoutState: vi.fn(),
  unlockFullIdentityForMatch: vi.fn(),
  resendSend: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
  getHiringCorridorRecordForMatch: vi.fn(),
  buildHiringCorridorSnapshot: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mocks.getUser,
      admin: {
        listUsers: mocks.listUsers,
      },
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
        findFirst: mocks.profileFindFirst,
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

vi.mock('@/lib/workflow/service', () => ({
  syncRevealRequestTimeoutState: mocks.syncRevealRequestTimeoutState,
}));

vi.mock('@/lib/hiring-corridor/service', () => ({
  getHiringCorridorRecordForMatch: mocks.getHiringCorridorRecordForMatch,
}));

vi.mock('@/lib/hiring-corridor/snapshot', () => ({
  buildHiringCorridorSnapshot: mocks.buildHiringCorridorSnapshot,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: mocks.resendSend,
    },
  })),
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
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
        },
      },
      error: null,
    });
    mocks.listUsers.mockResolvedValue({
      data: {
        users: [
          { id: 'user-1', email: 'user-1@example.com' },
          { id: 'candidate-1', email: 'candidate-1@example.com' },
        ],
      },
    });
    const profileRows = [
      { id: 'user-1', displayName: 'Alex' },
      { id: 'candidate-1', displayName: 'Jordan' },
    ];
    mocks.profileFindFirst.mockImplementation(async () => profileRows.shift() ?? null);
    mocks.resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    mocks.getHiringCorridorRecordForMatch.mockResolvedValue(null);
    mocks.buildHiringCorridorSnapshot.mockReturnValue(null);
    mocks.syncRevealRequestTimeoutState.mockImplementation(async ({ conversation }: any) => ({
      conversation,
      timeout: {
        pending: false,
        expired: false,
        requestedBy: null,
        requestedAt: null,
        expiresAt: null,
        timedOutParticipantId: null,
      },
      reset: false,
    }));
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
    expect(mocks.resendSend).not.toHaveBeenCalled();
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
    expect(mocks.resendSend).toHaveBeenCalledTimes(2);
    expect(mocks.resendSend).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        to: 'user-1@example.com',
        subject: 'Identities Revealed - Continue Your Conversation',
      })
    );
  });

  it('resets an expired reveal request before treating a new reveal as pending', async () => {
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
      participantOneRevealRequestedAt: new Date('2026-03-10T09:00:00.000Z'),
      participantTwoRevealRequestedAt: null,
      stage: 'masked',
      revealedAt: null,
    });
    mocks.syncRevealRequestTimeoutState.mockResolvedValue({
      conversation: {
        id: 'conversation-1',
        matchId: 'match-1',
        participantOneId: 'user-1',
        participantTwoId: 'candidate-1',
        participantOneWantsReveal: false,
        participantTwoWantsReveal: false,
        participantOneRevealRequestedAt: null,
        participantTwoRevealRequestedAt: null,
        stage: 'masked',
        revealedAt: null,
      },
      timeout: {
        pending: true,
        expired: true,
        requestedBy: 'participant_one',
        requestedAt: new Date('2026-03-10T09:00:00.000Z'),
        expiresAt: new Date('2026-03-13T09:00:00.000Z'),
        timedOutParticipantId: 'user-1',
      },
      reset: true,
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
        participantOneWantsReveal: false,
        participantTwoWantsReveal: true,
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
    expect(mocks.syncRevealRequestTimeoutState).toHaveBeenCalledOnce();
    expect(mocks.recordRevealEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'system',
        triggerType: 'policy',
        reasonCode: 'reveal_request_expired',
        outcome: 'denied',
      })
    );
    expect(mocks.unlockFullIdentityForMatch).not.toHaveBeenCalled();
  });
});
