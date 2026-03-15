import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/core/matching/interest/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { listCanonicalProofPackAggregatesForOwner } from '@/lib/proofs/canonical-pack';
import { checkVerificationGates } from '@/lib/verification/gates';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      organizationMembers: { findFirst: vi.fn(), findMany: vi.fn() },
      organizations: { findFirst: vi.fn() },
      conversations: { findFirst: vi.fn() },
      profiles: { findFirst: vi.fn() },
      skills: { findMany: vi.fn() },
    },
    transaction: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
  emitMatchActioned: vi.fn(),
  emitFirstQualifiedIntroAsync: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  notifyIntroAccepted: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/readiness/individual-state', () => ({
  getIndividualReadinessState: vi.fn(),
}));

vi.mock('@/lib/verification/gates', () => ({
  checkVerificationGates: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalProofPackAggregatesForOwner: vi.fn().mockResolvedValue([]),
  summarizeCanonicalProofOwnerAggregates: vi.fn().mockReturnValue({
    subjectSummaries: [],
  }),
}));

vi.mock('@/lib/workflow/service', () => ({
  syncIntroWorkflowFromInterest: vi.fn().mockResolvedValue({
    id: 'intro-1',
    state: 'mutual',
    closeReason: null,
    expiresAt: null,
    withdrawnAt: null,
    closedAt: null,
    updatedAt: new Date(),
  }),
  openIntroConversation: vi.fn().mockResolvedValue({
    id: 'intro-1',
    state: 'conversation_open',
    closeReason: null,
    expiresAt: null,
    withdrawnAt: null,
    closedAt: null,
    updatedAt: new Date(),
  }),
  buildWorkflowView: vi.fn().mockReturnValue({
    state: 'conversation_open',
    displayState: 'Conversation open',
    reasonCode: null,
    timestamps: {},
    allowedActions: [],
  }),
}));

describe('match interest route', () => {
  const assignmentId = '11111111-1111-1111-1111-111111111111';
  const orgId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const orgRepId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const candidateId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    vi.clearAllMocks();
    (getIndividualReadinessState as any).mockResolvedValue({
      trustLevel: 'intro_eligible',
      counts: {
        qualifyingProofLinkedL4Count: 4,
        roleRelevantProofLinkedL4Count: 3,
        activeTrustAnchorCount: 1,
      },
      introEligibility: {
        status: 'eligible',
        profileEligible: true,
        assignmentEligible: null,
        reasonCodes: [],
        missingRequirements: [],
        nextActions: [],
        qualifyingProofLinkedL4Count: 4,
        roleRelevantProofLinkedL4Count: 3,
        assignmentRelevantProofLinkedL4Count: 0,
        activeTrustAnchorCount: 1,
      },
      flags: {
        qualifiedIntroReady: true,
      },
    });
    (db.query.skills.findMany as any).mockResolvedValue([]);
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      trustStatus: 'platform_reviewed',
      orgTrustTier: 'reviewed',
      verified: true,
    });
    (checkVerificationGates as any).mockResolvedValue({
      passed: true,
      unmetGates: [],
      userVerifications: [],
      canIntroduce: true,
    });
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
  });

  it('rejects org-side interest when actor is not an active org member', async () => {
    (requireAuth as any).mockResolvedValue({ id: orgRepId });
    (db.query.assignments.findFirst as any).mockResolvedValue({ id: assignmentId, orgId });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId,
        targetProfileId: candidateId,
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
  });

  it('returns structured 409 when intro qualification is blocked', async () => {
    (requireAuth as any).mockResolvedValue({ id: candidateId });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      mustHaveSkills: [{ id: 'typescript', level: 4 }],
    });
    (getIndividualReadinessState as any).mockResolvedValue({
      trustLevel: 'match_visible',
      counts: {
        qualifyingProofLinkedL4Count: 2,
        roleRelevantProofLinkedL4Count: 2,
        activeTrustAnchorCount: 0,
      },
      introEligibility: {
        status: 'blocked_profile',
        profileEligible: false,
        assignmentEligible: null,
        reasonCodes: ['trusted_or_attested_proof_missing'],
        missingRequirements: [
          {
            id: 'trusted_signal',
            label: 'Trusted or attested proof-backed signal',
            detail: 'Add one trusted proof-backed skill.',
            met: false,
            actionUrl: '/app/i/verifications',
          },
        ],
        nextActions: [],
        qualifyingProofLinkedL4Count: 2,
        roleRelevantProofLinkedL4Count: 2,
        assignmentRelevantProofLinkedL4Count: 0,
        activeTrustAnchorCount: 0,
      },
      flags: {
        qualifiedIntroReady: false,
      },
    });

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.error).toBe('INTRO_QUALIFICATION_NOT_MET');
    expect(payload.currentTrustLevel).toBe('match_visible');
    expect(payload.browseStillAvailable).toBe(true);
    expect(payload.copy.title).toContain('You can keep browsing');
  });

  it('counts skill-linked proof from experience-anchored packs toward assignment intro eligibility', async () => {
    (requireAuth as any).mockResolvedValue({ id: candidateId });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: assignmentId,
      orgId,
      mustHaveSkills: [{ id: 'typescript', level: 4 }],
    });
    (db.query.skills.findMany as any).mockResolvedValue([
      {
        id: 'skill-row-1',
        skillId: 'typescript',
        skillCode: 'typescript',
        relevance: 'current',
        lastUsedAt: new Date('2026-03-01T00:00:00Z'),
      },
    ]);
    (listCanonicalProofPackAggregatesForOwner as any).mockResolvedValue([
      {
        freshnessState: 'fresh',
        pack: {
          primarySubjectType: 'experience',
          primarySubjectId: 'experience-1',
        },
        items: [
          {
            artifact: {
              subjectType: 'skill',
              subjectId: 'skill-row-1',
            },
          },
        ],
        verificationReferences: [],
      },
    ]);

    const txOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const txInsertValues = vi.fn().mockReturnValue({ onConflictDoNothing: txOnConflictDoNothing });
    const txInsert = vi.fn().mockReturnValue({ values: txInsertValues });
    const txMatchInterestFind = vi.fn().mockResolvedValue([]);
    const txOrgMembershipFindMany = vi.fn().mockResolvedValue([]);

    (db.transaction as any).mockImplementation(async (callback: any) =>
      callback({
        query: {
          matchInterest: { findMany: txMatchInterestFind },
          organizationMembers: { findMany: txOrgMembershipFindMany },
        },
        insert: txInsert,
      })
    );

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.revealed).toBe(false);
    expect(txInsertValues).toHaveBeenCalledWith({
      actorProfileId: candidateId,
      assignmentId,
      targetProfileId: null,
    });
  });

  it('keeps mutual interest pending until org intro approval', async () => {
    (requireAuth as any).mockResolvedValue({ id: candidateId });
    (db.query.assignments.findFirst as any).mockResolvedValue({ id: assignmentId, orgId });
    (db.query.conversations.findFirst as any).mockResolvedValue(null);

    const txOnConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const txInsertValues = vi.fn().mockReturnValue({ onConflictDoNothing: txOnConflictDoNothing });
    const txInsert = vi.fn().mockReturnValue({ values: txInsertValues });
    const txMatchInterestFind = vi
      .fn()
      .mockResolvedValueOnce([
        { actorProfileId: 'cccccccc-cccc-cccc-cccc-cccccccccccc' },
        { actorProfileId: orgRepId },
      ]);
    const txOrgMembershipFindMany = vi.fn().mockResolvedValue([{ userId: orgRepId }]);

    (db.transaction as any).mockImplementation(async (callback: any) =>
      callback({
        query: {
          matchInterest: { findMany: txMatchInterestFind },
          organizationMembers: { findMany: txOrgMembershipFindMany },
        },
        insert: txInsert,
      })
    );

    const selectMatchLimit = vi.fn().mockResolvedValue([
      {
        id: 'match-1',
        assignmentId,
        profileId: candidateId,
        score: 0.87,
        fairnessStatus: 'pass',
        reviewStage: 'shortlisted',
        revealScope: 'shortlist_identity',
        operationalFallbackMode: null,
        vector: { subscores: { purpose_alignment: 0.81 } },
      },
    ]);
    const selectWhere = vi.fn().mockReturnValue({ limit: selectMatchLimit });
    const selectLeftJoin = vi.fn().mockReturnValue({ where: selectWhere });
    const selectFrom = vi.fn().mockReturnValue({ leftJoin: selectLeftJoin });
    (db.select as any).mockReturnValue({ from: selectFrom });

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.revealed).toBe(false);
    expect(payload.mutual).toBe(true);
    expect(payload.requiresIntroApproval).toBe(true);
    expect(payload.introApproved).toBe(false);
    expect(payload.introWorkflowId).toBe('intro-1');
    expect(payload.matchId).toBe('match-1');
    expect(txInsertValues).toHaveBeenCalledWith({
      actorProfileId: candidateId,
      assignmentId,
      targetProfileId: null,
    });
    expect(txOnConflictDoNothing).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.any(Array) })
    );
  });

  it('blocks intro when required verification gates are not met', async () => {
    (requireAuth as any).mockResolvedValue({ id: candidateId });
    (db.query.assignments.findFirst as any).mockResolvedValue({ id: assignmentId, orgId });
    (checkVerificationGates as any).mockResolvedValue({
      passed: false,
      unmetGates: [{ type: 'identity', required: true }],
      userVerifications: [{ type: 'identity', verified: false }],
      canIntroduce: false,
      blockingMessage: 'Verification gates are not satisfied for this assignment.',
    });

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(409);
    expect(payload.error).toBe('INTRO_VERIFICATION_GATE_BLOCKED');
    expect(payload.unmetGates).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'identity' })])
    );
  });

  it('blocks intro when the organization is restricted', async () => {
    (requireAuth as any).mockResolvedValue({ id: candidateId });
    (db.query.assignments.findFirst as any).mockResolvedValue({ id: assignmentId, orgId });
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      trustStatus: 'unverified',
      orgTrustTier: 'restricted',
      verified: false,
    });

    const req = new NextRequest('http://localhost/api/match/interest', {
      method: 'POST',
      body: JSON.stringify({ assignmentId }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(403);
    expect(payload.error).toBe('INTRO_BLOCKED_BY_POLICY');
    expect(payload.reasonCodes).toContain('org_trust_restricted');
  });
});
