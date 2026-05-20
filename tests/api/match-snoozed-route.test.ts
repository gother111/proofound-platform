import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  orderBy: vi.fn(),
  eq: vi.fn((field: string, value: unknown) => ({ op: 'eq', field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
  gt: vi.fn((field: string, value: unknown) => ({ op: 'gt', field, value })),
  isNotNull: vi.fn((field: string) => ({ op: 'isNotNull', field })),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          innerJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: mocks.orderBy,
            })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/db/schema', () => ({
  matches: {
    assignmentId: 'assignment_id',
    profileId: 'profile_id',
    snoozedUntil: 'snoozed_until',
  },
  assignments: {
    id: 'assignment_id',
    orgId: 'org_id',
  },
  organizations: {
    id: 'org_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
  and: mocks.and,
  gt: mocks.gt,
  isNotNull: mocks.isNotNull,
}));

import { GET } from '@/app/api/match/snoozed/route';

describe('GET /api/match/snoozed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.orderBy.mockResolvedValue([]);
  });

  it('returns paused matches with qualitative proof labels instead of raw scores', async () => {
    mocks.orderBy.mockResolvedValue([
      {
        match: {
          id: 'match-1',
          score: '0.84',
          snoozedUntil: '2026-05-27T10:00:00.000Z',
        },
        assignment: {
          id: 'assignment-1',
          role: 'Evidence reviewer',
          description: 'Review proof-backed work samples.',
          status: 'active',
        },
        organization: {
          id: 'org-1',
          displayName: 'Proofound Labs',
          logoUrl: null,
        },
      },
    ]);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      matches: [
        {
          id: 'match-1',
          proofFitLabel: 'Strong proof alignment',
          snoozedUntil: '2026-05-27T10:00:00.000Z',
          assignment: {
            id: 'assignment-1',
            title: 'Evidence reviewer',
            description: 'Review proof-backed work samples.',
            status: 'active',
          },
          organization: {
            id: 'org-1',
            name: 'Proofound Labs',
            logoUrl: null,
          },
        },
      ],
      count: 1,
      scoreVisibility: 'internal_ordering_only',
    });
    expect(body.matches[0]).not.toHaveProperty('matchScore');
    expect(body.matches[0]).not.toHaveProperty('score');
  });
});
