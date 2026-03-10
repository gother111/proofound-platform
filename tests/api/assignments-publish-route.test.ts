import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/assignments/[id]/publish/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';
import { verifyExplicitAssignmentMutationAccess } from '@/lib/assignments/access';
import { isFeatureEnabled } from '@/lib/feature-flags/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      assignmentOutcomes: { findMany: vi.fn() },
      organizations: { findFirst: vi.fn() },
    },
    update: vi.fn(),
  },
}));

vi.mock('@/lib/assignments/access', () => ({
  verifyExplicitAssignmentMutationAccess: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAssignmentPublishSucceeded: vi.fn(),
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
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireAuth as any).mockResolvedValue({ id: userId });
    (isFeatureEnabled as any).mockResolvedValue(true);
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'ok',
      userId,
      orgId,
      role: 'org_owner',
      membershipId: 'membership-1',
    });
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      slug: 'proofound-org',
      trustStatus: 'platform_reviewed',
      orgTrustTier: 'reviewed',
      verified: true,
    });
  });

  it('publishes a basic-mode assignment without advanced weights', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);

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
      {
        method: 'POST',
        body: JSON.stringify({
          principalContext: { principalType: 'organization', orgId },
        }),
      }
    );

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.assignment.status).toBe('active');
    expect(payload.assignment.creationStatus).toBe('published');
  });

  it('returns explicit block reasons for missing launch requirements', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: '',
      mustHaveSkills: [],
      locationMode: null,
      city: null,
      country: null,
      compMin: null,
      compMax: null,
      verificationGates: [],
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([]);

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.details.builderMode).toBe('basic');
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ blockCode: 'role_required', field: 'role' }),
        expect.objectContaining({ blockCode: 'outcomes_required', field: 'outcomes' }),
        expect.objectContaining({
          blockCode: 'must_have_skills_required',
          field: 'mustHaveSkills',
        }),
        expect.objectContaining({ blockCode: 'constraints_required', field: 'constraints' }),
      ])
    );
  });

  it('blocks advanced-mode publish when weight matrix is invalid', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'advanced',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
      weights: { mission: 50, expertise: 30, workMode: 10 },
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload.details.builderMode).toBe('advanced');
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ blockCode: 'weights_required', field: 'weights' }),
      ])
    );
  });

  it('returns an explicit trust block when org publishing is restricted', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      slug: 'proofound-org',
      trustStatus: 'unverified',
      orgTrustTier: 'restricted',
      verified: false,
    });

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(403);
    expect(payload.error).toBe('ASSIGNMENT_PUBLISH_BLOCKED');
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'org_trust_restricted',
          field: 'trustRequirements',
        }),
      ])
    );
  });

  it('blocks unpaid commercial assignments at publish time', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
      compensationType: 'unpaid',
      commerciality: 'commercial',
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      slug: 'proofound-org',
      trustStatus: 'domain_verified',
      orgTrustTier: 'basic_trusted',
      verified: false,
    });

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(403);
    expect(payload.error).toBe('ASSIGNMENT_PUBLISH_BLOCKED');
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'unpaid_commercial_assignment_blocked',
          field: 'trustRequirements',
        }),
      ])
    );
  });

  it('holds publish when cross-border review is required', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Improve candidate quality',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
      crossBorderStatus: 'required',
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.error).toBe('ASSIGNMENT_PUBLISH_ON_HOLD');
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'cross_border_review_required',
          field: 'trustRequirements',
        }),
      ])
    );
  });

  it('holds sensitive-domain publish for non-reviewed organizations', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Support Advocate',
      businessValue: 'Support high-risk applicants safely',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
      sensitiveDomain: 'legal_immigration',
      sensitiveDomainReviewStatus: 'required',
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      slug: 'proofound-org',
      trustStatus: 'domain_verified',
      orgTrustTier: 'basic_trusted',
      verified: false,
    });

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.error).toBe('ASSIGNMENT_PUBLISH_ON_HOLD');
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'sensitive_domain_review_required',
          field: 'trustRequirements',
        }),
      ])
    );
  });

  it('rejects publish for reviewer org roles', async () => {
    (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
      status: 'insufficient_role',
      userId,
      orgId,
      role: 'org_reviewer',
    });

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    expect(res.status).toBe(403);
  });
});
