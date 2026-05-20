import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  isActiveOrgMember: vi.fn(),
  getInterviewAccessContext: vi.fn(),
  buildWorkflowView: vi.fn(),
  recordDecisionTransition: vi.fn(),
  withWorkflowMutationIdempotency: vi.fn(),
  logInfo: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/api/auth', () => ({
  isActiveOrgMember: mocks.isActiveOrgMember,
}));

vi.mock('@/lib/interviews/messaging', () => ({
  getInterviewAccessContext: mocks.getInterviewAccessContext,
}));

vi.mock('@/lib/workflow/service', () => ({
  buildWorkflowView: mocks.buildWorkflowView,
  recordDecisionTransition: mocks.recordDecisionTransition,
}));

vi.mock('@/lib/api/workflow-idempotency', () => ({
  withWorkflowMutationIdempotency: mocks.withWorkflowMutationIdempotency,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    warn: mocks.logWarn,
    error: mocks.logError,
  },
}));

import { POST } from '@/app/api/decisions/route';

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest('https://example.com/api/decisions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function buildRawRequest(body: string) {
  return new NextRequest('https://example.com/api/decisions', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

function buildSupabase({
  user = { id: 'user-1' },
}: {
  user?: { id: string } | null;
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
      }),
    },
  };
}

describe('POST /api/decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(buildSupabase());
    mocks.getInterviewAccessContext.mockResolvedValue({
      interviewId: 'interview-1',
      matchId: 'match-1',
      orgId: 'org-1',
      candidateId: 'candidate-1',
      status: 'completed',
      scheduledAt: new Date('2026-03-15T00:00:00.000Z'),
      platform: 'manual',
      meetingUrl: 'https://example.com/manual-room',
      timezone: 'UTC',
      rescheduleCount: 1,
    });
    mocks.buildWorkflowView.mockReturnValue({
      state: 'completed',
      allowedActions: [],
    });
    mocks.recordDecisionTransition.mockResolvedValue({
      id: 'decision-1',
      state: 'hire',
      holdUntil: null,
      reasonCode: null,
      updatedAt: '2026-03-12T10:00:00.000Z',
      workflow: { state: 'hire' },
      engagementVerification: {
        id: 'engagement-1',
        status: 'pending_both_confirmations',
        createdAt: '2026-03-12T10:00:00.000Z',
      },
    });
    mocks.withWorkflowMutationIdempotency.mockImplementation(
      async (
        _request: unknown,
        _scope: unknown,
        _payload: unknown,
        handler: () => Promise<Response>
      ) => handler()
    );
  });

  it('rejects malformed JSON before decision workflow lookups', async () => {
    const response = await POST(buildRawRequest('{"interviewId":'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.getInterviewAccessContext).not.toHaveBeenCalled();
    expect(mocks.isActiveOrgMember).not.toHaveBeenCalled();
    expect(mocks.withWorkflowMutationIdempotency).not.toHaveBeenCalled();
    expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
  });

  it('allows org owners to record final decisions', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);

    const response = await POST(
      buildRequest({
        interviewId: 'interview-1',
        decision: 'hire',
        feedback: 'Strong closeout',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
    ]);
    expect(mocks.recordDecisionTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewId: 'interview-1',
        toState: 'hire',
        actorId: 'user-1',
      })
    );
    expect(body.engagementVerification).toEqual({
      id: 'engagement-1',
      status: 'pending_both_confirmations',
      createdAt: '2026-03-12T10:00:00.000Z',
    });
  });

  it('accepts withdraw as an explicit terminal decision state', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);
    mocks.recordDecisionTransition.mockResolvedValue({
      id: 'decision-2',
      state: 'withdraw',
      holdUntil: null,
      reasonCode: 'candidate_withdrew',
      updatedAt: '2026-03-12T11:00:00.000Z',
      workflow: { state: 'withdraw' },
      engagementVerification: null,
    });

    const response = await POST(
      buildRequest({
        interviewId: 'interview-1',
        decision: 'withdraw',
        reasonCode: 'candidate_withdrew',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.recordDecisionTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interviewId: 'interview-1',
        toState: 'withdraw',
        reasonCode: 'candidate_withdrew',
      })
    );
  });

  it('rejects managers and reviewers because final decisions are owner-only', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(false);

    const response = await POST(
      buildRequest({
        interviewId: 'interview-1',
        decision: 'reject',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/unauthorized/i);
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
    ]);
    expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
  });

  it.each(['inactive', 'suspended', 'unknown_state'])(
    'rejects final decisions when owner membership access resolves as non-active for %s state',
    async () => {
      mocks.isActiveOrgMember.mockResolvedValue(false);

      const response = await POST(
        buildRequest({
          interviewId: 'interview-1',
          decision: 'hire',
        })
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toMatch(/unauthorized/i);
      expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
        'org_owner',
      ]);
      expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
    }
  );

  it('rejects non-canonical decision aliases so hire remains explicit', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);

    const response = await POST(
      buildRequest({
        interviewId: 'interview-1',
        decision: 'pass',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('decision must be one of');
    expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
  });

  it('rejects decisions before the interview is completed and returns the legal next action', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);
    mocks.getInterviewAccessContext.mockResolvedValue({
      interviewId: 'interview-1',
      matchId: 'match-1',
      orgId: 'org-1',
      candidateId: 'candidate-1',
      status: 'scheduled',
      scheduledAt: new Date('2026-03-15T00:00:00.000Z'),
      platform: 'manual',
      meetingUrl: 'https://example.com/manual-room',
      timezone: 'UTC',
      rescheduleCount: 1,
    });
    mocks.buildWorkflowView.mockReturnValue({
      state: 'scheduled',
      displayState: 'Scheduled',
      allowedActions: [{ id: 'complete_interview' }],
    });

    const response = await POST(
      buildRequest({
        interviewId: 'interview-1',
        decision: 'hire',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual(
      expect.objectContaining({
        code: 'DECISION_NOT_READY',
        nextAction: expect.objectContaining({
          id: 'record_interview_outcome',
        }),
        workflow: expect.objectContaining({
          state: 'scheduled',
        }),
      })
    );
    expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
  });

  it('replays duplicate decision requests without recording another transition', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);
    mocks.withWorkflowMutationIdempotency.mockResolvedValue(
      Response.json(
        {
          success: true,
          decision: {
            id: 'decision-1',
            interviewId: 'interview-1',
            decision: 'hire',
            workflow: { state: 'hire' },
          },
          engagementVerification: { id: 'engagement-1' },
        },
        {
          headers: {
            'Idempotency-Replayed': 'true',
          },
        }
      )
    );

    const response = await POST(
      buildRequest({
        interviewId: 'interview-1',
        decision: 'hire',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Idempotency-Replayed')).toBe('true');
    expect(body.decision.id).toBe('decision-1');
    expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
  });

  it('rejects same-key decision replay with a changed body before mutation', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);
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
      buildRequest({
        interviewId: 'interview-1',
        decision: 'reject',
        feedback: 'Changed payload',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.code).toBe('IDEMPOTENCY_REPLAY_MISMATCH');
    expect(mocks.recordDecisionTransition).not.toHaveBeenCalled();
  });
});
