import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/organizations/[orgId]/team/route';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

function createMembershipCheckResult(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(data),
      }),
    }),
  };
}

function createMembersResult(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue(data),
        }),
      }),
    }),
  };
}

describe('GET /api/organizations/[orgId]/team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns canonical team roles and canonical byRole stats', async () => {
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    vi.mocked(db.select)
      .mockReturnValueOnce(
        createMembershipCheckResult([{ userId: 'user-1', role: 'org_owner' }]) as any
      )
      .mockReturnValueOnce(
        createMembersResult([
          {
            userId: 'owner-user',
            role: 'owner',
            status: 'active',
            displayName: 'Owner',
            handle: 'owner',
            avatarUrl: null,
            createdAt: '2026-03-17T00:00:00.000Z',
          },
          {
            userId: 'manager-user',
            role: 'admin',
            status: 'active',
            displayName: 'Manager',
            handle: 'manager',
            avatarUrl: null,
            createdAt: '2026-03-17T00:00:00.000Z',
          },
          {
            userId: 'reviewer-user',
            role: 'member',
            status: 'active',
            displayName: 'Reviewer',
            handle: 'reviewer',
            avatarUrl: null,
            createdAt: '2026-03-17T00:00:00.000Z',
          },
          {
            userId: 'viewer-user',
            role: 'viewer',
            status: 'active',
            displayName: 'Viewer',
            handle: 'viewer',
            avatarUrl: null,
            createdAt: '2026-03-17T00:00:00.000Z',
          },
        ]) as any
      );

    const response = await GET(new NextRequest('http://localhost/api/organizations/org-1/team'), {
      params: Promise.resolve({ orgId: 'org-1' }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.members).toEqual([
      expect.objectContaining({ userId: 'owner-user', role: 'org_owner' }),
      expect.objectContaining({ userId: 'manager-user', role: 'org_manager' }),
      expect.objectContaining({ userId: 'reviewer-user', role: 'org_reviewer' }),
      expect.objectContaining({ userId: 'viewer-user', role: 'org_reviewer' }),
    ]);
    expect(body.stats).toEqual({
      total: 4,
      byRole: {
        org_owner: 1,
        org_manager: 1,
        org_reviewer: 2,
      },
    });
  });
});
