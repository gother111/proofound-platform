import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  findMatch: vi.fn(),
  updateSet: vi.fn(),
  emitAnalyticsEvent: vi.fn(),
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
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.eq,
  and: mocks.and,
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEvent: mocks.emitAnalyticsEvent,
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidatePath: mocks.revalidatePath,
}));

import { DELETE, POST } from '@/app/api/matches/[id]/snooze/route';
import { db } from '@/db';

describe('/api/matches/[id]/snooze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.findMatch.mockResolvedValue({
      id: 'match-1',
      profileId: 'user-1',
    });
    mocks.updateSet.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    mocks.emitAnalyticsEvent.mockResolvedValue(undefined);
  });

  it('keeps the owner predicate on the snooze update itself', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/matches/match-1/snooze', {
        method: 'POST',
        body: JSON.stringify({ duration: 7 }),
      }),
      { params: Promise.resolve({ id: 'match-1' }) }
    );

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet.mock.results[0]?.value.where).toHaveBeenCalledWith({
      op: 'and',
      conditions: [
        { op: 'eq', field: 'id', value: 'match-1' },
        { op: 'eq', field: 'profile_id', value: 'user-1' },
      ],
    });
  });

  it('keeps the owner predicate on the unsnooze update itself', async () => {
    const response = await DELETE(
      new NextRequest('http://localhost/api/matches/match-1/snooze', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'match-1' }) }
    );

    expect(response.status).toBe(200);
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(mocks.updateSet.mock.results[0]?.value.where).toHaveBeenCalledWith({
      op: 'and',
      conditions: [
        { op: 'eq', field: 'id', value: 'match-1' },
        { op: 'eq', field: 'profile_id', value: 'user-1' },
      ],
    });
  });
});
