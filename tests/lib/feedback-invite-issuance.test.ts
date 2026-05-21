import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  sendFeedbackRequestEmail: vi.fn(),
  issueCapabilityToken: vi.fn(),
  redeemCapabilityToken: vi.fn(),
  getUserById: vi.fn(),
  feedbackTokensInsert: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock('@/lib/email', () => ({
  sendFeedbackRequestEmail: mocks.sendFeedbackRequestEmail,
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_BINDINGS: {
    NONE: 'none',
    EMAIL_HASH: 'email_hash',
  },
  CAPABILITY_TOKEN_CLASSES: {
    FEEDBACK_RESPONSE: 'feedback_response',
  },
  issueCapabilityToken: mocks.issueCapabilityToken,
  redeemCapabilityToken: mocks.redeemCapabilityToken,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { issueFeedbackInvites } from '@/lib/feedback/service';

function buildAdminClient() {
  return {
    auth: {
      admin: {
        getUserById: mocks.getUserById,
      },
    },
    from(table: string) {
      if (table === 'interviews') {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: {
                      id: 'interview-1',
                      host_user_id: 'host-1',
                      participant_user_ids: ['host-1', 'candidate-1'],
                      status: 'completed',
                      scheduled_at: '2026-03-24T10:00:00.000Z',
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      }

      if (table === 'feedback_templates') {
        let direction: string | null = null;

        return {
          select() {
            return {
              eq(field: string, value: string | boolean) {
                if (field === 'direction' && typeof value === 'string') {
                  direction = value;
                }

                return this;
              },
              order() {
                return this;
              },
              limit() {
                return this;
              },
              async maybeSingle() {
                return {
                  data:
                    direction === 'candidate_to_org'
                      ? { id: 'template-candidate' }
                      : direction === 'org_to_candidate'
                        ? { id: 'template-org' }
                        : null,
                  error: null,
                };
              },
            };
          },
        };
      }

      if (table === 'feedback_tokens') {
        return {
          insert: mocks.feedbackTokensInsert,
        };
      }

      throw new Error(`Unexpected table access: ${table}`);
    },
  };
}

describe('feedback invite issuance compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.createAdminClient.mockReturnValue(buildAdminClient());
    mocks.feedbackTokensInsert.mockResolvedValue({ error: null });
    mocks.sendFeedbackRequestEmail.mockResolvedValue(undefined);
    mocks.getUserById
      .mockResolvedValueOnce({
        data: { user: { email: 'candidate@test.proofound.com' } },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { user: { email: 'host@test.proofound.com' } },
        error: null,
      });

    mocks.issueCapabilityToken
      .mockResolvedValueOnce({
        rawToken: 'candidate-token',
        tokenHash: 'candidate-hash',
        token: { id: 'cap-token-candidate' },
      })
      .mockResolvedValueOnce({
        rawToken: 'org-token',
        tokenHash: 'org-hash',
        token: { id: 'cap-token-org' },
      });
  });

  it('persists the legacy raw token alongside canonical token fields', async () => {
    await issueFeedbackInvites('interview-1');

    expect(mocks.issueCapabilityToken).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        actorBinding: 'none',
        actorEmail: null,
      })
    );
    expect(mocks.issueCapabilityToken).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        actorBinding: 'none',
        actorEmail: null,
      })
    );
    expect(mocks.feedbackTokensInsert).toHaveBeenCalledTimes(2);
    expect(mocks.feedbackTokensInsert).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: expect.any(String),
        token: 'candidate-token',
        token_hash: 'candidate-hash',
        capability_token_id: 'cap-token-candidate',
        interview_id: 'interview-1',
        template_id: 'template-candidate',
        direction: 'candidate_to_org',
        recipient_email: 'candidate@test.proofound.com',
      })
    );
    expect(mocks.feedbackTokensInsert).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: expect.any(String),
        token: 'org-token',
        token_hash: 'org-hash',
        capability_token_id: 'cap-token-org',
        interview_id: 'interview-1',
        template_id: 'template-org',
        direction: 'org_to_candidate',
        recipient_email: 'host@test.proofound.com',
      })
    );
  });

  it('keeps feedback email failures best-effort and structured', async () => {
    mocks.sendFeedbackRequestEmail
      .mockRejectedValueOnce(new Error('mail transport unavailable'))
      .mockResolvedValueOnce(undefined);

    const tokens = await issueFeedbackInvites('interview-1');

    expect(tokens).toHaveLength(2);
    expect(mocks.logError).toHaveBeenCalledWith('feedback.invite.email_send_failed', {
      interviewId: 'interview-1',
      direction: 'candidate_to_org',
      errorMessage: 'mail transport unavailable',
    });
  });
});
