import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  conversationFindFirst: vi.fn(),
  matchReviewStateFindFirst: vi.fn(),
  profileFindFirst: vi.fn(),
  organizationFindFirst: vi.fn(),
  update: vi.fn(),
  select: vi.fn(),
  sendIdentityRevealedEmail: vi.fn(),
  createAdminClient: vi.fn(),
  unlockFullIdentityForMatch: vi.fn(),
  logError: vi.fn(),
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
    select: mocks.select,
  },
  conversations: {
    id: Symbol('conversations.id'),
    stage: Symbol('conversations.stage'),
  },
  matchReviewStates: {
    matchId: Symbol('matchReviewStates.matchId'),
  },
  organizations: {
    id: Symbol('organizations.id'),
  },
  profiles: {
    id: Symbol('profiles.id'),
  },
}));

vi.mock('@/db/schema', () => ({
  conversations: {
    id: Symbol('schema.conversations.id'),
    stage: Symbol('schema.conversations.stage'),
  },
  matchReviewStates: {
    matchId: Symbol('schema.matchReviewStates.matchId'),
  },
  organizations: {
    id: Symbol('schema.organizations.id'),
  },
  profiles: {
    id: Symbol('schema.profiles.id'),
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field: unknown, value: unknown) => ({ field, op: 'eq', value })),
}));

vi.mock('@/lib/email', () => ({
  sendIdentityRevealedEmail: mocks.sendIdentityRevealedEmail,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock('@/lib/matching/review-contract', () => ({
  unlockFullIdentityForMatch: mocks.unlockFullIdentityForMatch,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { isIdentityRevealed, triggerIdentityReveal } from '@/lib/messaging/identity-reveal';

function mockConversationUpdate() {
  const where = vi.fn().mockResolvedValue(undefined);
  const set = vi.fn().mockReturnValue({ where });
  mocks.update.mockReturnValue({ set });
}

describe('identity reveal structured logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationUpdate();
    mocks.unlockFullIdentityForMatch.mockResolvedValue(undefined);
    mocks.sendIdentityRevealedEmail.mockResolvedValue(undefined);
    mocks.createAdminClient.mockReturnValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { email: 'participant@example.com' } },
          }),
        },
      },
    });
  });

  it('logs unresolved role-safe email context without failing the reveal state update', async () => {
    mocks.conversationFindFirst.mockResolvedValue({
      id: 'conversation-1',
      matchId: 'match-1',
      participantOneId: 'candidate-1',
      participantTwoId: 'org-user-1',
    });
    mocks.matchReviewStateFindFirst.mockResolvedValue(null);

    await expect(triggerIdentityReveal('conversation-1')).resolves.toBeUndefined();

    expect(mocks.unlockFullIdentityForMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        unlockTrigger: 'interview_scheduled',
      })
    );
    expect(mocks.logError).toHaveBeenCalledWith(
      'messaging.identity_reveal.email_context_unresolved',
      {
        hasRevealContext: false,
        hasCandidateParticipant: false,
        hasOrganizationParticipant: false,
      }
    );
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('conversation-1');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('candidate-1');
    expect(mocks.sendIdentityRevealedEmail).not.toHaveBeenCalled();
  });

  it('logs status check failures and returns false', async () => {
    const statusError = new Error('status lookup unavailable');
    mocks.select.mockImplementation(() => {
      throw statusError;
    });

    await expect(isIdentityRevealed('conversation-1')).resolves.toBe(false);

    expect(mocks.logError).toHaveBeenCalledWith('messaging.identity_reveal.status_check_failed', {
      error: statusError,
    });
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('conversation-1');
  });
});
