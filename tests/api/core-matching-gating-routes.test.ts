import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST as postProfile } from '@/app/api/core/matching/profile/route';
import { POST as postNearMatches } from '@/app/api/core/matching/near-matches/route';
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
  message: 'Profile is not matchable',
  counts: {
    skillsWithRecency: 2,
    proofCount: 0,
    hasPurpose: false,
    hasConstraints: false,
  },
  unmetCriteria: ['skillsWithRecency', 'proofs'],
  nextTierTarget: {
    tier: 'lite',
    message: 'Add recent skills and one preference to unlock personalized browse results.',
    remaining: { skillsWithRecency: 1, proofCount: 1, purpose: 1, constraints: 1 },
  },
  criteria: {
    skillsWithRecency: { id: 'skillsWithRecency', label: 'Skills', met: false, detail: 'x' },
  },
  topActions: [
    {
      id: 'update-expertise',
      title: 'Update Expertise Atlas',
      description: 'Add skills and proofs',
      actionUrl: '/app/i/expertise',
    },
  ],
  readiness: {
    states: [],
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
    expect(payload.topActions[0].actionUrl).toBe('/app/i/expertise');
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
});
