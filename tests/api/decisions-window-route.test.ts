import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  isActiveOrgMember: vi.fn(),
  getDecisionWindow: vi.fn(),
  logInfo: vi.fn(),
  logError: vi.fn(),
  getInterviewAccessContext: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/api/auth', () => ({
  isActiveOrgMember: mocks.isActiveOrgMember,
}));

vi.mock('@/lib/decisions/automation', () => ({
  getDecisionWindow: mocks.getDecisionWindow,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: mocks.logInfo,
    error: mocks.logError,
  },
}));

vi.mock('@/lib/interviews/messaging', () => ({
  getInterviewAccessContext: mocks.getInterviewAccessContext,
}));

import { GET } from '@/app/api/decisions/window/[interviewId]/route';

function buildSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'interview-1',
              matches: {
                assignments: {
                  org_id: 'org-1',
                },
              },
            },
            error: null,
          }),
        }),
      }),
    })),
  };
}

describe('GET /api/decisions/window/[interviewId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockResolvedValue(buildSupabase());
    mocks.getDecisionWindow.mockResolvedValue({
      interviewId: 'interview-1',
      interviewCompletedAt: '2026-03-11T12:00:00.000Z',
      deadline: '2026-03-13T12:00:00.000Z',
      hoursRemaining: 18,
      isOverdue: false,
      remindersSent: 1,
    });
    mocks.getInterviewAccessContext.mockResolvedValue({
      interviewId: 'interview-1',
      orgId: 'org-1',
      candidateUserId: 'candidate-1',
      orgUserId: 'org-user-1',
    });
  });

  it('allows managers to view the decision window with canonical roles', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);

    const response = await GET(
      new NextRequest('https://example.com/api/decisions/window/interview-1'),
      {
        params: Promise.resolve({ interviewId: 'interview-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rank).toBeUndefined();
    expect(body.interviewId).toBe('interview-1');
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
      'org_manager',
    ]);
  });

  it('rejects reviewers because workflow visibility is owner/manager only', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(false);

    const response = await GET(
      new NextRequest('https://example.com/api/decisions/window/interview-1'),
      {
        params: Promise.resolve({ interviewId: 'interview-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toMatch(/unauthorized/i);
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
      'org_manager',
    ]);
  });
});
