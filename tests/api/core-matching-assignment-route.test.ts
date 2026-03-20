/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/db', () => ({
  db: {
    query: {
      assignments: { findFirst: vi.fn() },
      organizationMembers: { findFirst: vi.fn() },
    },
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
  buildProofFirstReviewCard: vi.fn(),
  canMutateReview: vi.fn(() => true),
  ensureMatchReviewState: vi.fn(),
  getReviewCardProofPackMap: vi.fn(async () => new Map()),
  getRankBand: vi.fn(() => 'top_band'),
  getVisibleIdentityFields: vi.fn(() => []),
  normalizeFairnessStatus: vi.fn(() => 'pass'),
  persistFairnessEvaluationForAssignment: vi.fn(async () => ({ id: 'fairness-1', status: 'pass' })),
  resolveCanonicalCorridor: vi.fn(() => ({})),
  resolveCanonicalFallbackState: vi.fn(() => 'browse_only_low_candidate_supply'),
}));

import { POST } from '@/app/api/core/matching/assignment/route';
import { db } from '@/db';
import { requireApiAuthContext } from '@/lib/auth';
import { computeAssignmentMatches } from '@/lib/core/matching/assignmentMatcher';
import { resolveFeatureFlags } from '@/lib/feature-flags/server';

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
});
