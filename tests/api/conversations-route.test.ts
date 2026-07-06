import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const dbSelectMock = vi.hoisted(() => vi.fn());
const logErrorMock = vi.hoisted(() => vi.fn());
const logInfoMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: dbSelectMock,
  },
}));

vi.mock('@/lib/messaging/conversation-access', () => ({
  ConversationAccessError: class ConversationAccessError extends Error {
    constructor(
      public readonly code: 'MATCH_NOT_FOUND' | 'ORG_REP_NOT_FOUND',
      message: string
    ) {
      super(message);
      this.name = 'ConversationAccessError';
    }
  },
  ensureConversationForMatch: vi.fn(),
  resolveConversationParticipantsForMatch: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: logErrorMock,
    info: logInfoMock,
  },
}));

import { createClient } from '@/lib/supabase/server';
import { GET, POST } from '@/app/api/conversations/route';
import {
  ensureConversationForMatch,
  resolveConversationParticipantsForMatch,
} from '@/lib/messaging/conversation-access';

function buildSelectChain<T>(result: T, options: { limitNeedsOffset?: boolean } = {}) {
  const chain: any = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(() => (options.limitNeedsOffset ? chain : Promise.resolve(result))),
    offset: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (value: T) => unknown, reject: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };

  return chain;
}

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://proofound.io/api/conversations', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

function makeMalformedRequest() {
  return new NextRequest('https://proofound.io/api/conversations', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: '{',
  });
}

function mockAuthenticatedUser(userId = 'candidate-user') {
  vi.mocked(createClient).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
  } as any);
}

describe('GET /api/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps other participant identifiers hidden while the conversation is masked', async () => {
    mockAuthenticatedUser('candidate-user');
    dbSelectMock
      .mockReturnValueOnce(
        buildSelectChain(
          [
            {
              id: 'conversation-1',
              matchId: 'match-1',
              assignmentId: 'assignment-1',
              participantOneId: 'candidate-user',
              participantTwoId: 'org-user-secret',
              maskedHandleOne: 'Submission #ABC123',
              maskedHandleTwo: 'Organization #XYZ789',
              stage: 'masked',
              lastMessageAt: '2026-03-12T10:00:00.000Z',
              createdAt: '2026-03-12T09:00:00.000Z',
            },
          ],
          { limitNeedsOffset: true }
        )
      )
      .mockReturnValueOnce(
        buildSelectChain([
          {
            id: 'org-user-secret',
            displayName: 'Acme Hiring Lead',
            persona: 'organization',
            avatarUrl: 'https://example.com/private-avatar.png',
          },
        ])
      )
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(buildSelectChain([{ role: 'Operations Lead' }]));

    const response = await GET(new NextRequest('https://proofound.io/api/conversations'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversations[0]).toMatchObject({
      id: 'conversation-1',
      otherParty: {
        id: null,
        displayName: 'Organization #XYZ789',
        displayAvatar: null,
      },
      stage: 'masked',
    });
    expect(JSON.stringify(body)).not.toContain('org-user-secret');
    expect(JSON.stringify(body)).not.toContain('Acme Hiring Lead');
    expect(JSON.stringify(body)).not.toContain('private-avatar');
  });

  it('returns the other participant identifier only after reveal', async () => {
    mockAuthenticatedUser('candidate-user');
    dbSelectMock
      .mockReturnValueOnce(
        buildSelectChain(
          [
            {
              id: 'conversation-1',
              matchId: 'match-1',
              assignmentId: 'assignment-1',
              participantOneId: 'candidate-user',
              participantTwoId: 'org-user-revealed',
              maskedHandleOne: 'Submission #ABC123',
              maskedHandleTwo: 'Organization #XYZ789',
              stage: 'revealed',
              lastMessageAt: '2026-03-12T10:00:00.000Z',
              createdAt: '2026-03-12T09:00:00.000Z',
            },
          ],
          { limitNeedsOffset: true }
        )
      )
      .mockReturnValueOnce(
        buildSelectChain([
          {
            id: 'org-user-revealed',
            displayName: 'Acme Hiring Lead',
            persona: 'organization',
            avatarUrl: 'https://example.com/revealed-avatar.png',
          },
        ])
      )
      .mockReturnValueOnce(buildSelectChain([]))
      .mockReturnValueOnce(buildSelectChain([{ count: 0 }]))
      .mockReturnValueOnce(buildSelectChain([{ role: 'Operations Lead' }]));

    const response = await GET(new NextRequest('https://proofound.io/api/conversations'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.conversations[0]).toMatchObject({
      otherParty: {
        id: 'org-user-revealed',
        displayName: 'Acme Hiring Lead',
        displayAvatar: 'https://example.com/revealed-avatar.png',
      },
      stage: 'revealed',
    });
  });

  it('logs list failures with structured diagnostics', async () => {
    const listError = new Error('conversation list unavailable');
    mockAuthenticatedUser('candidate-user');
    dbSelectMock.mockImplementationOnce(() => {
      throw listError;
    });

    const response = await GET(new NextRequest('https://proofound.io/api/conversations'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch conversations' });
    expect(logErrorMock).toHaveBeenCalledWith('conversations.list.failed', {
      error: listError,
    });
  });
});

describe('POST /api/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for malformed JSON request bodies', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'candidate-user' } },
          error: null,
        }),
      },
    } as any);

    const response = await POST(makeMalformedRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(vi.mocked(resolveConversationParticipantsForMatch)).not.toHaveBeenCalled();
    expect(vi.mocked(ensureConversationForMatch)).not.toHaveBeenCalled();
  });

  it('rejects callers who are not canonical match participants', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'outsider-user' } },
          error: null,
        }),
      },
    } as any);
    vi.mocked(resolveConversationParticipantsForMatch).mockResolvedValue({
      matchId: '11111111-1111-4111-8111-111111111111',
      assignmentId: '22222222-2222-4222-8222-222222222222',
      orgId: '33333333-3333-4333-8333-333333333333',
      candidateId: 'candidate-user',
      orgParticipantId: 'org-user',
      maskedHandleOne: 'Submission #ABC123',
      maskedHandleTwo: 'Organization #XYZ789',
    });

    const response = await POST(
      makeRequest({
        matchId: '11111111-1111-4111-8111-111111111111',
        participantOneId: 'attacker-controlled',
        participantTwoId: 'attacker-controlled',
      })
    );

    expect(response.status).toBe(403);
    expect(vi.mocked(ensureConversationForMatch)).not.toHaveBeenCalled();
  });

  it('creates or returns a conversation using canonical match participants only', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'candidate-user' } },
          error: null,
        }),
      },
    } as any);
    vi.mocked(resolveConversationParticipantsForMatch).mockResolvedValue({
      matchId: '11111111-1111-4111-8111-111111111111',
      assignmentId: '22222222-2222-4222-8222-222222222222',
      orgId: '33333333-3333-4333-8333-333333333333',
      candidateId: 'candidate-user',
      orgParticipantId: 'org-user',
      maskedHandleOne: 'Submission #ABC123',
      maskedHandleTwo: 'Organization #XYZ789',
    });
    vi.mocked(ensureConversationForMatch).mockResolvedValue({
      conversation: {
        id: 'conversation-1',
        participantOneId: 'candidate-user',
        participantTwoId: 'org-user',
      },
      created: true,
    } as any);

    const response = await POST(
      makeRequest({
        matchId: '11111111-1111-4111-8111-111111111111',
        participantOneId: 'attacker-controlled',
        participantTwoId: 'attacker-controlled',
      })
    );

    expect(response.status).toBe(201);
    expect(vi.mocked(ensureConversationForMatch)).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      { preferredOrgUserId: undefined }
    );

    const body = await response.json();
    expect(body).toMatchObject({
      created: true,
      conversation: {
        id: 'conversation-1',
        participantOneId: 'candidate-user',
        participantTwoId: 'org-user',
      },
    });
  });

  it('logs create failures with structured diagnostics', async () => {
    const createError = new Error('participant lookup unavailable');
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'candidate-user' } },
          error: null,
        }),
      },
    } as any);
    vi.mocked(resolveConversationParticipantsForMatch).mockRejectedValue(createError);

    const response = await POST(
      makeRequest({
        matchId: '11111111-1111-4111-8111-111111111111',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to create conversation' });
    expect(logErrorMock).toHaveBeenCalledWith('conversation.create.failed', {
      error: createError,
    });
  });
});
