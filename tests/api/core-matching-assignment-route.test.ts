/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      matchReviewStates: { findMany: vi.fn() },
      matchingProfiles: { findMany: vi.fn() },
      organizationMembers: { findFirst: vi.fn() },
    },
    insert: vi.fn(),
    select: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/authz', () => ({
  normalizeAuthorizedOrgRole: vi.fn(() => 'org_owner'),
}));

vi.mock('@/lib/core/matching/assignmentMatcher', () => ({
  computeAssignmentMatches: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  resolveFeatureFlags: vi.fn(),
}));

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@/lib/matching/review-contract', () => ({
  appendSystemReasonLedger: vi.fn(),
  buildVisibilitySafeWhy: vi.fn(() => ({ summary: 'fallback active' })),
  buildCanonicalMatchPersistenceFields: vi.fn(),
  buildProofFirstReviewCard: vi.fn(() => ({
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
    fitBand: 'Relevant partial',
    fitSummary: {
      headline: 'Proof signals align with the assignment needs.',
      bullets: ['Evidence is available for review.'],
      reasonCodes: ['alias_skill_overlap'],
    },
    privacy: {
      reviewState: 'visible',
      reasons: [],
    },
  })),
  canMutateReview: vi.fn(() => true),
  ensureMatchReviewState: vi.fn(),
  getReviewCardProofPackMap: vi.fn(async () => new Map()),
  getReviewCardProofPackMapForMatchedOrg: vi.fn(async () => new Map()),
  getRankBand: vi.fn(() => 'top_band'),
  getVisibleIdentityFields: vi.fn(() => []),
  normalizeFairnessStatus: vi.fn(() => 'pass'),
  persistFairnessEvaluationForAssignment: vi.fn(async () => ({ id: 'fairness-1', status: 'pass' })),
  resolveCanonicalCorridor: vi.fn(() => ({})),
  resolveCanonicalFallbackState: vi.fn(() => 'browse_only_low_candidate_supply'),
}));

import { POST } from '@/app/api/core/matching/assignment/handler';
import { db } from '@/db';
import { requireApiAuthContext } from '@/lib/auth';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { resolveFeatureFlags } from '@/lib/feature-flags/server';
import { emitLaunchTrace } from '@/lib/launch/trace';

describe('/api/core/matching/assignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockResolvedValue({
      user: {
        id: 'user-1',
      },
    });
    (db.query.assignments.findFirst as any).mockResolvedValue({
      id: 'assignment-1',
      orgId: 'org-1',
    });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({
      role: 'org_owner',
      status: 'active',
    });
    (db.query.matchReviewStates.findMany as any).mockResolvedValue([]);
    (db.query.matchingProfiles.findMany as any).mockResolvedValue([]);
    (db.select as any).mockReset();
    (db.select as any).mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(async () => []),
          })),
        })),
      })),
    }));
    (db.insert as any).mockImplementation(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: vi.fn(() => ({
          returning: vi.fn(async () => [
            {
              id: 'match-1',
              profileId: 'profile-1',
              assignmentId: '11111111-1111-1111-1111-111111111111',
              generatedAt: new Date('2026-05-20T00:00:00.000Z'),
              reasonCodes: ['proof_pack_relevant'],
            },
          ]),
        })),
      })),
    }));
  });

  it('rejects malformed JSON before assignment lookup or matching work', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/core/matching/assignment', {
        method: 'POST',
        body: '{"assignmentId":',
        headers: { 'content-type': 'application/json' },
      })
    );

    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(response.status).toBe(400);
    expect(db.query.assignments.findFirst).not.toHaveBeenCalled();
    expect(computeAssignmentMatches).not.toHaveBeenCalled();
    expect(emitLaunchTrace).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        outcome: 'rejected',
        failureClass: 'invalid_json_body',
      })
    );
  });

  it('keeps retained assignment matches proof-first without returning raw score artifacts', async () => {
    (db.select as any).mockImplementation(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(async () => [
              {
                id: 'match-retained-1',
                profileId: 'profile-1',
                assignmentId: '11111111-1111-1111-1111-111111111111',
                score: 0.91,
                scoreTotal: 9100,
                subscoresJson: { proof_fit: 9100 },
                scoreSnapshotJson: {
                  discovery_status: 'review_ready_match',
                  fit_band: 'relevant_partial',
                },
                reasonCodes: [
                  'alias_skill_overlap',
                  'fresh_proof_present',
                  'non_self_trust_anchor_present',
                  'privacy_safe_for_stage',
                  'constraint_match',
                ],
                generatedAt: new Date('2026-05-20T00:00:00.000Z'),
                fairnessStatus: 'pass',
              },
            ]),
          })),
        })),
      })),
    }));
    (db.query.matchingProfiles.findMany as any).mockResolvedValue([
      { profileId: 'profile-1', verified: { proofPack: true } },
    ]);

    const response = await POST(
      new NextRequest('http://localhost/api/core/matching/assignment', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: '11111111-1111-1111-1111-111111111111',
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(computeAssignmentMatches).not.toHaveBeenCalled();
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).not.toHaveProperty('score');
    expect(body.items[0]).not.toHaveProperty('scoreTotal');
    expect(body.items[0]).not.toHaveProperty('subscoresJson');
    expect(body.items[0]).not.toHaveProperty('scoreSnapshotJson');
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        id: 'match-retained-1',
        profileId: 'profile-1',
        discoveryStatus: 'review_ready_match',
        fitBand: 'relevant_partial',
        rank: null,
        rankBand: 'top_band',
      })
    );
    expect(body.meta).toEqual(
      expect.objectContaining({
        cached: true,
        scoreVisibility: 'internal_ordering_only',
        weights: {},
      })
    );
  });

  it('returns a named fallback state when shortlist output is suppressed', async () => {
    (computeAssignmentMatches as any).mockResolvedValue({
      items: [],
      meta: { source: 'test' },
    });
    (resolveFeatureFlags as any).mockResolvedValue({
      FF_QUALIFIED_INTRO_CORRIDOR: false,
      FF_EXACT_RANK_EXPOSURE: false,
      FF_KILL_SWITCH_INTROS: false,
      FF_KILL_SWITCH_EXACT_RANK: true,
    });

    const response = await POST(
      new NextRequest('http://localhost/api/core/matching/assignment', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: '11111111-1111-1111-1111-111111111111',
        }),
      })
    );
    const body = await response.json();
    if (response.status !== 200) {
      // Temporary visibility when route dependencies change unexpectedly.
      console.log(body);
    }

    expect(response.status).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.meta.launchFallback).toEqual({
      mode: 'browse_only_low_candidate_supply',
      activeModes: [
        'browse_only_low_candidate_supply',
        'intro_hold_insufficient_qualified_intros',
        'fairness_suppressed_ranking',
      ],
      introCorridorLive: false,
      exactRankLive: false,
    });
  });

  it('keeps exact rank suppressed even when the legacy exact-rank flag is enabled', async () => {
    (computeAssignmentMatches as any).mockResolvedValue({
      items: [
        {
          profileId: 'profile-1',
          score: 0.91,
          scoreTotal: 9100,
          subscoresJson: {},
          scoreSnapshotJson: {
            discovery_status: 'review_ready_match',
            fit_band: 'relevant_partial',
          },
          reasonCodes: [
            'alias_skill_overlap',
            'fresh_proof_present',
            'non_self_trust_anchor_present',
            'privacy_safe_for_stage',
            'constraint_match',
          ],
          profile: { profileId: 'profile-1', verified: { proofPack: true } },
          artifact: {
            scoreNormalized: 0.91,
            scoreTotal: 9100,
            subscoresJson: {},
            scoreSnapshotJson: {
              discovery_status: 'review_ready_match',
              fit_band: 'relevant_partial',
            },
            reasonCodes: [
              'alias_skill_overlap',
              'fresh_proof_present',
              'non_self_trust_anchor_present',
              'privacy_safe_for_stage',
              'constraint_match',
            ],
          },
        },
      ],
      meta: { source: 'test' },
    });
    (resolveFeatureFlags as any).mockResolvedValue({
      FF_QUALIFIED_INTRO_CORRIDOR: true,
      FF_EXACT_RANK_EXPOSURE: true,
      FF_KILL_SWITCH_INTROS: false,
      FF_KILL_SWITCH_EXACT_RANK: false,
    });

    const response = await POST(
      new NextRequest('http://localhost/api/core/matching/assignment', {
        method: 'POST',
        body: JSON.stringify({
          assignmentId: '11111111-1111-1111-1111-111111111111',
          refresh: true,
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).not.toHaveProperty('score');
    expect(body.items[0]).not.toHaveProperty('scoreTotal');
    expect(body.items[0]).not.toHaveProperty('subscoresJson');
    expect(body.items[0]).not.toHaveProperty('scoreSnapshotJson');
    expect(body.items[0].rank).toBeNull();
    expect(body.items[0].rankBand).toBe('top_band');
    expect(body.items[0]).toEqual(
      expect.objectContaining({
        anonymousCandidateLabel: 'Submission A7F2',
        discoveryStatus: 'review_ready_match',
        fitBand: 'relevant_partial',
        introGate: 'intro_ready',
        canRequestIntro: false,
        missingGates: [],
      })
    );
    expect(body.items[0].reasonDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'alias_skill_overlap',
        }),
      ])
    );
    expect(body.items[0].proofSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          summary: 'Proof-backed review signal.',
        }),
      ])
    );
    expect(body.meta.weights).toEqual({});
    expect(body.meta.scoreVisibility).toBe('internal_ordering_only');
    expect(body.meta.launchFallback.exactRankLive).toBe(false);
    expect(body.meta.launchFallback.activeModes).toContain('fairness_suppressed_ranking');
  });
});
