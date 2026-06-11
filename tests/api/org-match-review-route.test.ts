import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  profileFindFirst: vi.fn(),
  matchReviewStateFindFirst: vi.fn(),
  getOrgMembershipRole: vi.fn(),
  appendManualOverrideReason: vi.fn(),
  buildProofFirstReviewCard: vi.fn(),
  buildVisibilitySafeWhy: vi.fn(),
  getReviewCardProofPackMap: vi.fn(),
  getReviewCardProofPackMapForMatchedOrg: vi.fn(),
  getVisibleIdentityFields: vi.fn(),
  normalizeFairnessStatus: vi.fn(),
  persistFairnessEvaluationForAssignment: vi.fn(),
  recordRevealEvent: vi.fn(),
  resolveCanonicalCorridor: vi.fn(),
  resolveCanonicalFallbackState: vi.fn(),
  ensureMatchReviewState: vi.fn(),
  setMatchReviewStage: vi.fn(),
  getOrCreateIntroWorkflow: vi.fn(),
  syncIntroWorkflowFromInterest: vi.fn(),
  openIntroConversation: vi.fn(),
  syncRevealRequestTimeoutState: vi.fn(),
  emitMatchActioned: vi.fn(),
  emitFirstQualifiedIntroAsync: vi.fn(),
  notifyIntroAccepted: vi.fn(),
  getIndividualReadinessState: vi.fn(),
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
      matchReviewStates: {
        findFirst: mocks.matchReviewStateFindFirst,
      },
    },
  },
}));

vi.mock('@/lib/matching/review-contract', () => ({
  appendManualOverrideReason: mocks.appendManualOverrideReason,
  buildProofFirstReviewCard: mocks.buildProofFirstReviewCard,
  buildVisibilitySafeWhy: mocks.buildVisibilitySafeWhy,
  getReviewCardProofPackMap: mocks.getReviewCardProofPackMap,
  getReviewCardProofPackMapForMatchedOrg: mocks.getReviewCardProofPackMapForMatchedOrg,
  getOrgMembershipRole: mocks.getOrgMembershipRole,
  getVisibleIdentityFields: mocks.getVisibleIdentityFields,
  normalizeFairnessStatus: mocks.normalizeFairnessStatus,
  persistFairnessEvaluationForAssignment: mocks.persistFairnessEvaluationForAssignment,
  recordRevealEvent: mocks.recordRevealEvent,
  resolveCanonicalCorridor: mocks.resolveCanonicalCorridor,
  resolveCanonicalFallbackState: mocks.resolveCanonicalFallbackState,
  ensureMatchReviewState: mocks.ensureMatchReviewState,
  setMatchReviewStage: mocks.setMatchReviewStage,
}));

vi.mock('@/lib/workflow/service', () => ({
  getOrCreateIntroWorkflow: mocks.getOrCreateIntroWorkflow,
  syncIntroWorkflowFromInterest: mocks.syncIntroWorkflowFromInterest,
  openIntroConversation: mocks.openIntroConversation,
  syncRevealRequestTimeoutState: mocks.syncRevealRequestTimeoutState,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitMatchActioned: mocks.emitMatchActioned,
  emitFirstQualifiedIntroAsync: mocks.emitFirstQualifiedIntroAsync,
}));

vi.mock('@/lib/notifications', () => ({
  notifyIntroAccepted: mocks.notifyIntroAccepted,
}));

vi.mock('@/lib/readiness/individual-state', () => ({
  getIndividualReadinessState: mocks.getIndividualReadinessState,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { POST } from '@/app/api/org/[id]/matches/[matchId]/review/route';

const FORBIDDEN_EARLY_SCORE_KEYS = new Set([
  'score',
  'rawScore',
  'scoreTotal',
  'subscores',
  'subscoresJson',
  'rankScore',
  'percentage',
  'embeddingSimilarity',
  'modelConfidence',
  'aiVerdict',
]);

function expectNoEarlyScoreExposure(value: unknown) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach(expectNoEarlyScoreExposure);
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    expect(FORBIDDEN_EARLY_SCORE_KEYS.has(key)).toBe(false);
    expectNoEarlyScoreExposure(nested);
  }
}

describe('POST /api/org/[id]/matches/[matchId]/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.getOrgMembershipRole.mockResolvedValue('org_manager');
    mocks.getReviewCardProofPackMap.mockResolvedValue(new Map());
    mocks.getReviewCardProofPackMapForMatchedOrg.mockResolvedValue(new Map());
    mocks.buildProofFirstReviewCard.mockReturnValue({
      candidateLabel: 'Submission A7F2',
      strongestProof: {
        summary: 'Proof-backed review signal.',
        outcome: 'Outcome summary.',
        ownership: 'Ownership summary.',
        anchorContext: 'Anchored in prior proof',
        freshnessLabel: 'Fresh',
      },
      verification: {
        summaryLabel: 'Verified proof signal present',
        count: 1,
      },
      trustLabels: ['Verified proof signal present'],
      fitBand: null,
      fitSummary: {
        headline: 'Proof signals align with the assignment needs.',
        bullets: ['Evidence points to a strong skills fit for this assignment.'],
        reasonCodes: ['skills_strong'],
      },
    });
    mocks.getVisibleIdentityFields.mockReturnValue([]);
    mocks.normalizeFairnessStatus.mockReturnValue('pass');
    mocks.persistFairnessEvaluationForAssignment.mockResolvedValue({
      id: 'fairness-1',
      status: 'pass',
    });
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
    mocks.matchReviewStateFindFirst.mockResolvedValue({
      reviewStage: 'shortlisted',
      revealScope: 'blind',
    });
    mocks.syncIntroWorkflowFromInterest.mockResolvedValue({
      id: 'intro-2',
      state: 'mutual',
    });
    mocks.openIntroConversation.mockResolvedValue({
      id: 'intro-2',
      state: 'conversation_open',
    });
    mocks.getIndividualReadinessState.mockResolvedValue({
      flags: {
        matchVisible: true,
      },
      counts: {
        freshProofLinkedL4Count24: 1,
        activeTrustAnchorCount: 1,
      },
      introEligibility: {
        reasonCodes: [],
      },
    });
    mocks.syncRevealRequestTimeoutState.mockImplementation(async ({ conversation }: any) => ({
      conversation,
      timeout: {
        pending: false,
        expired: false,
        requestedBy: null,
        requestedAt: null,
        expiresAt: null,
        timedOutParticipantId: null,
      },
      reset: false,
    }));

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
    expect(body.reviewCard).toEqual(
      expect.objectContaining({
        candidateLabel: 'Submission A7F2',
      })
    );
    expect(mocks.getOrCreateIntroWorkflow).not.toHaveBeenCalled();
  });

  it('blocks Stage 2 intro requests when the strict intro gate is not ready', async () => {
    mocks.getIndividualReadinessState.mockResolvedValueOnce({
      flags: {
        matchVisible: true,
      },
      counts: {
        freshProofLinkedL4Count24: 1,
        activeTrustAnchorCount: 0,
      },
      introEligibility: {
        reasonCodes: [],
      },
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
        reasonCodes: ['alias_skill_overlap', 'fresh_proof_present'],
        scoreSnapshotJson: {
          discovery_status: 'review_ready_match',
          fit_band: 'relevant_partial',
        },
      },
    ]);
    const matchWhere = vi.fn().mockReturnValue({ limit: matchLimit });
    const matchInnerJoin2 = vi.fn().mockReturnValue({ where: matchWhere });
    const matchInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin2 });
    const matchFrom = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin1 });

    mocks.select.mockReturnValueOnce({ from: orgFrom }).mockReturnValueOnce({ from: matchFrom });

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
    expect(body.discoveryStatus).toBe('review_ready_match');
    expect(body.fitBand).toBe('relevant_partial');
    expect(body.introGate).toBe('intro_hold_missing_trust_anchor');
    expect(body.canRequestIntro).toBe(false);
    expect(body.missingGates).toContain('active_non_self_trust_anchor');
    expectNoEarlyScoreExposure(body);
    expect(mocks.syncIntroWorkflowFromInterest).not.toHaveBeenCalled();
    expect(mocks.getOrCreateIntroWorkflow).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON before loading organization and match state', async () => {
    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(mocks.getOrgMembershipRole).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it.each(['inactive', 'suspended', 'unknown_state'])(
    'blocks review mutation when membership access resolves as non-active for %s state',
    async () => {
      mocks.getOrgMembershipRole.mockResolvedValue(null);
      mocks.select.mockReset();

      const orgLimit = vi.fn().mockResolvedValue([{ id: 'org-1', slug: 'proofound' }]);
      const orgWhere = vi.fn().mockReturnValue({ limit: orgLimit });
      const orgFrom = vi.fn().mockReturnValue({ where: orgWhere });
      mocks.select.mockReturnValueOnce({ from: orgFrom });

      const response = await POST(
        new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
          method: 'POST',
          body: JSON.stringify({ action: 'shortlist' }),
        }),
        {
          params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
        } as any
      );
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body.error).toBe('Access denied');
      expect(mocks.ensureMatchReviewState).not.toHaveBeenCalled();
      expect(mocks.getOrCreateIntroWorkflow).not.toHaveBeenCalled();
    }
  );

  it('allows active org reviewers to update match review state', async () => {
    mocks.getOrgMembershipRole.mockResolvedValue('org_reviewer');
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
        reviewStage: 'blind_review',
        revealScope: 'blind',
        reviewOperationalFallbackMode: null,
        assignmentOperationalFallbackMode: null,
        fairnessStatus: 'pass',
      },
    ]);
    const matchWhere = vi.fn().mockReturnValue({ limit: matchLimit });
    const matchInnerJoin2 = vi.fn().mockReturnValue({ where: matchWhere });
    const matchInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin2 });
    const matchFrom = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin1 });

    mocks.select.mockReturnValueOnce({ from: orgFrom }).mockReturnValueOnce({ from: matchFrom });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'shortlist', annotation: 'Strong proof packet.' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matchId).toBe('match-1');
    expect(mocks.setMatchReviewStage).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: 'org_reviewer',
        reviewStage: 'shortlisted',
      })
    );
  });

  it('redacts blind review-card free text at the route boundary before reveal', async () => {
    mocks.buildProofFirstReviewCard.mockReturnValue({
      candidateLabel: 'Submission A7F2',
      strongestProof: {
        summary:
          'Jane Doe shipped this at Acme Climate AB. Email jane@example.com, call +46 70 123 45 67, see https://linkedin.com/in/janedoe and Jane_Doe_CV.pdf.',
        outcome:
          'Portfolio: https://proofound.example/portfolio/janedoe and GitHub https://github.com/janedoe/private.',
        ownership: 'Jane Doe owned delivery from 221B Baker Street.',
        anchorContext: 'Anchored at Stockholm University',
        freshnessLabel: 'Fresh',
      },
      verification: {
        summaryLabel: 'Verified by jane@example.com at Acme Climate AB.',
        count: 1,
      },
      trustLabels: ['Acme Climate AB proof'],
      fitBand: null,
      fitSummary: {
        headline: 'Jane Doe is a fit',
        bullets: ['See @janedoe and https://github.com/janedoe/private'],
        reasonCodes: ['skills_strong'],
      },
      privacy: {
        reviewState: 'visible',
        reasons: [],
      },
    });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'pass' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );
    const body = await response.json();
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.revealScope).toBe('blind');
    expect(body.reviewCard.privacy.reviewState).toBe('held_for_manual_review');
    expect(body.reviewCard.strongestProof.summary).toBe(
      'Proof summary held for manual privacy review.'
    );
    expect(serialized).not.toContain('Jane Doe');
    expect(serialized).not.toContain('jane@example.com');
    expect(serialized).not.toContain('+46 70 123 45 67');
    expect(serialized).not.toContain('linkedin.com');
    expect(serialized).not.toContain('github.com');
    expect(serialized).not.toContain('/portfolio/janedoe');
    expect(serialized).not.toContain('proofound.example');
    expect(serialized).not.toContain('Jane_Doe_CV.pdf');
    expect(serialized).not.toContain('Acme Climate AB');
    expect(serialized).not.toContain('Stockholm University');
    expect(serialized).not.toContain('221B Baker Street');
  });

  it('approves intro, keeps identity masked, and opens messaging when candidate interest already exists', async () => {
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
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
    expect(body.discoveryStatus).toBe('review_ready_match');
    expect(body.fitBand).toBeDefined();
    expect(body.introGate).toBe('intro_ready');
    expect(body.canRequestIntro).toBe(true);
    expect(body.reasonDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'fresh_proof_present',
        }),
      ])
    );
    expect(body.anonymousCandidateLabel).toBe('Submission A7F2');
    expect(body.proofSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: 'Proof-backed review signal.',
        }),
      ])
    );
    expectNoEarlyScoreExposure(body);
    expect(body.progressiveRevealStage).toBe('stage2_contextual_reveal');
    expect(body.corridorState).toBe('intro_approved');
    expect(body.revealScope).toBe('shortlist_identity');
    expect(body.visibleIdentityFields).toEqual([]);
    expect(body.reviewCard).toEqual(
      expect.objectContaining({
        candidateLabel: 'Submission A7F2',
      })
    );
    expect(body.conversationId).toBe('conversation-1');
    expect(mocks.syncIntroWorkflowFromInterest).toHaveBeenCalledWith(
      expect.objectContaining({
        mutual: true,
        matchId: 'match-1',
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

  it('reuses an existing active intro workflow instead of creating a duplicate intro', async () => {
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
      corridorState: 'intro_approved',
      fallbackState: null,
    });
    mocks.syncIntroWorkflowFromInterest.mockResolvedValue({
      id: 'intro-existing',
      state: 'mutual',
    });
    mocks.openIntroConversation.mockResolvedValue({
      id: 'conversation-existing',
      state: 'conversation_open',
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

    const conversationLimit = vi.fn().mockResolvedValue([{ id: 'conversation-existing' }]);
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
    expect(body.introWorkflowId).toBe('intro-existing');
    expect(body.conversationId).toBe('conversation-existing');
    expect(mocks.getOrCreateIntroWorkflow).not.toHaveBeenCalled();
    expect(mocks.syncIntroWorkflowFromInterest).toHaveBeenCalledOnce();
  });

  it('treats an already-open intro as an idempotent success without reopening it', async () => {
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
      corridorState: 'intro_approved',
      fallbackState: null,
    });
    mocks.syncIntroWorkflowFromInterest.mockResolvedValue({
      id: 'intro-existing',
      state: 'conversation_open',
      conversationId: 'conversation-existing',
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

    const conversationLimit = vi.fn().mockResolvedValue([{ id: 'conversation-existing' }]);
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
    expect(body.introWorkflowId).toBe('intro-existing');
    expect(body.conversationId).toBe('conversation-existing');
    expect(body.introApproved).toBe(true);
    expect(mocks.openIntroConversation).not.toHaveBeenCalled();
    expect(mocks.notifyIntroAccepted).not.toHaveBeenCalled();
    expect(mocks.emitMatchActioned).not.toHaveBeenCalled();
    expect(mocks.emitFirstQualifiedIntroAsync).not.toHaveBeenCalled();
  });

  it('returns the workflow conversationId when an already-open intro has no matched conversation row', async () => {
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
      corridorState: 'intro_approved',
      fallbackState: null,
    });
    mocks.syncIntroWorkflowFromInterest.mockResolvedValue({
      id: 'intro-existing',
      state: 'conversation_open',
      conversationId: 'conversation-from-workflow',
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
    expect(body.conversationId).toBe('conversation-from-workflow');
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.openIntroConversation).not.toHaveBeenCalled();
  });

  it('keeps intro available when fairness only suppresses ranking detail', async () => {
    mocks.resolveCanonicalFallbackState.mockReturnValue('fairness_suppressed_ranking');
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
      corridorState: 'intro_approved',
      fallbackState: 'fairness_suppressed_ranking',
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
        fairnessStatus: 'unavailable',
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
    expect(body.fallbackState).toBe('fairness_suppressed_ranking');
    expect(mocks.syncIntroWorkflowFromInterest).toHaveBeenCalledWith(
      expect.objectContaining({
        mutual: true,
        matchId: 'match-1',
      })
    );
  });

  it('persists pass as a review-stage mutation and keeps identity hidden', async () => {
    mocks.matchReviewStateFindFirst.mockResolvedValueOnce({
      reviewStage: 'passed',
      revealScope: 'blind',
    });
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage1_capability_and_proof',
      corridorState: 'pass',
      fallbackState: null,
    });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'pass' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewStage).toBe('passed');
    expect(body.revealScope).toBe('blind');
    expect(body.visibleIdentityFields).toEqual([]);
    expect(body.corridorState).toBe('pass');
    expect(mocks.setMatchReviewStage).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        reviewStage: 'passed',
        reasonCode: 'passed_for_now',
        sourceSurface: 'org_review_route',
      })
    );
    expect(mocks.getOrCreateIntroWorkflow).not.toHaveBeenCalled();
  });

  it('records reveal requests as pending participant approval without unlocking identity', async () => {
    mocks.getOrgMembershipRole.mockResolvedValue('org_reviewer');
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
      corridorState: 'request_reveal',
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

    const conversationLimit = vi.fn().mockResolvedValue([
      {
        id: 'conversation-1',
        stage: 'masked',
        participantOneId: 'profile-1',
        participantTwoId: 'user-1',
        participantOneWantsReveal: false,
        participantTwoWantsReveal: false,
      },
    ]);
    const conversationWhere = vi.fn().mockReturnValue({ limit: conversationLimit });
    const conversationFrom = vi.fn().mockReturnValue({ where: conversationWhere });

    mocks.select
      .mockReturnValueOnce({ from: orgFrom })
      .mockReturnValueOnce({ from: matchFrom })
      .mockReturnValueOnce({ from: conversationFrom });

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
    expect(body.corridorState).toBe('request_reveal');
    expect(body.waitingForCandidateApproval).toBe(true);
    expect(body.reviewCard).toEqual(
      expect.objectContaining({
        candidateLabel: 'Submission A7F2',
      })
    );
    expect(body.message).toContain('proof-review participant approves');
    expect(body.message).not.toContain('candidate approves');
    expect(mocks.recordRevealEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorRole: 'org_reviewer',
        requestedScope: 'full_identity',
        reasonCode: 'org_reveal_request_pending',
      })
    );
  });

  it('resets expired reveal requests before creating a fresh pending request', async () => {
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage2_contextual_reveal',
      corridorState: 'request_reveal',
      fallbackState: null,
    });
    mocks.syncRevealRequestTimeoutState.mockResolvedValue({
      conversation: {
        id: 'conversation-1',
        matchId: 'match-1',
        stage: 'masked',
        participantOneId: 'profile-1',
        participantTwoId: 'user-1',
        participantOneWantsReveal: false,
        participantTwoWantsReveal: false,
        participantOneRevealRequestedAt: null,
        participantTwoRevealRequestedAt: null,
      },
      timeout: {
        pending: true,
        expired: true,
        requestedBy: 'participant_two',
        requestedAt: new Date('2026-03-10T09:00:00.000Z'),
        expiresAt: new Date('2026-03-13T09:00:00.000Z'),
        timedOutParticipantId: 'user-1',
      },
      reset: true,
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

    const conversationLimit = vi.fn().mockResolvedValue([
      {
        id: 'conversation-1',
        matchId: 'match-1',
        stage: 'masked',
        participantOneId: 'profile-1',
        participantTwoId: 'user-1',
        participantOneWantsReveal: false,
        participantTwoWantsReveal: true,
        participantOneRevealRequestedAt: null,
        participantTwoRevealRequestedAt: new Date('2026-03-10T09:00:00.000Z'),
      },
    ]);
    const conversationWhere = vi.fn().mockReturnValue({ limit: conversationLimit });
    const conversationFrom = vi.fn().mockReturnValue({ where: conversationWhere });

    mocks.select
      .mockReturnValueOnce({ from: orgFrom })
      .mockReturnValueOnce({ from: matchFrom })
      .mockReturnValueOnce({ from: conversationFrom });

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
    expect(body.waitingForCandidateApproval).toBe(true);
    expect(mocks.syncRevealRequestTimeoutState).toHaveBeenCalledOnce();
    expect(mocks.recordRevealEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: 'system',
        triggerType: 'policy',
        reasonCode: 'reveal_request_expired',
        outcome: 'denied',
      })
    );
    expect(mocks.recordRevealEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({
        actorRole: 'org_manager',
        reasonCode: 'org_reveal_request_pending',
      })
    );
  });

  it('keeps shortlist updates live when fairness persistence fails', async () => {
    mocks.select.mockReset();
    mocks.persistFairnessEvaluationForAssignment.mockRejectedValue(
      new Error('fairness insert failed')
    );
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage1_capability_and_proof',
      corridorState: 'shortlist',
      fallbackState: null,
    });

    const orgLimit = vi.fn().mockResolvedValue([{ id: 'org-1', slug: 'proofound' }]);
    const orgWhere = vi.fn().mockReturnValue({ limit: orgLimit });
    const orgFrom = vi.fn().mockReturnValue({ where: orgWhere });

    const matchLimit = vi.fn().mockResolvedValue([
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
    const matchWhere = vi.fn().mockReturnValue({ limit: matchLimit });
    const matchInnerJoin2 = vi.fn().mockReturnValue({ where: matchWhere });
    const matchInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin2 });
    const matchFrom = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin1 });

    mocks.select.mockReturnValueOnce({ from: orgFrom }).mockReturnValueOnce({ from: matchFrom });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'shortlist' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewStage).toBe('shortlisted');
    expect(body.visibleIdentityFields).not.toContain('displayName');
    expect(body.visibleIdentityFields).not.toContain('handle');
    expect(body.why).toEqual({
      reasonCodes: ['fairness_ranking_suppressed'],
      summary: ['Intro request is blocked until Stage 2.'],
    });
    expect(mocks.buildVisibilitySafeWhy).toHaveBeenCalledWith(
      expect.objectContaining({
        reasonCodes: ['shortlist_selected'],
      })
    );
    expect(body.fairness).toEqual({
      status: 'pass',
      evaluationId: null,
    });
    expect(mocks.setMatchReviewStage).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        reviewStage: 'shortlisted',
      })
    );
  });

  it('self-heals a missing review-state row before shortlisting a visible match', async () => {
    mocks.select.mockReset();
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage1_capability_and_proof',
      corridorState: 'shortlist',
      fallbackState: null,
    });

    const orgLimit = vi.fn().mockResolvedValue([{ id: 'org-1', slug: 'proofound' }]);
    const orgWhere = vi.fn().mockReturnValue({ limit: orgLimit });
    const orgFrom = vi.fn().mockReturnValue({ where: orgWhere });

    const matchLimit = vi.fn().mockResolvedValue([]);
    const matchWhere = vi.fn().mockReturnValue({ limit: matchLimit });
    const matchInnerJoin2 = vi.fn().mockReturnValue({ where: matchWhere });
    const matchInnerJoin1 = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin2 });
    const matchFrom = vi.fn().mockReturnValue({ innerJoin: matchInnerJoin1 });

    const fallbackMatchLimit = vi.fn().mockResolvedValue([
      {
        matchId: 'match-1',
        assignmentId: 'assignment-1',
        profileId: 'profile-1',
        orgId: 'org-1',
        assignmentOperationalFallbackMode: null,
        fairnessStatus: 'pass',
      },
    ]);
    const fallbackMatchWhere = vi.fn().mockReturnValue({ limit: fallbackMatchLimit });
    const fallbackMatchInnerJoin = vi.fn().mockReturnValue({ where: fallbackMatchWhere });
    const fallbackMatchFrom = vi.fn().mockReturnValue({ innerJoin: fallbackMatchInnerJoin });

    mocks.select
      .mockReturnValueOnce({ from: orgFrom })
      .mockReturnValueOnce({ from: matchFrom })
      .mockReturnValueOnce({ from: fallbackMatchFrom });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'shortlist' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.ensureMatchReviewState).toHaveBeenCalledWith({
      matchId: 'match-1',
      assignmentId: 'assignment-1',
      profileId: 'profile-1',
      orgId: 'org-1',
    });
    expect(mocks.setMatchReviewStage).toHaveBeenCalledWith(
      expect.objectContaining({
        matchId: 'match-1',
        reviewStage: 'shortlisted',
      })
    );
    expect(body.reviewStage).toBe('shortlisted');
  });

  it('returns privacy-safe why payloads for reject decisions without exposing identity-bearing fields', async () => {
    mocks.select.mockReset();
    mocks.resolveCanonicalCorridor.mockReturnValue({
      progressiveRevealStage: 'stage1_capability_and_proof',
      corridorState: 'terminal_close',
      fallbackState: null,
    });

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

    mocks.select.mockReturnValueOnce({ from: orgFrom }).mockReturnValueOnce({ from: matchFrom });

    const response = await POST(
      new NextRequest('https://example.com/api/org/proofound/matches/match-1/review', {
        method: 'POST',
        body: JSON.stringify({ action: 'reject' }),
      }),
      {
        params: Promise.resolve({ id: 'proofound', matchId: 'match-1' }),
      } as any
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.reviewStage).toBe('shortlisted');
    expect(body.why).toEqual({
      reasonCodes: ['fairness_ranking_suppressed'],
      summary: ['Intro request is blocked until Stage 2.'],
    });
    expect(body.visibleIdentityFields).not.toContain('displayName');
    expect(body.visibleIdentityFields).not.toContain('handle');
    expect(mocks.buildVisibilitySafeWhy).toHaveBeenCalledWith(
      expect.objectContaining({
        reasonCodes: ['rejected_constraints'],
      })
    );
  });
});
