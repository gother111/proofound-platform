import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  isActiveOrgMember: vi.fn(),
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
  interview = {
    id: 'interview-1',
    match_id: 'match-1',
    matches: {
      assignment_id: 'assignment-1',
      assignments: {
        org_id: 'org-1',
      },
    },
  },
  interviewError = null,
}: {
  user?: { id: string } | null;
  interview?: Record<string, unknown> | null;
  interviewError?: unknown;
} = {}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
        },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: interview,
            error: interviewError,
          }),
        }),
      }),
    })),
  };
}

describe('POST /api/decisions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(buildSupabase());
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
});
