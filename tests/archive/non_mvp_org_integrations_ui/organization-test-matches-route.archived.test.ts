import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { GET } from '@/app/api/organizations/[orgId]/test-matches/route';

function mockAuthenticatedUser(userId = 'user-1') {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: userId,
            email: 'owner@proofound.io',
          },
        },
      }),
    },
  });
}

function mockSelectWithLimit(result: any[]) {
  const limit = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ limit });
  const from = vi.fn().mockReturnValue({ where });
  (db.select as any).mockReturnValueOnce({ from });
}

function mockSelectWithJoinOrder(result: any[]) {
  const orderBy = vi.fn().mockResolvedValue(result);
  const where = vi.fn().mockReturnValue({ orderBy });
  const leftJoinSecond = vi.fn().mockReturnValue({ where });
  const leftJoinFirst = vi.fn().mockReturnValue({ leftJoin: leftJoinSecond, where, orderBy });
  const innerJoin = vi.fn().mockReturnValue({ leftJoin: leftJoinFirst });
  const from = vi.fn().mockReturnValue({ innerJoin });
  (db.select as any).mockReturnValueOnce({ from });
}

describe('GET /api/organizations/[orgId]/test-matches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthenticatedUser();
  });

  it('returns test matches with canInitiateTest=true for beta manager', async () => {
    mockSelectWithLimit([{ role: 'org_manager', status: 'active' }]);
    mockSelectWithJoinOrder([
      {
        matchId: 'match-1',
        assignmentId: 'assignment-1',
        assignmentRole: 'Designer',
        assignmentStatus: 'active',
        candidateProfileId: 'candidate-1',
        candidateDisplayName: 'Candidate One',
        candidateHandle: 'candidate-one',
        candidateAvatarUrl: null,
        conversationId: 'conversation-1',
        createdAt: new Date(),
      },
    ]);
    mockSelectWithLimit([{ isBetaTesting: true }]);

    const request = new NextRequest('http://localhost/api/organizations/org-1/test-matches');
    const response = await GET(request, { params: Promise.resolve({ orgId: 'org-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toHaveLength(1);
    expect(payload.permissions.canManage).toBe(true);
    expect(payload.permissions.canInitiateTest).toBe(true);
  });

  it('returns 403 when user is not an org member', async () => {
    mockSelectWithLimit([]);

    const request = new NextRequest('http://localhost/api/organizations/org-1/test-matches');
    const response = await GET(request, { params: Promise.resolve({ orgId: 'org-1' }) });

    expect(response.status).toBe(403);
  });
});
