import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { POST } from '@/app/api/candidate-invites/[token]/claim/route';

function mockAuthUser(user: { id: string; email: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user,
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

describe('POST /api/candidate-invites/[token]/claim', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 for unauthenticated user', async () => {
    mockAuthUser(null);

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    expect(response.status).toBe(401);
  });

  it('returns 403 when user email does not match invite email', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'different@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: null,
      },
    ]);

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    expect(response.status).toBe(403);
  });

  it('claims invite when email matches and persona is individual', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        claimedByProfileId: null,
      },
    ]);
    mockSelectWithLimit([
      {
        id: '11111111-1111-1111-1111-111111111111',
        persona: 'individual',
      },
    ]);

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    (db.update as any).mockReturnValue({ set: updateSet });

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.status).toBe('claimed');
    expect(updateSet).toHaveBeenCalledTimes(1);
  });

  it('creates test match and conversation for test_match invite acceptance', async () => {
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });

    mockSelectWithLimit([
      {
        id: 'invite-1',
        orgId: 'org-1',
        assignmentId: 'assignment-1',
        flowType: 'test_match',
        inviteeEmailNormalized: 'candidate@example.com',
        status: 'pending',
        expiresAt: new Date(Date.now() + 60_000),
        invitedBy: 'org-rep-1',
        claimedByProfileId: null,
        claimedAt: null,
        acceptedAt: null,
        matchId: null,
        conversationId: null,
      },
    ]);
    mockSelectWithLimit([
      {
        id: '11111111-1111-1111-1111-111111111111',
        persona: 'individual',
      },
    ]);

    const txSelect = vi
      .fn()
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'assignment-1', orgId: 'org-1' }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ userId: 'org-rep-1', role: 'owner' }]),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

    const matchReturning = vi.fn().mockResolvedValue([{ id: 'match-1' }]);
    const matchOnConflict = vi.fn().mockReturnValue({ returning: matchReturning });
    const matchValues = vi.fn().mockReturnValue({ onConflictDoUpdate: matchOnConflict });

    const conversationReturning = vi.fn().mockResolvedValue([{ id: 'conversation-1' }]);
    const conversationValues = vi.fn().mockReturnValue({ returning: conversationReturning });

    const txInsert = vi
      .fn()
      .mockReturnValueOnce({ values: matchValues })
      .mockReturnValueOnce({ values: conversationValues });

    const txUpdateWhere = vi.fn().mockResolvedValue(undefined);
    const txUpdateSet = vi.fn().mockReturnValue({ where: txUpdateWhere });
    const txUpdate = vi.fn().mockReturnValue({ set: txUpdateSet });

    (db.transaction as any).mockImplementation(async (callback: any) =>
      callback({
        select: txSelect,
        insert: txInsert,
        update: txUpdate,
      })
    );

    const request = new NextRequest('http://localhost/api/candidate-invites/token/claim', {
      method: 'POST',
    });

    const response = await POST(request, { params: Promise.resolve({ token: 'token-value' }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.matchId).toBe('match-1');
    expect(payload.conversationId).toBe('conversation-1');
    expect(matchOnConflict).toHaveBeenCalled();
    expect(txUpdateSet).toHaveBeenCalled();
  });
});
