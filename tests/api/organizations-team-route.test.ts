import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  getCanonicalActiveOrgMembership: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { GET } from '@/app/api/organizations/[orgId]/team/route';
import { db } from '@/db';
import { requireApiAuthContext } from '@/lib/auth';
import { getCanonicalActiveOrgMembership } from '@/lib/api/auth';

const ORG_ID = 'org-1';

function mockTeamQuery({
  members,
  roleStats,
}: {
  members: Array<Record<string, unknown>>;
  roleStats: Array<{ role: string; count: number }>;
}) {
  const orderBy = vi.fn().mockResolvedValue(members);
  const whereMembers = vi.fn().mockReturnValue({ orderBy });
  const innerJoin = vi.fn().mockReturnValue({ where: whereMembers });
  const fromMembers = vi.fn().mockReturnValue({ innerJoin });

  const groupBy = vi.fn().mockResolvedValue(roleStats);
  const whereStats = vi.fn().mockReturnValue({ groupBy });
  const fromStats = vi.fn().mockReturnValue({ where: whereStats });

  (db.select as any)
    .mockReturnValueOnce({ from: fromMembers })
    .mockReturnValueOnce({ from: fromStats });
}

describe('GET /api/organizations/[orgId]/team', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: { from: vi.fn() },
    });
    (getCanonicalActiveOrgMembership as any).mockResolvedValue({
      role: 'org_owner',
      state: 'active',
      status: 'active',
    });
  });

  it('returns canonical member roles, canonical ordering, and canonical byRole stats', async () => {
    mockTeamQuery({
      members: [
        {
          userId: 'user-owner',
          role: 'org_owner',
          state: 'active',
          displayName: 'Owner',
          handle: 'owner',
          avatarUrl: null,
          createdAt: new Date('2026-03-01T10:00:00.000Z'),
        },
        {
          userId: 'user-manager',
          role: 'org_manager',
          state: 'active',
          displayName: 'Canonical Manager',
          handle: 'manager',
          avatarUrl: null,
          createdAt: new Date('2026-03-02T10:00:00.000Z'),
        },
        {
          userId: 'user-reviewer',
          role: 'org_reviewer',
          state: 'invited_pending',
          displayName: 'Reviewer',
          handle: 'reviewer',
          avatarUrl: null,
          createdAt: new Date('2026-03-03T10:00:00.000Z'),
        },
      ],
      roleStats: [
        { role: 'org_owner', count: 1 },
        { role: 'org_manager', count: 2 },
        { role: 'org_reviewer', count: 3 },
      ],
    });

    const response = await GET(
      new NextRequest(`http://localhost/api/organizations/${ORG_ID}/team`),
      {
        params: Promise.resolve({ orgId: ORG_ID }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.members.map((member: { role: string }) => member.role)).toEqual([
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);
    expect(body.members.map((member: { status: string }) => member.status)).toEqual([
      'active',
      'active',
      'invited_pending',
    ]);
    expect(body.stats).toEqual({
      total: 6,
      byRole: {
        org_owner: 1,
        org_manager: 2,
        org_reviewer: 3,
      },
    });
    expect(body.stats.owners).toBeUndefined();
    expect(body.stats.admins).toBeUndefined();
    expect(body.stats.members).toBeUndefined();
    expect(body.stats.viewers).toBeUndefined();
  });

  it('filters malformed member roles out of the response payload', async () => {
    mockTeamQuery({
      members: [
        {
          userId: 'user-invalid',
          role: 'owner',
          state: 'active',
          displayName: 'Legacy Owner',
          handle: 'legacy-owner',
          avatarUrl: null,
          createdAt: new Date('2026-03-01T10:00:00.000Z'),
        },
      ],
      roleStats: [{ role: 'owner', count: 1 }],
    });

    const response = await GET(
      new NextRequest(`http://localhost/api/organizations/${ORG_ID}/team`),
      {
        params: Promise.resolve({ orgId: ORG_ID }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.members).toEqual([]);
    expect(body.stats).toEqual({
      total: 0,
      byRole: {
        org_owner: 0,
        org_manager: 0,
        org_reviewer: 0,
      },
    });
  });

  it('returns 403 when caller is not an active org member', async () => {
    (getCanonicalActiveOrgMembership as any).mockResolvedValue(null);

    const response = await GET(
      new NextRequest(`http://localhost/api/organizations/${ORG_ID}/team`),
      {
        params: Promise.resolve({ orgId: ORG_ID }),
      }
    );

    expect(response.status).toBe(403);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('returns 403 when a legacy membership row cannot be normalized to a canonical role', async () => {
    (getCanonicalActiveOrgMembership as any).mockResolvedValue(null);

    const response = await GET(
      new NextRequest(`http://localhost/api/organizations/${ORG_ID}/team`),
      {
        params: Promise.resolve({ orgId: ORG_ID }),
      }
    );

    expect(response.status).toBe(403);
    expect(db.select).not.toHaveBeenCalled();
  });
});
