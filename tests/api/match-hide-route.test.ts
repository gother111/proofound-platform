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

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { DELETE, GET, POST } from '@/app/api/match/hide/route';
import { db } from '@/db';
import { log } from '@/lib/log';

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

  it('logs hidden-match list failures with structured diagnostics', async () => {
    const routeError = new Error('hidden match list failed');
    mocks.orderBy.mockRejectedValueOnce(routeError);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch hidden matches' });
    expect(log.error).toHaveBeenCalledWith('match.hide.list_failed', { error: routeError });
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

  it('logs hide update failures with structured diagnostics', async () => {
    const routeError = new Error('hide update failed');
    mocks.updateSet.mockReturnValueOnce({ where: vi.fn().mockRejectedValue(routeError) });

    const response = await POST(
      new NextRequest('http://localhost/api/match/hide', {
        method: 'POST',
        body: JSON.stringify({ matchId: 'match-1' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to hide match' });
    expect(log.error).toHaveBeenCalledWith('match.hide.update_failed', { error: routeError });
  });

  it('logs unhide update failures with structured diagnostics', async () => {
    const routeError = new Error('unhide update failed');
    mocks.updateSet.mockReturnValueOnce({ where: vi.fn().mockRejectedValue(routeError) });

    const response = await DELETE(
      new NextRequest('http://localhost/api/match/hide?matchId=match-1', {
        method: 'DELETE',
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to unhide match' });
    expect(log.error).toHaveBeenCalledWith('match.hide.delete_failed', { error: routeError });
  });
});
