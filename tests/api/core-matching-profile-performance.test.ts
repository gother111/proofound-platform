import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/core/matching/profile/route';
import { annRetrieveSimilarAssignments } from '@/lib/matching/semantic';

const mockState = vi.hoisted(() => {
  const mockSelectQueue: Array<{ mode: 'direct' | 'limit'; rows: any[] }> = [];
  const mockInsertReturning = vi.fn();
  const mockSelect = vi.fn(() => {
    const entry = mockSelectQueue.shift() || { mode: 'direct' as const, rows: [] };
    return {
      from: vi.fn(() => ({
        where: vi.fn(() => {
          const rowsPromise = Promise.resolve(entry.rows) as Promise<any[]> & {
            limit: ReturnType<typeof vi.fn>;
          };
          rowsPromise.limit = vi.fn(async () => entry.rows);
          return rowsPromise;
        }),
      })),
    };
  });
  const mockInsert = vi.fn(() => ({
    values: vi.fn(() => ({
      onConflictDoUpdate: vi.fn(() => ({
        returning: mockInsertReturning,
      })),
    })),
  }));

  return {
    mockSelectQueue,
    mockSelect,
    mockInsert,
    mockInsertReturning,
  };
});

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(async () => ({ rows: [] })),
    select: mockState.mockSelect,
    insert: mockState.mockInsert,
    query: {
      matchingProfiles: {
        findFirst: vi.fn(async () => ({
          profileId: '11111111-1111-1111-1111-111111111111',
          valuesTags: [],
          causeTags: [],
          languages: [],
          verified: {},
          availabilityEarliest: null,
          hoursMin: null,
          hoursMax: null,
          workMode: null,
          country: null,
          compMin: null,
          compMax: null,
          compPeriod: 'annual',
          currency: 'USD',
          desiredRoles: [],
          desiredIndustries: [],
          orgTypes: [],
          weights: null,
          needsSponsorship: false,
          wishesSponsorship: false,
        })),
      },
      skills: {
        findMany: vi.fn(async () => []),
      },
      consentObligations: {
        findFirst: vi.fn(async () => null),
      },
      assignmentExpertiseMatrix: {
        findMany: vi.fn(async () => []),
      },
      matches: {
        findMany: vi.fn(async () => []),
      },
    },
  },
}));

vi.mock('@/lib/cache', () => ({
  CACHE_KEYS: { PROFILE: 'profile:', USER_SKILLS: 'skills:' },
  CACHE_TTL: { PROFILE: 60, USER_SKILLS: 60 },
  getOrSet: async (_key: string, fn: () => Promise<unknown>) => fn(),
}));

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(async () => ({ user: { id: '11111111-1111-1111-1111-111111111111' } })),
  isTrustedInternalRequest: vi.fn(() => false),
}));

vi.mock('@/lib/matching/eligibility', () => ({
  evaluateIndividualMatchability: vi.fn(async () => ({
    profileId: '11111111-1111-1111-1111-111111111111',
    eligible: true,
    tier: 'lite',
    counts: {},
    unmetCriteria: [],
    nextTierTarget: null,
  })),
  toNotMatchablePayload: vi.fn(),
}));

vi.mock('@/lib/matching/semantic', () => ({
  annRetrieveSimilarAssignments: vi.fn(async () => []),
  batchGetMissionVisionScoresForProfile: vi.fn(async () => new Map()),
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

vi.mock('@/lib/core/matching/firewall', () => ({
  scrubDisallowedFields: (value: unknown) => value,
}));

describe('/api/core/matching/profile performance metadata', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState.mockSelectQueue.length = 0;
    process.env.MATCHING_TWO_STAGE_ENABLED = 'true';
  });

  it('returns full_scan metadata when ANN yields no assignments', async () => {
    mockState.mockSelectQueue.push({ mode: 'limit', rows: [] });

    const request = new NextRequest('http://localhost/api/core/matching/profile', {
      method: 'POST',
      body: JSON.stringify({ k: 20 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.twoStageEnabled).toBe(true);
    expect(body.meta.candidatePoolSource).toBe('full_scan');
    expect(body.meta.candidatePoolSize).toBe(0);
  });

  it('returns ann_hybrid metadata when ANN assignment candidates are available', async () => {
    (annRetrieveSimilarAssignments as any).mockResolvedValueOnce([
      { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', similarity: 0.91 },
    ]);

    mockState.mockSelectQueue.push({
      mode: 'direct',
      rows: [
        {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          orgId: null,
          role: 'Engineer',
          description: null,
          status: 'active',
          valuesRequired: [],
          causeTags: [],
          mustHaveSkills: [],
          niceToHaveSkills: [],
          minLanguage: null,
          locationMode: null,
          country: null,
          compMin: null,
          compMax: null,
          currency: 'USD',
          hoursMin: null,
          hoursMax: null,
          startEarliest: null,
          startLatest: null,
          verificationGates: [],
          weights: null,
          canSponsorVisa: false,
          sponsorshipCountries: [],
        },
      ],
    });

    mockState.mockInsertReturning.mockResolvedValueOnce([
      {
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        assignmentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
    ]);

    const request = new NextRequest('http://localhost/api/core/matching/profile', {
      method: 'POST',
      body: JSON.stringify({ k: 20 }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.candidatePoolSource).toBe('ann_hybrid');
    expect(body.meta.candidatePoolSize).toBe(1);
    expect(body.meta.twoStageEnabled).toBe(true);
  });
});
