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
    vi.unstubAllEnvs();
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

  it('serves visual fixture outcome saves without touching persistence', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    mocks.verifyExplicitAssignmentMutationAccess.mockResolvedValue({
      status: 'ok',
      orgId: '99999999-9999-4999-9999-999999999999',
      role: 'org_manager',
      membershipId: 'visual-assignment-membership',
    });

    const response = await saveOutcomes(
      new NextRequest(
        'http://localhost/api/assignments/22222222-2222-4222-8222-222222222222/outcomes?orgSlug=test-org',
        {
          method: 'POST',
          body: JSON.stringify({
            outcomes: [
              {
                outcomeType: 'continuous',
                title: 'Readiness notes published',
                description: 'Target: weekly notes in 30 days',
                metrics: [{ name: 'Notes', target: '4', unit: 'count' }],
              },
            ],
          }),
        }
      ),
      { params: Promise.resolve({ id: '22222222-2222-4222-8222-222222222222' }) }
    );

    await expect(response.json()).resolves.toEqual({ success: true, count: 1 });
    expect(response.status).toBe(200);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it('serves visual fixture expertise saves without touching persistence', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    mocks.verifyExplicitAssignmentMutationAccess.mockResolvedValue({
      status: 'ok',
      orgId: '99999999-9999-4999-9999-999999999999',
      role: 'org_manager',
      membershipId: 'visual-assignment-membership',
    });

    const response = await saveExpertiseMatrix(
      new NextRequest(
        'http://localhost/api/assignments/22222222-2222-4222-8222-222222222222/expertise-matrix?orgSlug=test-org',
        {
          method: 'POST',
          body: JSON.stringify({
            expertiseMatrix: [
              {
                skillCode: 'program-operations',
                requiredLevel: 4,
                stakeholderRole: 'must',
              },
            ],
          }),
        }
      ),
      { params: Promise.resolve({ id: '22222222-2222-4222-8222-222222222222' }) }
    );

    await expect(response.json()).resolves.toEqual({ success: true, count: 1 });
    expect(response.status).toBe(200);
    expect(db.delete).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});
