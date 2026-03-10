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
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { emitLaunchTrace } from '@/lib/launch/trace';

describe('/api/feedback/submit', () => {
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
});
