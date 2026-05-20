import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  findMatch: vi.fn(),
  updateSet: vi.fn(),
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
    update: vi.fn(() => ({
      set: mocks.updateSet,
    })),
  },
}));

vi.mock('@/db/schema', () => ({
  matches: {
    id: 'id',
    profileId: 'profile_id',
  },
  assignments: {},
  organizations: {},
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
  and: mocks.and,
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { POST } from '@/app/api/match/hide/route';
import { db } from '@/db';

describe('POST /api/match/hide', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.findMatch.mockResolvedValue({
      id: 'match-1',
      profileId: 'user-1',
      vector: {},
    });
    mocks.updateSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
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
