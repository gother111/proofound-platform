import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  profileFindFirst: vi.fn(),
  getOrgMembershipRole: vi.fn(),
  appendManualOverrideReason: vi.fn(),
  buildVisibilitySafeWhy: vi.fn(),
  getVisibleIdentityFields: vi.fn(),
  normalizeFairnessStatus: vi.fn(),
  persistFairnessEvaluationForAssignment: vi.fn(),
  recordRevealEvent: vi.fn(),
  resolveCanonicalCorridor: vi.fn(),
  resolveCanonicalFallbackState: vi.fn(),
  setMatchReviewStage: vi.fn(),
  getOrCreateIntroWorkflow: vi.fn(),
  syncIntroWorkflowFromInterest: vi.fn(),
  openIntroConversation: vi.fn(),
  unlockFullIdentityForMatch: vi.fn(),
  emitMatchActioned: vi.fn(),
  emitFirstQualifiedIntroAsync: vi.fn(),
  notifyIntroAccepted: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: mocks.select,
    update: mocks.update,
    insert: mocks.insert,
    query: {
      profiles: {
        findFirst: mocks.profileFindFirst,
      },
    },
  },
}));

vi.mock('@/lib/matching/review-contract', () => ({
  appendManualOverrideReason: mocks.appendManualOverrideReason,
  buildVisibilitySafeWhy: mocks.buildVisibilitySafeWhy,
  getOrgMembershipRole: mocks.getOrgMembershipRole,
  getVisibleIdentityFields: mocks.getVisibleIdentityFields,
  normalizeFairnessStatus: mocks.normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment: mocks.persistFairnessEvaluationForAssignment,
  recordRevealEvent: mocks.recordRevealEvent,
  resolveCanonicalCorridor: mocks.resolveCanonicalCorridor,
  resolveCanonicalFallbackState: mocks.resolveCanonicalFallbackState,
  setMatchReviewStage: mocks.setMatchReviewStage,
  unlockFullIdentityForMatch: mocks.unlockFullIdentityForMatch,
}));

vi.mock('@/lib/workflow/service', () => ({
  getOrCreateIntroWorkflow: mocks.getOrCreateIntroWorkflow,
  syncIntroWorkflowFromInterest: mocks.syncIntroWorkflowFromInterest,
  openIntroConversation: mocks.openIntroConversation,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitMatchActioned: mocks.emitMatchActioned,
  emitFirstQualifiedIntroAsync: mocks.emitFirstQualifiedIntroAsync,
}));

vi.mock('@/lib/notifications', () => ({
  notifyIntroAccepted: mocks.notifyIntroAccepted,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { POST } from '@/app/api/org/[id]/matches/[matchId]/review/route';

describe('POST /api/org/[id]/matches/[matchId]/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.getOrgMembershipRole.mockResolvedValue('org_manager');
    mocks.getVisibleIdentityFields.mockReturnValue([]);
    mocks.normalizeFairnessStatus.mockReturnValue('pass');
    mocks.resolveCanonicalFallbackState.mockReturnValue(null);
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage1_capability_and_proof',
      corridorState: 'intro_hold',
      fallbackState: 'intro_hold',
    });
    mocks.buildVisibilitySafeWhy.mockReturnValue({
      reasonCodes: ['fairness_ranking_suppressed'],
      summary: ['Intro request is blocked until Stage 2.'],
    });
    mocks.profileFindFirst.mockResolvedValue({
      displayName: 'Taylor',
      handle: 'taylor',
    });
    mocks.syncIntroWorkflowFromInterest.mockResolvedValue({
      id: 'intro-2',
      state: 'mutual',
    });
    mocks.openIntroConversation.mockResolvedValue({
      id: 'intro-2',
      state: 'conversation_open',
    });

    const firstLimit = vi.fn().mockResolvedValue([{ id: 'org-1', slug: 'proofound' }]);
    const firstWhere = vi.fn().mockReturnValue({ limit: firstLimit });
    const firstFrom = vi.fn().mockReturnValue({ where: firstWhere });

    const secondLimit = vi.fn().mockResolvedValue([
      {
        matchId: 'match-1',
        assignmentId: 'assignment-1',
        profileId: 'profile-1',
        orgId: 'org-1',
        reviewStage: 'blind_review',
        revealScope: 'blind',
        reviewOperationalFallbackMode: null,
        assignmentOperationalFallbackMode: null,
        fairnessStatus: 'pass',
      },
    ]);
    const secondWhere = vi.fn().mockReturnValue({ limit: secondLimit });
    const secondInnerJoin2 = vi.fn().mockReturnValue({ where: secondWhere });
    const secondInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: secondInnerJoin2 });
    const secondFrom = vi.fn().mockReturnValue({ innerJoin: secondInnerJoin1 });

    mocks.select.mockReturnValueOnce({ from: firstFrom }).mockReturnValueOnce({ from: secondFrom });

    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    mocks.update.mockReturnValue({ set: updateSet });

    const insertReturning = vi.fn().mockResolvedValue([{ id: 'conversation-1' }]);
    const insertValues = vi.fn().mockReturnValue({ returning: insertReturning });
    mocks.insert.mockReturnValue({ values: insertValues });
  });

  it('blocks intro requests before Stage 2 and does not create an intro workflow', async () => {
    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'request_intro' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toContain('Stage 2');
    expect(body.corridorState).toBe('intro_hold');
    expect(mocks.getOrCreateIntroWorkflow).not.toHaveBeenCalled();
  });

  it('approves intro, unlocks identity, and opens messaging when candidate interest already exists', async () => {
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage3_intro_approved',
      corridorState: 'intro_approved',
      fallbackState: null,
    });
    mocks.select.mockReset();

    const orgLimit = vi.fn().mockResolvedValue([{ id: 'org-1', slug: 'proofound' }]);
    const orgWhere = vi.fn().mockReturnValue({ limit: orgLimit });
    const orgFrom = vi.fn().mockReturnValue({ where: orgWhere });

    const matchLimit = vi.fn().mockResolvedValue([
      {
        matchId: 'match-1',
        assignmentId: 'assignment-1',
        profileId: 'profile-1',
        orgId: 'org-1',
        reviewStage: 'shortlisted',
        revealScope: 'shortlist_identity',
        reviewOperationalFallbackMode: null,
        assignmentOperationalFallbackMode: null,
        fairnessStatus: 'pass',
      },
    ]);
    const matchWhere = vi.fn().mockReturnValue({ limit: matchLimit });
    const matchInnerJoin2 = vi.fn().mockReturnValue({ where: matchWhere });
    const matchInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin2 });
    const matchFrom = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin1 });

    const candidateInterestLimit = vi.fn().mockResolvedValue([{ actorProfileId: 'profile-1' }]);
    const candidateInterestWhere = vi.fn().mockReturnValue({ limit: candidateInterestLimit });
    const candidateInterestFrom = vi.fn().mockReturnValue({ where: candidateInterestWhere });

    const conversationLimit = vi.fn().mockResolvedValue([]);
    const conversationWhere = vi.fn().mockReturnValue({ limit: conversationLimit });
    const conversationFrom = vi.fn().mockReturnValue({ where: conversationWhere });

    mocks.select
      .mockReturnValueOnce({ from: orgFrom })
      .mockReturnValueOnce({ from: matchFrom })
      .mockReturnValueOnce({ from: candidateInterestFrom })
      .mockReturnValueOnce({ from: conversationFrom });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'request_intro' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.introApproved).toBe(true);
    expect(body.progressiveRevealStage).toBe('stage3_intro_approved');
    expect(body.corridorState).toBe('intro_approved');
    expect(body.revealScope).toBe('full_identity');
    expect(body.visibleIdentityFields).toEqual([]);
    expect(body.conversationId).toBe('conversation-1');
    expect(mocks.syncIntroWorkflowFromInterest).toHaveBeenCalledWith(
      expect.objectContaining({
        mutual: true,
        matchId: 'match-1',
      })
    );
    expect(mocks.unlockFullIdentityForMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        unlockTrigger: 'mutual_interest',
      })
    );
    expect(mocks.openIntroConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        introWorkflowId: 'intro-2',
        conversationId: 'conversation-1',
      })
    );
    expect(mocks.notifyIntroAccepted).toHaveBeenCalledTimes(2);
  });

  it('allows reviewers to record reveal requests without admin-style roles', async () => {
    mocks.getOrgMembershipRole.mockResolvedValue('org_reviewer');

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reveal_request',
          requestedScope: 'full_identity',
        }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toContain('Reveal request recorded');
    expect(mocks.recordRevealEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: 'org_reviewer',
        requestedScope: 'full_identity',
      })
    );
  });
});
