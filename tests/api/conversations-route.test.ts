import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
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

import { createClient } from '@/lib/supabase/server';
import { POST } from '@/app/api/conversations/route';
import {
  ensureConversationForMatch,
  resolveConversationParticipantsForMatch,
} from '@/lib/messaging/conversation-access';

function makeRequest(body: Record<string, unknown>) {
  return new NextRequest('https://proofound.io/api/conversations', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

describe('POST /api/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      maskedHandleOne: 'Candidate #ABC123',
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
      maskedHandleOne: 'Candidate #ABC123',
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
});
