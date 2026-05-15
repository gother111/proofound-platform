import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getUserById: vi.fn(),
  conversationFindFirst: vi.fn(),
  matchReviewStateFindFirst: vi.fn(),
  profileFindFirst: vi.fn(),
  organizationFindFirst: vi.fn(),
  update: vi.fn(),
  recordRevealEvent: vi.fn(),
  syncRevealRequestTimeoutState: vi.fn(),
  unlockFullIdentityForMatch: vi.fn(),
  resendSend: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
  getHiringCorridorRecordForMatch: vi.fn(),
  buildHiringCorridorSnapshot: vi.fn(),
  withWorkflowMutationIdempotency: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mocks.getUser,
    },
  }),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    auth: {
      admin: {
        getUserById: mocks.getUserById,
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
      organizations: {
        findFirst: mocks.organizationFindFirst,
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
  organizations: {
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

vi.mock('@/lib/api/workflow-idempotency', () => ({
  withWorkflowMutationIdempotency: mocks.withWorkflowMutationIdempotency,
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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
    mocks.getUserById.mockImplementation(async (userId: string) => ({
      data: {
        user:
          userId === 'user-1'
            ? { id: 'user-1', email: 'user-1@example.com' }
            : { id: 'candidate-1', email: 'candidate-1@example.com' },
      },
      error: null,
    }));
    const profileRows = [
      { id: 'candidate-1', displayName: 'Jordan' },
      { id: 'user-1', displayName: 'Alex' },
    ];
    mocks.profileFindFirst.mockImplementation(async () => profileRows.shift() ?? null);
    mocks.organizationFindFirst.mockResolvedValue({
      id: 'org-1',
      slug: 'acme',
      displayName: 'Acme Org',
    });
    mocks.matchReviewStateFindFirst.mockResolvedValue({
      matchId: 'match-1',
      assignmentId: 'assignment-1',
      profileId: 'candidate-1',
      orgId: 'org-1',
      revealScope: 'shortlist_identity',
    });
    mocks.resendSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });
    mocks.getHiringCorridorRecordForMatch.mockResolvedValue(null);
    mocks.buildHiringCorridorSnapshot.mockReturnValue(null);
    mocks.withWorkflowMutationIdempotency.mockImplementation(
      async (
        _request: unknown,
        _scope: unknown,
        _payload: unknown,
        handler: () => Promise<Response>
      ) => handler()
    );
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

  it('keeps reveal pending after the first participant requests it and emails the candidate URL', async () => {
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
        reasonCode: 'reveal_requested',
      })
    );
    expect(mocks.unlockFullIdentityForMatch).not.toHaveBeenCalled();
    expect(mocks.resendSend).toHaveBeenCalledTimes(1);
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'candidate-1@example.com',
        subject: 'Reveal request waiting in Proofound',
        html: expect.stringContaining(
          '/app/i/communications?section=messages&amp;conversation=conversation-1'
        ),
        text: expect.stringContaining(
          '/app/i/communications?section=messages&conversation=conversation-1'
        ),
      })
    );
    const emailPayload = mocks.resendSend.mock.calls[0]?.[0];
    const renderedEmail = `${emailPayload.html}\n${emailPayload.text}`;
    expect(renderedEmail).not.toContain('Jordan');
    expect(renderedEmail).not.toContain('candidate-1@example.com');
    expect(renderedEmail).not.toContain('Stockholm');
    expect(renderedEmail).not.toContain('jordan_resume.pdf');
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
        reasonCode: 'reveal_unlocked',
      })
    );
    expect(mocks.resendSend).toHaveBeenCalledTimes(2);
    expect(mocks.recordRevealEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        reasonCode: 'reveal_approved',
        outcome: 'no_op',
      })
    );
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user-1@example.com',
        subject: 'Reveal approved in Proofound',
        html: expect.stringContaining(
          '/app/o/acme/communications?section=messages&amp;conversation=conversation-1'
        ),
        text: expect.stringContaining(
          '/app/o/acme/communications?section=messages&conversation=conversation-1'
        ),
      })
    );
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'candidate-1@example.com',
        subject: 'Reveal approved in Proofound',
        html: expect.stringContaining(
          '/app/i/communications?section=messages&amp;conversation=conversation-1'
        ),
        text: expect.stringContaining(
          '/app/i/communications?section=messages&conversation=conversation-1'
        ),
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
        reasonCode: 'reveal_timed_out',
        outcome: 'denied',
      })
    );
    expect(mocks.unlockFullIdentityForMatch).not.toHaveBeenCalled();
  });

  it('logs and skips email delivery when a participant email lookup fails', async () => {
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'candidate-1',
        },
      },
      error: null,
    });
    mocks.getUserById.mockImplementation(async (userId: string) => ({
      data: {
        user:
          userId === 'user-1'
            ? { id: 'user-1', email: 'user-1@example.com' }
            : { id: 'candidate-1', email: undefined },
      },
      error: null,
    }));
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
    expect(mocks.resendSend).toHaveBeenCalledTimes(1);
    expect(mocks.resendSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user-1@example.com',
        subject: 'Reveal approved in Proofound',
        html: expect.stringContaining(
          '/app/o/acme/communications?section=messages&amp;conversation=conversation-1'
        ),
      })
    );
    expect(mocks.logError).toHaveBeenCalledWith(
      'transactional_email.delivery_failed',
      expect.objectContaining({
        route: 'conversation_reveal_route',
        workflow: 'reveal_approved',
        reason: 'missing_recipient',
        provider: 'resend',
      })
    );
  });

  it('returns a generic production error without exposing participant identity details', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    mocks.conversationFindFirst.mockRejectedValue(
      new Error('select * from profiles where email = candidate-1@example.com and name = Jordan')
    );

    const response = await POST(
      new NextRequest('http://localhost/api/conversations/conversation-1/reveal', {
        method: 'POST',
      }),
      {
        params: Promise.resolve({ conversationId: 'conversation-1' }),
      }
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Unable to process reveal request' });
    expect(serialized).not.toContain('candidate-1@example.com');
    expect(serialized).not.toContain('Jordan');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('candidate-1@example.com');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('Jordan');
  });

  it('replays duplicate reveal approval without unlocking identity or sending emails again', async () => {
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
      participantTwoWantsReveal: true,
      stage: 'revealed',
      revealedAt: new Date('2026-03-14T12:00:00Z'),
    });
    mocks.withWorkflowMutationIdempotency.mockResolvedValue(
      Response.json(
        {
          success: true,
          revealed: true,
          conversation: {
            id: 'conversation-1',
            stage: 'revealed',
            revealedAt: '2026-03-14T12:00:00.000Z',
          },
        },
        {
          headers: {
            'Idempotency-Replayed': 'true',
          },
        }
      )
    );

    const response = await POST(
      new NextRequest('http://localhost/api/conversations/conversation-1/reveal', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'wf-reveal-duplicate-1' },
      }),
      {
        params: Promise.resolve({ conversationId: 'conversation-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Idempotency-Replayed')).toBe('true');
    expect(body.revealed).toBe(true);
    expect(mocks.unlockFullIdentityForMatch).not.toHaveBeenCalled();
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });

  it('rejects same-key reveal replay with a changed payload before side effects', async () => {
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
    mocks.withWorkflowMutationIdempotency.mockResolvedValue(
      Response.json(
        {
          error: 'Idempotency-Key replay used a different payload',
          code: 'IDEMPOTENCY_REPLAY_MISMATCH',
        },
        { status: 409 }
      )
    );

    const response = await POST(
      new NextRequest('http://localhost/api/conversations/conversation-1/reveal', {
        method: 'POST',
        headers: { 'Idempotency-Key': 'wf-reveal-replay-1' },
      }),
      {
        params: Promise.resolve({ conversationId: 'conversation-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe('IDEMPOTENCY_REPLAY_MISMATCH');
    expect(mocks.unlockFullIdentityForMatch).not.toHaveBeenCalled();
    expect(mocks.resendSend).not.toHaveBeenCalled();
  });
});
