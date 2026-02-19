import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/assignments/[id]/publish/route';
import { db } from '@/db';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

vi.mock('@/lib/assignments/access', () => ({
  verifyAssignmentMutationAccess: vi.fn(() => Promise.resolve({ status: 'ok' })),
}));

vi.mock('@/lib/assignments/activation', () => ({
  checkAndEmitAssignmentActivation: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/db', () => {
  const returning = vi.fn();
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));

  return {
    db: {
      query: {
        assignments: {
          findFirst: vi.fn(),
        },
        assignmentOutcomes: {
          findMany: vi.fn(),
        },
      },
      update,
      __mocks: {
        returning,
      },
    },
  };
});

describe('Assignment publish API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when required publish sections are missing', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: 'assignment-1',
      orgId: 'org-1',
      role: 'Role',
      businessValue: null,
      mustHaveSkills: [],
      locationMode: null,
      city: null,
      country: null,
      compMin: null,
      compMax: null,
      createdAt: new Date(),
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/assignments/assignment-1/publish', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'assignment-1' }) });
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toContain('not ready');
    expect(payload.details.missing).toEqual(
      expect.arrayContaining([
        'businessValue',
        'mustHaveSkills',
        'location',
        'compensation',
        'outcomes',
      ])
    );
  });

  it('publishes assignment when required sections are complete', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: 'assignment-1',
      orgId: 'org-1',
      role: 'Role',
      businessValue: 'Business value',
      mustHaveSkills: [{ id: 'skill-1', level: 3 }],
      locationMode: 'remote',
      city: null,
      country: null,
      compMin: 100000,
      compMax: 150000,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);
    (db as any).__mocks.returning.mockResolvedValue([
      {
        id: 'assignment-1',
        orgId: 'org-1',
        role: 'Role',
        status: 'active',
        creationStatus: 'published',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const req = new NextRequest('http://localhost/api/assignments/assignment-1/publish', {
      method: 'POST',
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'assignment-1' }) });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment.status).toBe('active');
    expect(payload.assignment.creationStatus).toBe('published');
    expect(db.update as any).toHaveBeenCalled();
  });
});
