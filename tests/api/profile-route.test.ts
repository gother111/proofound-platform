import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireApiAuthContext: vi.fn(),
  select: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: mocks.requireApiAuthContext,
}));

vi.mock('@/db', () => ({
  db: {
    select: mocks.select,
  },
}));

vi.mock('@/db/schema', () => {
  const makeTable = (name: string) =>
    new Proxy(
      {},
      {
        get: (_target, prop) => `${name}.${String(prop)}`,
      }
    );

  return {
    profiles: makeTable('profiles'),
    experiences: makeTable('experiences'),
  };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(() => 'eq'),
}));

import { GET } from '@/app/api/profile/route';

describe('/api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns unauthorized when the request has no authenticated user', async () => {
    mocks.requireApiAuthContext.mockResolvedValue(null);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
    expect(mocks.select).not.toHaveBeenCalled();
  });

  it('returns the compatibility profile payload for authenticated requests', async () => {
    mocks.requireApiAuthContext.mockResolvedValue({
      user: { id: 'user-1', displayName: 'Proofound Flow Tester' },
    });

    const profileLimit = vi.fn().mockResolvedValue([{ displayName: 'Proofound Flow Tester' }]);
    const profileWhere = vi.fn().mockReturnValue({ limit: profileLimit });
    const profileFrom = vi.fn().mockReturnValue({ where: profileWhere });

    const experienceWhere = vi
      .fn()
      .mockResolvedValue([{ id: 'exp-1', title: 'Senior Product Engineer' }]);
    const experienceFrom = vi.fn().mockReturnValue({ where: experienceWhere });

    mocks.select
      .mockReturnValueOnce({ from: profileFrom })
      .mockReturnValueOnce({ from: experienceFrom });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      displayName: 'Proofound Flow Tester',
      experiences: [{ id: 'exp-1', title: 'Senior Product Engineer' }],
    });
  });
});
