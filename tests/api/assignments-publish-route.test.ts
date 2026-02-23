import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/assignments/[id]/publish/route';
import { db } from '@/db';
import { requireAuth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      assignmentOutcomes: { findMany: vi.fn() },
      organizationMembers: { findFirst: vi.fn() },
      organizations: { findFirst: vi.fn() },
    },
    update: vi.fn(),
  },
}));

vi.mock('@/lib/assignments/activation', () => ({
  checkAndEmitAssignmentActivation: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('assignment publish route', () => {
  const assignmentId = '11111111-1111-1111-1111-111111111111';
  const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const userId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('publishes assignment for authorized org member', async () => {
    (requireAuth as any).mockResolvedValue({ id: userId });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({
      userId,
      orgId,
      role: 'owner',
    });

    const updateReturning = vi.fn().mockResolvedValue([
      {
        id: assignmentId,
        orgId,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'active',
        creationStatus: 'published',
      },
    ]);
    const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    (db.update as any).mockReturnValue({ set: updateSet });

    const req = new NextRequest(
      `http://localhost/api/assignments/${assignmentId}/publish?orgSlug=proofound-org`,
      { method: 'POST' }
    );

    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      slug: 'proofound-org',
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment.status).toBe('active');
    expect(payload.assignment.creationStatus).toBe('published');
  });

  it('rejects publish when org slug does not match assignment org', async () => {
    (requireAuth as any).mockResolvedValue({ id: userId });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({
      userId,
      orgId,
      role: 'owner',
    });
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      slug: 'other-org',
    });

    const req = new NextRequest(
      `http://localhost/api/assignments/${assignmentId}/publish?orgSlug=other-org`,
      { method: 'POST' }
    );

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });

    expect(res.status).toBe(403);
  });

  it('rejects publish for non-admin org roles', async () => {
    (requireAuth as any).mockResolvedValue({ id: userId });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
    });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({
      userId,
      orgId,
      role: 'member',
    });

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    expect(res.status).toBe(403);
  });
});
