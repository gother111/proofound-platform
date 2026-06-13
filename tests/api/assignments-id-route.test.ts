import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { DELETE, GET, PUT } from '@/app/api/assignments/[id]/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';
import {
  verifyExplicitAssignmentAccess,
  verifyExplicitAssignmentMutationAccess,
} from '@/lib/assignments/access';
import { checkAndEmitAssignmentActivation } from '@/lib/assignments/activation';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/assignments/access', () => ({
  verifyAssignmentAccess: vi.fn(),
  verifyExplicitAssignmentAccess: vi.fn(),
  verifyExplicitAssignmentMutationAccess: vi.fn(),
}));

vi.mock('@/lib/assignments/activation', () => ({
  checkAndEmitAssignmentActivation: vi.fn(),
}));

vi.mock('@/db', () => {
  const update = vi.fn();
  const remove = vi.fn();
  const transaction = vi.fn(async (cb: any) =>
    cb({
      update,
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
      insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue(undefined) })),
    })
  );

  return {
    db: {
      query: {
        assignments: { findFirst: vi.fn() },
        assignmentOutcomes: { findMany: vi.fn() },
        assignmentExpertiseMatrix: { findMany: vi.fn() },
      },
      update,
      delete: remove,
      transaction,
    },
  };
});

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const params = { params: Promise.resolve({ id: 'assignment-1' }) };
const principalOrgId = '11111111-1111-4111-8111-111111111111';

function rawRequest(body: string) {
  return new NextRequest('http://localhost/api/assignments/assignment-1', {
    method: 'PUT',
    body,
    headers: { 'content-type': 'application/json' },
  });
}

describe('assignment [id] mutation routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
  });

  it('GET requires explicit organization context', async () => {
    (verifyExplicitAssignmentAccess as any).mockResolvedValue({
      status: 'missing_org_context',
    });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1');

    const res = await GET(req, params);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe('Organization context is required');
  });

  it('GET denies wrong organization context without falling back', async () => {
    (verifyExplicitAssignmentAccess as any).mockResolvedValue({
      status: 'membership_not_found',
    });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1?orgSlug=org-b');

    const res = await GET(req, params);

    expect(res.status).toBe(404);
  });

  it('GET does not let mock mode bypass explicit assignment access', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    (verifyExplicitAssignmentAccess as any).mockResolvedValue({
      status: 'missing_org_context',
    });

    const req = new NextRequest(
      'http://localhost/api/assignments/22222222-2222-4222-8222-222222222222'
    );

    const res = await GET(req, {
      params: Promise.resolve({ id: '22222222-2222-4222-8222-222222222222' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe('Organization context is required');
    expect(verifyExplicitAssignmentAccess).toHaveBeenCalledWith(
      'user-1',
      '22222222-2222-4222-8222-222222222222',
      { orgId: null, orgSlug: null }
    );
    expect(db.query.assignments.findFirst).not.toHaveBeenCalled();
  });

  it('serves visual fixture assignment updates without touching persistence', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      orgId: '99999999-9999-4999-9999-999999999999',
      role: 'org_manager',
      membershipId: 'visual-assignment-membership',
    });

    const req = new NextRequest(
      'http://localhost/api/assignments/22222222-2222-4222-8222-222222222222',
      {
        method: 'PUT',
        body: JSON.stringify({
          orgSlug: 'test-org',
          title: 'Updated visual draft',
          rolePurpose: 'Keep visual assignment QA writable without persistence.',
          status: 'draft',
          creationStatus: 'assignment_ready',
          mustHaveSkills: [{ id: 'program-operations', label: 'Program operations', level: 4 }],
        }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: '22222222-2222-4222-8222-222222222222' }),
    });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment).toMatchObject({
      id: '22222222-2222-4222-8222-222222222222',
      orgId: '99999999-9999-4999-9999-999999999999',
      role: 'Updated visual draft',
      businessValue: 'Keep visual assignment QA writable without persistence.',
      creationStatus: 'assignment_ready',
    });
    expect(db.transaction).not.toHaveBeenCalled();
    expect(checkAndEmitAssignmentActivation).not.toHaveBeenCalled();
  });

  it('GET returns an assignment for active members with explicit organization context', async () => {
    (verifyExplicitAssignmentAccess as any).mockResolvedValue({
      status: 'ok',
      role: 'org_reviewer',
      orgId: principalOrgId,
      membershipId: 'membership-1',
    });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: 'assignment-1',
      orgId: principalOrgId,
      role: 'Proof Reviewer',
      engagementType: 'full_time',
      businessValue: 'Review proof',
      description: 'Review proof packs',
      expectedImpact: 'Better signal',
      status: 'draft',
      creationStatus: 'draft',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([]);
    (db.query.assignmentExpertiseMatrix.findMany as any).mockResolvedValue([]);

    const req = new NextRequest(
      `http://localhost/api/assignments/assignment-1?orgId=${principalOrgId}`
    );

    const res = await GET(req, params);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment.orgId).toBe(principalOrgId);
  });

  it('PUT returns 403 for reviewer role', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'insufficient_role',
      role: 'org_reviewer',
    });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'PUT',
      body: JSON.stringify({
        role: 'Updated role',
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await PUT(req, params);
    expect(res.status).toBe(403);
  });

  it('PUT returns 404 for non-members', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'membership_not_found',
    });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'PUT',
      body: JSON.stringify({
        role: 'Updated role',
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await PUT(req, params);
    expect(res.status).toBe(404);
  });

  it('PUT does not let mock mode bypass assignment mutation access', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'membership_not_found',
    });

    const req = new NextRequest(
      'http://localhost/api/assignments/22222222-2222-4222-8222-222222222222',
      {
        method: 'PUT',
        body: JSON.stringify({
          role: 'Updated role',
          orgId: principalOrgId,
        }),
      }
    );

    const res = await PUT(req, {
      params: Promise.resolve({ id: '22222222-2222-4222-8222-222222222222' }),
    });

    expect(res.status).toBe(404);
    expect(verifyExplicitAssignmentMutationAccess).toHaveBeenCalledWith(
      'user-1',
      '22222222-2222-4222-8222-222222222222',
      { orgId: principalOrgId, orgSlug: undefined }
    );
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it('PUT rejects malformed JSON before assignment mutation access checks', async () => {
    const res = await PUT(rawRequest('{"role":'), params);
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.error).toBe('Invalid JSON body');
    expect(verifyExplicitAssignmentMutationAccess).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('PUT updates assignment for org owner', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      role: 'org_owner',
      orgId: principalOrgId,
      membershipId: 'membership-1',
    });
    const returningMock = vi.fn().mockResolvedValue([
      {
        id: 'assignment-1',
        orgId: 'org-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'active',
        role: 'Updated role',
      },
    ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.update as any).mockReturnValue({ set: setMock });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'PUT',
      body: JSON.stringify({
        role: 'Updated role',
        status: 'active',
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await PUT(req, params);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment.role).toBe('Updated role');
    expect(checkAndEmitAssignmentActivation).toHaveBeenCalledTimes(1);
  });

  it('PUT normalizes pending_review into review_ready for the narrow publish corridor', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      role: 'org_owner',
      orgId: principalOrgId,
      membershipId: 'membership-1',
    });
    const returningMock = vi.fn().mockResolvedValue([
      {
        id: 'assignment-1',
        orgId: 'org-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'draft',
        creationStatus: 'review_ready',
        role: 'Updated role',
      },
    ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.update as any).mockReturnValue({ set: setMock });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'PUT',
      body: JSON.stringify({
        role: 'Updated role',
        creationStatus: 'pending_review',
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await PUT(req, params);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment.creationStatus).toBe('review_ready');
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        creationStatus: 'review_ready',
      })
    );
  });

  it('PUT accepts builder autosave payloads with empty date fields and skill metadata', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      role: 'org_owner',
      orgId: principalOrgId,
      membershipId: 'membership-1',
    });
    const returningMock = vi.fn().mockResolvedValue([
      {
        id: 'assignment-1',
        orgId: 'org-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        status: 'draft',
        role: 'Updated role',
        mustHaveSkills: [{ id: '03.01.01.001', level: 4 }],
        niceToHaveSkills: [],
      },
    ]);
    const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    (db.update as any).mockReturnValue({ set: setMock });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated role',
        rolePurpose: 'Validate launch readiness',
        startEarliest: '',
        startLatest: '   ',
        mustHaveSkills: [
          {
            id: '03.01.01.001',
            label: 'Quality audit',
            level: 4,
            catId: 2,
            subcatId: 20,
            l3Id: 200,
            l1Label: 'Foundation',
            l2Label: 'Operations',
            l3Label: 'Quality',
            linkedToBV: true,
            linkedToTO: false,
          },
        ],
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await PUT(req, params);

    expect(res.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Updated role',
        businessValue: 'Validate launch readiness',
        startEarliest: undefined,
        startLatest: undefined,
        mustHaveSkills: [expect.objectContaining({ id: '03.01.01.001', level: 4 })],
      })
    );
  });

  it('DELETE returns 403 for reviewer role', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'insufficient_role',
      role: 'org_reviewer',
    });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'DELETE',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await DELETE(req, params);
    expect(res.status).toBe(403);
  });

  it('DELETE returns 404 for non-members', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'membership_not_found',
    });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'DELETE',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await DELETE(req, params);
    expect(res.status).toBe(404);
  });

  it('DELETE succeeds for org manager', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      role: 'org_manager',
      orgId: principalOrgId,
      membershipId: 'membership-1',
    });
    const whereMock = vi.fn().mockResolvedValue(undefined);
    (db.delete as any).mockReturnValue({ where: whereMock });

    const req = new NextRequest('http://localhost/api/assignments/assignment-1', {
      method: 'DELETE',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId: principalOrgId },
      }),
    });

    const res = await DELETE(req, params);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(db.delete).toHaveBeenCalledTimes(1);
  });
});
