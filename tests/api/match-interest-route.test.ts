import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/core/matching/interest/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      organizationMembers: { findFirst: vi.fn(), findMany: vi.fn() },
      conversations: { findFirst: vi.fn() },
      profiles: { findFirst: vi.fn() },
    },
    transaction: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitMatchActioned: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyIntroAccepted: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/readiness/individual-state', () => ({
  getIndividualReadinessState: vi.fn(),
}));

describe('match interest route', () => {
  const assignmentId = '11111111-1111-1111-1111-111111111111';
  const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgRepId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const candidateId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
    (getIndividualReadinessState as any).mockResolvedValue({
      flags: {
        qualifiedIntroReady: true,
      },
    });
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
  });

  it('rejects org-side interest when actor is not an active org member', async () => {
    (requireAuth as any).mockResolvedValue({ id: orgRepId });
    (db.query.assignments.findFirst as any).mockResolvedValue({ id: assignmentId, orgId });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId,
        targetProfileId: candidateId,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('creates conversation when candidate interest meets existing org interest', async () => {
    (requireAuth as any).mockResolvedValue({ id: candidateId });
    (db.query.assignments.findFirst as any).mockResolvedValue({ id: assignmentId, orgId });
    (db.query.conversations.findFirst as any).mockResolvedValue(null);

    const txOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const txInsertValues = vi.fn().mockReturnValue({ onConflictDoNothing: txOnConflictDoNothing });
    const txInsert = vi.fn().mockReturnValue({ values: txInsertValues });
    const txMatchInterestFind = vi
      .fn()
      .mockResolvedValueOnce([
        { actorProfileId: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
        { actorProfileId: orgRepId },
      ]);
    const txOrgMembershipFindMany = vi.fn().mockResolvedValue([{ userId: orgRepId }]);

    (db.transaction as any).mockImplementation(async (callback: any) =>
      callback({
        query: {
          matchInterest: { findMany: txMatchInterestFind },
          organizationMembers: { findMany: txOrgMembershipFindMany },
        },
        insert: txInsert,
      })
    );

    const selectLimit = vi.fn().mockResolvedValue([]);
    const selectWhere = vi.fn().mockReturnValue({ limit: selectLimit });
    const selectFrom = vi.fn().mockReturnValue({ where: selectWhere });
    (db.select as any).mockReturnValue({ from: selectFrom });

    const insertReturning = vi.fn().mockResolvedValue([{ id: 'conv-1' }]);
    const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
    (db.insert as any).mockReturnValue({ values: insertValues });

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.revealed).toBe(true);
    expect(payload.conversationId).toBe('conv-1');
    expect(txInsertValues).toHaveBeenCalledWith({
      actorProfileId: candidateId,
      assignmentId,
      targetProfileId: null,
    });
    expect(txOnConflictDoNothing).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.any(Array) })
    );
  });
});
