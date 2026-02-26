import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, POST } from '@/app/api/matching/profile/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      matchingProfiles: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
  },
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

const userId = '11111111-1111-1111-1111-111111111111';
const now = new Date('2026-02-12T00:00:00.000Z');

describe('matching profile legacy compatibility route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
  });

  it('persists and returns compat name/constraints in POST flow', async () => {
    (requireAuth as any).mockResolvedValue({ id: userId });

    (db.query.matchingProfiles.findFirst as any).mockResolvedValueOnce(null).mockResolvedValueOnce({
      profileId: userId,
      weights: { skills: 0.3, values: 0.2 },
      desiredRoles: ['Product Designer'],
      desiredIndustries: ['Education'],
      orgTypes: ['ngo'],
      verified: {
        __compat_profile: {
          name: 'Product Designer',
          constraints: { requireEmailVerified: false, requireLocationMatch: true },
        },
      },
      createdAt: now,
      updatedAt: now,
    });

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    (db.insert as any).mockReturnValue({ values });

    const req = new NextRequest('http://localhost/api/matching/profile', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Product Designer',
        constraints: { requireEmailVerified: false, requireLocationMatch: true },
        desiredRoles: ['Product Designer'],
        desiredIndustries: ['Education'],
        orgTypes: ['ngo'],
      }),
    });

    const res = await POST(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: userId,
        verified: {
          __compat_profile: {
            name: 'Product Designer',
            constraints: { requireEmailVerified: false, requireLocationMatch: true },
          },
        },
        desiredRoles: ['Product Designer'],
        desiredIndustries: ['Education'],
        orgTypes: ['ngo'],
      })
    );
    expect(payload.profile.name).toBe('Product Designer');
    expect(payload.profile.constraints.requireEmailVerified).toBe(false);
    expect(payload.profile.constraints.requireLocationMatch).toBe(true);
    expect(payload.profile.desiredRoles).toEqual(['Product Designer']);
    expect(payload.profile.desiredIndustries).toEqual(['Education']);
    expect(payload.profile.orgTypes).toEqual(['ngo']);
  });

  it('returns persisted compat metadata on GET', async () => {
    (requireAuth as any).mockResolvedValue({ id: userId });
    (db.query.matchingProfiles.findFirst as any).mockResolvedValue({
      profileId: userId,
      weights: null,
      desiredRoles: ['Policy Analyst'],
      desiredIndustries: ['Public Policy'],
      orgTypes: ['government'],
      verified: {
        __compat_profile: {
          name: 'Policy Analyst',
          constraints: { requireProfileComplete: true },
        },
      },
      createdAt: now,
      updatedAt: now,
    });

    const res = await GET();
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(payload.profiles).toHaveLength(1);
    expect(payload.profiles[0].name).toBe('Policy Analyst');
    expect(payload.profiles[0].constraints.requireProfileComplete).toBe(true);
    expect(payload.profiles[0].desiredRoles).toEqual(['Policy Analyst']);
    expect(payload.profiles[0].desiredIndustries).toEqual(['Public Policy']);
    expect(payload.profiles[0].orgTypes).toEqual(['government']);
  });
});
