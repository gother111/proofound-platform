import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  isActiveOrgMember: vi.fn(),
  getInterviewAccessContext: vi.fn(),
  recordDecisionTransition: vi.fn(),
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
  recordDecisionTransition: mocks.recordDecisionTransition,
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
      platform: 'zoom',
      meetingUrl: 'https://zoom.us/j/meeting',
      timezone: 'UTC',
      rescheduleCount: 1,
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
      },
    });
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
    });
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
});
