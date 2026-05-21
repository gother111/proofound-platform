import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  verifyExplicitAssignmentMutationAccess: vi.fn(),
  deleteWhere: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/lib/assignments/access', () => ({
  verifyExplicitAssignmentAccess: vi.fn(),
  verifyExplicitAssignmentMutationAccess: mocks.verifyExplicitAssignmentMutationAccess,
}));

vi.mock('@/db', () => ({
  db: {
    delete: vi.fn(() => ({
      where: mocks.deleteWhere,
    })),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  assignmentExpertiseMatrix: {
    assignmentId: 'assignment_id',
  },
  assignmentCreationPipeline: {
    assignmentId: 'assignment_id',
    stepOrder: 'step_order',
    id: 'id',
  },
  assignmentOutcomes: {
    assignmentId: 'assignment_id',
  },
  assignments: {
    id: 'id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field: string, value: unknown) => ({ op: 'eq', field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { POST as saveExpertiseMatrix } from '@/app/api/assignments/[id]/expertise-matrix/route';
import { POST as saveOutcomes } from '@/app/api/assignments/[id]/outcomes/route';
import { db } from '@/db';

describe('assignment mutation JSON boundaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
  });

  it('returns 400 for malformed expertise matrix JSON before access or writes', async () => {
    const response = await saveExpertiseMatrix(
      new NextRequest('http://localhost/api/assignments/assignment-1/expertise-matrix', {
        method: 'POST',
        body: '{',
      }),
      { params: Promise.resolve({ id: 'assignment-1' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(mocks.verifyExplicitAssignmentMutationAccess).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed outcomes JSON before access or writes', async () => {
    const response = await saveOutcomes(
      new NextRequest('http://localhost/api/assignments/assignment-1/outcomes', {
        method: 'POST',
        body: '{',
      }),
      { params: Promise.resolve({ id: 'assignment-1' }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(mocks.verifyExplicitAssignmentMutationAccess).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });
});
