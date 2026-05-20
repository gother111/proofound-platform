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

vi.mock('@/db/schema', () => ({
  profileFieldVisibility: {
    profileId: 'profile_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field: string, value: unknown) => ({ op: 'eq', field, value })),
}));

import { POST } from '@/app/api/profile/visibility/route';
import { db } from '@/db';

describe('POST /api/profile/visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1' },
    });
    mocks.selectLimit.mockResolvedValue([]);
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
});
