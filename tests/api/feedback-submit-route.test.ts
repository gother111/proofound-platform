/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/feedback/service', () => ({
  markTokenUsed: vi.fn(),
  resolveFeedbackFollowUpState: vi.fn(() => ({
    dueAt: new Date('2026-03-11T10:00:00.000Z'),
    overallState: 'on_track',
    candidateToOrg: 'submitted',
    orgToCandidate: 'pending',
    slaBreached: false,
  })),
}));

vi.mock('@/lib/analytics/lifecycle-events', () => ({
  emitLifecycleEvent: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_TOKEN_CLASSES: {
    FEEDBACK_RESPONSE: 'feedback_response',
  },
  getCapabilityRedeemSessionCookieName: vi.fn(() => 'feedback-cookie'),
  inspectCapabilityToken: vi.fn(),
}));

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

import { POST } from '@/app/api/feedback/submit/route';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { markTokenUsed } from '@/lib/feedback/service';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { emitLaunchTrace } from '@/lib/launch/trace';
import { inspectCapabilityToken } from '@/lib/security/capability-tokens';

describe('/api/feedback/submit', () => {
  const feedbackTokenId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();

    (createClient as any).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user-1',
              email: 'user@example.com',
            },
          },
          error: null,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'interviews') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    host_user_id: 'user-1',
                    participant_user_ids: [],
                    status: 'completed',
                    completed_at: '2026-03-10T09:00:00.000Z',
                  },
                  error: null,
                }),
              })),
            })),
          };
        }

        if (table === 'feedback_responses') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                    })),
                  })),
                })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'response-1' },
                  error: null,
                }),
              })),
            })),
          };
        }

        if (table === 'feedback_answers') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'interviews') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { completed_at: '2026-03-10T09:00:00.000Z' },
                }),
              })),
            })),
          };
        }

        if (table === 'feedback_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: { id: 'template-1' },
                      }),
                    })),
                  })),
                })),
              })),
            })),
          };
        }

        if (table === 'feedback_responses') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({
                data: [{ direction: 'candidate_to_org', shared_at: '2026-03-10T09:30:00.000Z' }],
              }),
            })),
          };
        }

        throw new Error(`Unexpected admin table ${table}`);
      }),
    });

    (isFeatureEnabled as any).mockResolvedValue(false);
    (markTokenUsed as any).mockResolvedValue({
      ok: true,
      token: { source_id: feedbackTokenId },
    });
    (inspectCapabilityToken as any).mockResolvedValue({
      ok: true,
      token: { source_id: feedbackTokenId },
    });
  });

  it('submits feedback and reports follow-up state', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({
          interviewId: '11111111-1111-1111-1111-111111111111',
          direction: 'candidate_to_org',
          overallScore: 4,
          structuredFeedback: {
            decisionState: 'closed',
            audienceVariant: 'organization',
            reasonCode: 'candidate_proof_coverage_insufficient',
            personalizedNote:
              'The interview signals were promising, but the strongest proof coverage stayed too thin for a confident final recommendation.',
            suggestedNextStep:
              'Request one more concrete proof artifact before moving this outcome forward.',
            authorRole: 'organization_member',
          },
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.responseId).toBe('response-1');
    expect(body.feedbackFollowUp).toMatchObject({
      overallState: 'on_track',
      candidateToOrg: 'submitted',
      orgToCandidate: 'pending',
      slaBreached: false,
    });
    expect(emitLaunchTrace).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: 'success',
        state: 'structured_feedback_submitted',
      })
    );
  });

  it('requires token redemption before writing token feedback', async () => {
    const feedbackInsert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: { id: 'response-token-1' },
          error: null,
        }),
      })),
    }));
    const answerInsert = vi.fn().mockResolvedValue({ error: null });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'feedback_tokens') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: feedbackTokenId,
                    interview_id: '33333333-3333-4333-8333-333333333333',
                    template_id: '44444444-4444-4444-8444-444444444444',
                    direction: 'candidate_to_org',
                    expires_at: '2026-05-08T10:00:00.000Z',
                    used_at: null,
                    recipient_email: 'candidate@example.com',
                  },
                  error: null,
                }),
              })),
            })),
          };
        }

        if (table === 'interviews') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { completed_at: '2026-03-10T09:00:00.000Z' },
                }),
              })),
            })),
          };
        }

        if (table === 'feedback_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: { id: '44444444-4444-4444-8444-444444444444' },
                      }),
                    })),
                  })),
                })),
              })),
            })),
          };
        }

        if (table === 'feedback_responses') {
          return {
            select: vi.fn((selection?: string) => {
              if (selection === 'id') {
                return {
                  eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                      eq: vi.fn(() => ({
                        limit: vi.fn(() => ({
                          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                        })),
                      })),
                    })),
                  })),
                };
              }

              return {
                eq: vi.fn().mockResolvedValue({
                  data: [{ direction: 'candidate_to_org', shared_at: '2026-03-10T09:30:00.000Z' }],
                }),
              };
            }),
            insert: feedbackInsert,
          };
        }

        if (table === 'feedback_answers') {
          return {
            insert: answerInsert,
          };
        }

        throw new Error(`Unexpected admin table ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/feedback/submit', {
        method: 'POST',
        headers: {
          cookie: 'feedback-cookie=redeem-session-1',
          'x-forwarded-for': '203.0.113.42',
          'user-agent': 'feedback-test-agent',
        },
        body: JSON.stringify({
          token: 'feedback-token',
          direction: 'candidate_to_org',
          answers: [
            {
              questionId: '55555555-5555-4555-8555-555555555555',
              score: 5,
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(markTokenUsed).toHaveBeenCalledWith('feedback-token', {
      redeemSessionNonce: 'redeem-session-1',
      ip: '203.0.113.42',
      userAgent: 'feedback-test-agent',
    });
    expect(feedbackInsert).toHaveBeenCalledTimes(1);
    expect((markTokenUsed as any).mock.invocationCallOrder[0]).toBeLessThan(
      feedbackInsert.mock.invocationCallOrder[0]
    );
    expect(answerInsert).toHaveBeenCalledTimes(1);
  });

  it('does not write token feedback when redemption fails', async () => {
    const feedbackInsert = vi.fn();
    (markTokenUsed as any).mockResolvedValueOnce({ ok: false, reason: 'invalid' });

    (createAdminClient as any).mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'feedback_tokens') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: feedbackTokenId,
                    interview_id: '33333333-3333-4333-8333-333333333333',
                    template_id: '44444444-4444-4444-8444-444444444444',
                    direction: 'candidate_to_org',
                    expires_at: '2026-05-08T10:00:00.000Z',
                    used_at: null,
                    recipient_email: 'candidate@example.com',
                  },
                  error: null,
                }),
              })),
            })),
          };
        }

        if (table === 'interviews') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { completed_at: '2026-03-10T09:00:00.000Z' },
                }),
              })),
            })),
          };
        }

        if (table === 'feedback_responses') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({ data: null }),
                    })),
                  })),
                })),
              })),
            })),
            insert: feedbackInsert,
          };
        }

        if (table === 'feedback_templates') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn().mockResolvedValue({
                        data: { id: '44444444-4444-4444-8444-444444444444' },
                      }),
                    })),
                  })),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected admin table ${table}`);
      }),
    });

    const response = await POST(
      new NextRequest('http://localhost/api/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({
          token: 'feedback-token',
          direction: 'candidate_to_org',
          answers: [
            {
              questionId: '55555555-5555-4555-8555-555555555555',
              score: 5,
            },
          ],
        }),
      })
    );

    expect(response.status).toBe(404);
    expect(feedbackInsert).not.toHaveBeenCalled();
  });
});
