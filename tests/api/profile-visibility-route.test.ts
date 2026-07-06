import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  selectLimit: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: mocks.selectLimit,
        })),
      })),
    })),
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  profileFieldVisibility: {
    profileId: 'profile_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field: string, value: unknown) => ({ op: 'eq', field, value })),
}));

import { GET, POST } from '@/app/api/profile/visibility/route';
import { db } from '@/db';
import { log } from '@/lib/log';

describe('POST /api/profile/visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.selectLimit.mockResolvedValue([]);
  });

  it('GET logs visibility lookup failures with structured diagnostics', async () => {
    const routeError = new Error('visibility lookup failed');
    mocks.selectLimit.mockRejectedValueOnce(routeError);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch visibility settings' });
    expect(log.error).toHaveBeenCalledWith('profile.visibility.get_failed', {
      error: routeError,
    });
  });

  it('returns 400 for malformed JSON before visibility lookup or writes', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/profile/visibility', {
        method: 'POST',
        body: '{',
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(db.select).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('POST logs visibility lookup failures with structured diagnostics', async () => {
    const routeError = new Error('visibility update lookup failed');
    mocks.selectLimit.mockRejectedValueOnce(routeError);

    const response = await POST(
      new NextRequest('http://localhost/api/profile/visibility', {
        method: 'POST',
        body: JSON.stringify({ headline: 'public' }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to update visibility settings' });
    expect(log.error).toHaveBeenCalledWith('profile.visibility.update_failed', {
      error: routeError,
    });
  });
});
