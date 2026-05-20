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
      orgReadiness: 'org_ready',
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
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      engagementType: 'full_time',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
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
        creationStatus: 'review_ready',
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
    expect(payload.assignment.creationStatus).toBe('review_ready');
  });

  it.each(['inactive', 'suspended', 'unknown_state'])(
    'blocks publish when membership access resolves as non-active for %s state',
    async () => {
      (verifyExplicitAssignmentMutationAccess as any).mockResolvedValue({
        status: 'membership_not_found',
      });

      const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          principalContext: { principalType: 'organization', orgId },
        }),
      });

      const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
      const payload = await res.json();

      expect(res.status).toBe(404);
      expect(payload.error).toBe('Assignment not found or access denied');
      expect(db.query.assignments.findFirst).not.toHaveBeenCalled();
    }
  );

  it('returns 400 for malformed JSON before assignment access or lookup', async () => {
    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"principalContext":',
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect(verifyExplicitAssignmentMutationAccess).not.toHaveBeenCalled();
    expect(db.query.assignments.findFirst).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns explicit block reasons for missing launch requirements', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: '',
      description: '',
      expectedImpact: '',
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
        expect.objectContaining({
          blockCode: 'work_summary_required',
          field: 'description',
        }),
        expect.objectContaining({
          blockCode: 'proof_expectations_required',
          field: 'proofExpectations',
        }),
        expect.objectContaining({ blockCode: 'outcomes_required', field: 'outcomes' }),
        expect.objectContaining({
          blockCode: 'must_have_skills_required',
          field: 'mustHaveSkills',
        }),
        expect.objectContaining({ blockCode: 'constraints_required', field: 'constraints' }),
      ])
    );
  });

  it('rejects publish for held or closed assignments even when review is ready', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      status: 'closed',
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
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
    expect(payload.error).toBe('ASSIGNMENT_NOT_PUBLISHABLE');
    expect(payload.details.currentStatus).toBe('closed');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 409 when assignment publish state changes before the final update', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      status: 'draft',
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
    });
    (db.query.assignmentOutcomes.findMany as any).mockResolvedValue([{ id: 'outcome-1' }]);

    const updateReturning = vi.fn().mockResolvedValue([]);
    const updateWhere = vi.fn().mockReturnValue({ returning: updateReturning });
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    (db.update as any).mockReturnValue({ set: updateSet });

    const req = new NextRequest(`http://localhost/api/assignments/${assignmentId}/publish`, {
      method: 'POST',
      body: JSON.stringify({
        principalContext: { principalType: 'organization', orgId },
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: assignmentId }) });
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.error).toBe('ASSIGNMENT_PUBLISH_STATE_CHANGED');
    expect(updateReturning).toHaveBeenCalled();
  });

  it('blocks vague generic copy at publish time', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue: 'Join our team and make an impact.',
      description: 'Wear many hats on a fast-paced team.',
      expectedImpact: 'Self-starter wanted.',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
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
    expect(payload.details.blocks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockCode: 'generic_assignment_language',
          field: 'rolePurpose',
        }),
        expect.objectContaining({
          blockCode: 'generic_assignment_language',
          field: 'description',
        }),
        expect.objectContaining({
          blockCode: 'generic_assignment_language',
          field: 'proofExpectations',
        }),
      ])
    );
  });

  it('blocks publish until the organization reaches org_ready', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
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
      orgReadiness: 'draft',
      trustStatus: 'platform_reviewed',
      orgTrustTier: 'reviewed',
      verified: true,
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
    expect(payload.error).toBe('ORG_NOT_READY');
    expect(payload.details.currentOrgReadiness).toBe('draft');
  });

  it('returns an explicit trust block when org publishing is restricted', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
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
      orgReadiness: 'org_ready',
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
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
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
      orgReadiness: 'org_ready',
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
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
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
      creationStatus: 'review_ready',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Support Advocate',
      businessValue:
        'Support high-risk applicants safely by making sure the review corridor is specific and privacy-safe.',
      description:
        'Guide applicants through sensitive review workflows, document what evidence matters, and coordinate escalations when risk thresholds are met.',
      expectedImpact:
        'Convincing proof includes prior delivery in sensitive support environments, careful handling of escalation paths, and clear written judgment.',
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
      orgReadiness: 'org_ready',
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

  it('rejects publish before assignment reaches internal review', async () => {
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      builderMode: 'basic',
      creationStatus: 'draft',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      role: 'Product Designer',
      businessValue:
        'Improve candidate quality by turning vague hiring decisions into proof-backed review choices.',
      description:
        'Lead the assignment review workflow, define concrete deliverables, and keep the team aligned on what strong work actually looks like.',
      expectedImpact:
        'Convincing proof includes real shipped work, evidence of ownership, and a clear explanation of tradeoffs from past assignments.',
      mustHaveSkills: ['Research', 'UX', 'Figma'],
      locationMode: 'remote',
      compMin: 80000,
      compMax: 100000,
      verificationGates: [],
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
    expect(payload.error).toBe('ASSIGNMENT_INTERNAL_REVIEW_REQUIRED');
    expect(payload.details.currentCreationStatus).toBe('draft');
    expect(payload.details.allowedCreationStatuses).toEqual(['review_ready']);
  });
});
