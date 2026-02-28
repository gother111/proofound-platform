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
import { GET } from '@/app/api/match/test/route';

function mockAuthUser(user: { id: string; email: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
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
  const leftJoin = vi.fn().mockReturnValue({ where });
  const innerJoinSecond = vi.fn().mockReturnValue({ leftJoin });
  const innerJoinFirst = vi.fn().mockReturnValue({ innerJoin: innerJoinSecond });
  const from = vi.fn().mockReturnValue({ innerJoin: innerJoinFirst });
  (db.select as any).mockReturnValueOnce({ from });
}

describe('GET /api/match/test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated users', async () => {
    mockAuthUser(null);

    const response = await GET(new NextRequest('http://localhost/api/match/test'));
    expect(response.status).toBe(401);
  });

  it('returns current user test matches', async () => {
    mockAuthUser({ id: 'user-1', email: 'candidate@example.com' });
    mockSelectWithLimit([{ id: 'user-1' }]);
    mockSelectWithJoinOrder([
      {
        matchId: 'match-1',
        assignmentId: 'assignment-1',
        assignmentRole: 'Designer',
        assignmentStatus: 'active',
        orgId: 'org-1',
        orgSlug: 'acme',
        orgDisplayName: 'Acme Org',
        conversationId: 'conversation-1',
        createdAt: new Date(),
      },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/match/test'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].matchId).toBe('match-1');
  });
});
