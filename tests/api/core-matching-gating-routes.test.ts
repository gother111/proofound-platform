import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST as postProfile } from '@/app/api/core/matching/profile/handler';
import { POST as postNearMatches } from '@/app/api/core/matching/near-matches/handler';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import { requireApiAuth } from '@/lib/api/auth';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';

vi.mock('@/db', () => ({
  db: {},
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
  emitFirstMatchShown: vi.fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
  isTrustedInternalRequest: vi.fn(() => false),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/matching/eligibility', () => ({
  evaluateIndividualMatchability: vi.fn(),
  toSoftGatedPayload: (result: any) => ({
    items: [],
    meta: {
      softGated: true,
      message: result.message,
    },
    eligibility: result,
    readiness: result.readiness,
    topActions: result.topActions,
  }),
}));

const baseEligibility = {
  profileId: '11111111-1111-1111-1111-111111111111',
  eligible: false,
  status: 'not_matchable',
  tier: 'none',
  trustLevel: 'none',
  introEligibility: {
    status: 'blocked_profile',
    profileEligible: false,
    assignmentEligible: null,
    reasonCodes: ['discoverable_requirements_incomplete'],
    missingRequirements: [],
    nextActions: [],
    qualifyingProofLinkedL4Count: 0,
    roleRelevantProofLinkedL4Count: 0,
    assignmentRelevantProofLinkedL4Count: 0,
    activeTrustAnchorCount: 0,
  },
  message: 'Profile is not matchable',
  counts: {
    skillsWithRecency: 2,
    proofCount: 0,
    hasConstraints: false,
    hasIntentSignal: false,
    hasLogisticsSignal: false,
    hasTrustedSignal: false,
    qualifyingProofLinkedL4Count: 0,
    roleRelevantProofLinkedL4Count: 0,
    activeTrustAnchorCount: 0,
  },
  unmetCriteria: ['skillsWithRecency', 'proofs'],
  nextTierTarget: {
    tier: 'lite',
    message: 'Add recent skills and one preference to unlock personalized browse results.',
    remaining: { skillsWithRecency: 1, proofCount: 1, intentSignal: 1, constraints: 1 },
  },
  criteria: {
    skillsWithRecency: { id: 'skillsWithRecency', label: 'Skills', met: false, detail: 'x' },
  },
  topActions: [
    {
      id: 'update-public-portfolio',
      title: 'Strengthen Public Page proof',
      description: 'Refresh proof-backed work examples and trust signals.',
      actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
    },
  ],
  readiness: {
    states: [],
    trustLevel: 'none',
  },
};

describe('core matching gating routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireApiAuth as any).mockResolvedValue({
      user: { id: baseEligibility.profileId },
    });
    (requireAuth as any).mockResolvedValue({
      id: baseEligibility.profileId,
    });
    (evaluateIndividualMatchability as any).mockResolvedValue(baseEligibility);
  });

  it('/api/core/matching/profile returns 200 with soft-gate payload when browse requirements are incomplete', async () => {
    const req = new NextRequest('http://localhost/api/core/matching/profile', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await postProfile(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.meta.softGated).toBe(true);
    expect(payload.eligibility.unmetCriteria).toEqual(baseEligibility.unmetCriteria);
    expect(payload.topActions[0].actionUrl).toBe('/app/i/profile?profileView=full&tab=proof_packs');
  });

  it('/api/core/matching/near-matches returns 200 with same soft-gate shape when browse requirements are incomplete', async () => {
    const req = new NextRequest('http://localhost/api/core/matching/near-matches', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await postNearMatches(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.meta.softGated).toBe(true);
    expect(payload.eligibility.unmetCriteria).toEqual(baseEligibility.unmetCriteria);
    expect(Array.isArray(payload.topActions)).toBe(true);
  });

  it('/api/core/matching/near-matches rejects malformed JSON before matchability checks', async () => {
    const req = new NextRequest('http://localhost/api/core/matching/near-matches', {
      method: 'POST',
      body: '{"k":',
      headers: { 'content-type': 'application/json' },
    });

    const res = await postNearMatches(req);

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(evaluateIndividualMatchability).not.toHaveBeenCalled();
  });

  it('/api/core/matching/near-matches does not expose backend error details', async () => {
    (evaluateIndividualMatchability as any).mockRejectedValueOnce(
      new Error('relation "matching_profiles" does not exist for verifier@example.com')
    );
    const req = new NextRequest('http://localhost/api/core/matching/near-matches', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await postNearMatches(req);
    const payload = await res.json();

    expect(res.status).toBe(500);
    expect(payload).toEqual({
      error: 'Matching failed',
      message: 'Unable to fetch matches. Please try again.',
    });
    expect(JSON.stringify(payload)).not.toContain('matching_profiles');
    expect(JSON.stringify(payload)).not.toContain('verifier@example.com');
  });
});
