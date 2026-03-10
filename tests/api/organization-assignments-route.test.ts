import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/organizations/[orgId]/assignments/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: { findFirst: vi.fn() },
      assignmentInvitations: { findMany: vi.fn() },
    },
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const params = { params: Promise.resolve({ orgId: 'org-1' }) };

describe('organizations assignments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when caller is unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Unauthorized' },
        }),
      },
    } as any);

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/assignments'),
      params
    );

    expect(response.status).toBe(401);
  });

  it('returns 403 when caller is not an active member', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    } as any);
    (db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/assignments'),
      params
    );

    expect(response.status).toBe(403);
  });

  it('returns 403 when caller role is org reviewer', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    } as any);
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({ role: 'org_reviewer' });

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/assignments'),
      params
    );

    expect(response.status).toBe(403);
  });

  it('returns assignments for org manager members', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    } as any);
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({ role: 'org_manager' });
    (db.query.assignmentInvitations.findMany as any).mockResolvedValue([
      { id: 'invite-1', orgId: 'org-1' },
    ]);

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/assignments'),
      params
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.assignments).toHaveLength(1);
    expect(db.query.assignmentInvitations.findMany).toHaveBeenCalledTimes(1);
  });
});
