import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  isActiveOrgMember: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/lib/api/auth', () => ({
  isActiveOrgMember: mocks.isActiveOrgMember,
}));

vi.mock('@/db', () => ({
  db: {
    select: mocks.select,
    insert: mocks.insert,
    update: mocks.update,
    delete: mocks.delete,
  },
}));

import { GET, POST } from '@/app/api/organizations/[orgId]/ownership/route';
import { PUT } from '@/app/api/organizations/[orgId]/ownership/[ownershipId]/route';

describe('organization ownership routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
      supabase: { id: 'supabase' },
    });
  });

  it('allows canonical reviewers to read ownership records', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);

    const orderBy = vi.fn().mockResolvedValue([{ id: 'ownership-1' }]);
    const where = vi.fn().mockReturnValue({ orderBy });
    const from = vi.fn().mockReturnValue({ where });
    mocks.select.mockReturnValue({ from });

    const response = await GET(
      new NextRequest('https://example.com/api/organizations/org-1/ownership'),
      {
        params: Promise.resolve({ orgId: 'org-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ownership).toEqual([{ id: 'ownership-1' }]);
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
      'org_manager',
      'org_reviewer',
    ]);
  });

  it('rejects managers from creating ownership records', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(false);

    const response = await POST(
      new NextRequest('https://example.com/api/organizations/org-1/ownership', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'individual',
          entityName: 'Founder',
          controlType: 'management',
          isPublic: true,
        }),
      }),
      {
        params: Promise.resolve({ orgId: 'org-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
    ]);
  });

  it('allows owners to update ownership records', async () => {
    mocks.isActiveOrgMember.mockResolvedValue(true);

    const returning = vi.fn().mockResolvedValue([{ id: 'ownership-1', entityName: 'Founder' }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.update.mockReturnValue({ set });

    const response = await PUT(
      new NextRequest('https://example.com/api/organizations/org-1/ownership/ownership-1', {
        method: 'PUT',
        body: JSON.stringify({
          entityType: 'individual',
          entityName: 'Founder',
          controlType: 'management',
          isPublic: true,
        }),
      }),
      {
        params: Promise.resolve({ orgId: 'org-1', ownershipId: 'ownership-1' }),
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.entityName).toBe('Founder');
    expect(mocks.isActiveOrgMember).toHaveBeenCalledWith(expect.anything(), 'user-1', 'org-1', [
      'org_owner',
    ]);
  });
});
