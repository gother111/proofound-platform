import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  issueFeedbackInvites: vi.fn(),
  getFeedbackReminderSchedule: vi.fn(),
  resolveFeedbackFollowUpState: vi.fn(),
  recordInterviewTransition: vi.fn(),
  buildWorkflowView: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/feedback/service', () => ({
  issueFeedbackInvites: mocks.issueFeedbackInvites,
  getFeedbackReminderSchedule: mocks.getFeedbackReminderSchedule,
  resolveFeedbackFollowUpState: mocks.resolveFeedbackFollowUpState,
}));

vi.mock('@/lib/workflow/service', () => ({
  recordInterviewTransition: mocks.recordInterviewTransition,
  buildWorkflowView: mocks.buildWorkflowView,
}));

import { POST } from '@/app/api/interviews/complete/route';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('https://example.com/api/interviews/complete', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function buildSupabase({
  user = { id: 'host-1' },
  interview = {
    id: '11111111-1111-4111-8111-111111111111',
    host_user_id: 'host-1',
    participant_user_ids: ['host-1', 'candidate-1'],
    status: 'scheduled',
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    no_show_at: null,
    updated_at: new Date('2026-03-15T00:00:00.000Z').toISOString(),
  },
}: {
  user?: { id: string } | null;
  interview?: Record<string, unknown> | null;
} = {}) {
  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });
  const eq = vi.fn().mockReturnValue({
    maybeSingle: vi.fn().mockResolvedValue({
      data: interview,
      error: null,
    }),
  });
  const select = vi.fn().mockReturnValue({ eq });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error: null,
      }),
    },
    from: vi.fn(() => ({
      select,
      update,
    })),
  };
}

describe('POST /api/interviews/complete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(buildSupabase());
    mocks.recordInterviewTransition.mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'completed',
      completedAt: new Date('2026-03-15T00:00:00.000Z'),
      cancelledAt: null,
      cancelReason: null,
      noShowAt: null,
      updatedAt: new Date('2026-03-15T00:00:00.000Z'),
    });
    mocks.issueFeedbackInvites.mockResolvedValue([{ direction: 'candidate_to_org' }]);
    mocks.getFeedbackReminderSchedule.mockReturnValue([
      {
        checkpoint: '24h',
        scheduledAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    ]);
    mocks.resolveFeedbackFollowUpState.mockReturnValue({
      dueAt: new Date('2026-03-17T00:00:00.000Z'),
      overallState: 'due',
      candidateToOrg: 'due',
      orgToCandidate: 'due',
      slaBreached: false,
    });
    mocks.buildWorkflowView.mockReturnValue({ state: 'completed' });
  });

  it('returns success even if feedback invite issuance fails after completion', async () => {
    mocks.issueFeedbackInvites.mockRejectedValue(new Error('schema cache drift'));

    const response = await POST(
      buildRequest({ interviewId: '11111111-1111-4111-8111-111111111111' })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.recordInterviewTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewId: '11111111-1111-4111-8111-111111111111',
        toState: 'completed',
        actorId: 'host-1',
      })
    );
    expect(body.feedbackFollowUp).toMatchObject({
      issuedInvites: 0,
      warning: 'Feedback invites could not be issued immediately.',
      overallState: 'due',
    });
  });

  it('returns workflow state when the interview was already completed', async () => {
    mocks.createClient.mockResolvedValue(
      buildSupabase({
        interview: {
          id: '11111111-1111-4111-8111-111111111111',
          host_user_id: 'host-1',
          participant_user_ids: ['host-1', 'candidate-1'],
          status: 'completed',
          completed_at: '2026-03-15T00:00:00.000Z',
          cancelled_at: null,
          cancel_reason: null,
          no_show_at: null,
          updated_at: '2026-03-15T00:00:00.000Z',
        },
      })
    );

    const response = await POST(
      buildRequest({ interviewId: '11111111-1111-4111-8111-111111111111' })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Already completed');
    expect(body.workflow).toEqual({ state: 'completed' });
    expect(mocks.recordInterviewTransition).not.toHaveBeenCalled();
    expect(mocks.issueFeedbackInvites).not.toHaveBeenCalled();
    expect(mocks.buildWorkflowView).toHaveBeenCalledWith(
      expect.objectContaining({
        machine: 'interview',
        state: 'completed',
      })
    );
  });
});
