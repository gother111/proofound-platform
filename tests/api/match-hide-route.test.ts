import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  findMatch: vi.fn(),
  updateSet: vi.fn(),
  orderBy: vi.fn(),
  revalidatePath: vi.fn(),
  eq: vi.fn((field: string, value: unknown) => ({ op: 'eq', field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      matches: {
        findFirst: mocks.findMatch,
      },
    },
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
    update: vi.fn(() => ({
      set: mocks.updateSet,
    })),
  },
}));

vi.mock('@/db/schema', () => ({
  matches: {
    id: 'id',
    profileId: 'profile_id',
    assignmentId: 'assignment_id',
  },
  assignments: {
    id: 'assignment_id',
    orgId: 'org_id',
    role: 'role',
  },
  organizations: {
    id: 'org_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
  and: mocks.and,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { GET, POST } from '@/app/api/match/hide/route';
import { db } from '@/db';

describe('/api/match/hide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.orderBy.mockResolvedValue([]);
    mocks.findMatch.mockResolvedValue({
      id: 'match-1',
      profileId: 'user-1',
      vector: {},
    });
    mocks.updateSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
  });

  it('returns hidden matches without raw score fields', async () => {
    mocks.orderBy.mockResolvedValue([
      {
        match: {
          id: 'match-1',
          score: '0.93',
          vector: { hidden: true },
        },
        assignment: {
          id: 'assignment-1',
          role: 'Proof operations lead',
          locationMode: 'remote',
          country: 'SE',
        },
        organization: {
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
          assignmentId: 'assignment-1',
          assignment: {
            title: 'Proof operations lead',
            locationMode: 'remote',
            country: 'SE',
          },
          organization: {
            name: 'Proofound Labs',
            logoUrl: null,
          },
        },
      ],
      count: 1,
      scoreVisibility: 'internal_ordering_only',
    });
    expect(body.matches[0]).not.toHaveProperty('score');
  });

  it('returns 400 for malformed JSON before match lookup or update', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/match/hide', {
        method: 'POST',
        body: '{',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(mocks.findMatch).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});
