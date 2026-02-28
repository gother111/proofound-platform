import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET, PUT } from '@/app/api/core/matching/matching-profile/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';
import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/matching/eligibility', () => ({
  evaluateIndividualMatchability: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/analytics/events', () => ({
  emitAnalyticsEventAsync: vi.fn(),
  emitProfileActivated: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      individualProfiles: {
        findFirst: vi.fn(),
      },
      matchingProfiles: {
        findFirst: vi.fn(),
      },
      skills: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('core matching profile route', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireAuth as any).mockResolvedValue({ id: userId });
    (evaluateIndividualMatchability as any).mockResolvedValue({
      eligible: false,
    });
    (db.query.individualProfiles.findFirst as any).mockResolvedValue(null);
    (db.query.skills.findMany as any).mockResolvedValue([]);
  });

  it('persists and returns focus fields from PUT payload', async () => {
    const updatedProfile = {
      profileId: userId,
      desiredRoles: ['Staff Engineer'],
      desiredIndustries: ['Technology'],
      orgTypes: ['startup'],
      weights: { skills: 0.3, pac: 0.2 },
      createdAt: new Date('2026-02-22T00:00:00.000Z'),
      updatedAt: new Date('2026-02-22T00:00:00.000Z'),
    };

    (db.query.matchingProfiles.findFirst as any).mockResolvedValue(updatedProfile);

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    (db.insert as any).mockReturnValue({ values });

    const req = new NextRequest('http://localhost/api/core/matching/matching-profile', {
      method: 'PUT',
      body: JSON.stringify({
        desiredRoles: ['Staff Engineer'],
        desiredIndustries: ['Technology'],
        orgTypes: ['startup'],
        workMode: 'remote',
        availabilityEarliest: '2026-03-01',
        availabilityLatest: '2026-04-01',
        compMin: 90000,
        compMax: 120000,
        compPeriod: 'monthly',
        currency: 'USD',
      }),
    });

    const res = await PUT(req);
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: userId,
        desiredRoles: ['Staff Engineer'],
        desiredIndustries: ['Technology'],
        orgTypes: ['startup'],
        compPeriod: 'monthly',
      })
    );
    expect(payload.profile.desiredRoles).toEqual(['Staff Engineer']);
    expect(payload.profile.desiredIndustries).toEqual(['Technology']);
    expect(payload.profile.orgTypes).toEqual(['startup']);
  });

  it('auto-bootstraps baseline profile row on GET when missing', async () => {
    const bootstrappedProfile = {
      profileId: userId,
      desiredRoles: [],
      desiredIndustries: [],
      orgTypes: [],
      weights: null,
      createdAt: new Date('2026-02-23T00:00:00.000Z'),
      updatedAt: new Date('2026-02-23T00:00:00.000Z'),
    };

    (db.query.matchingProfiles.findFirst as any)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(bootstrappedProfile);

    const onConflictDoNothing = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoNothing });
    (db.insert as any).mockReturnValue({ values });

    const res = await GET();
    const payload = await res.json();

    expect(res.status).toBe(200);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: userId,
      })
    );
    expect(onConflictDoNothing).toHaveBeenCalled();
    expect(payload.profile.profileId).toBe(userId);
    expect(Array.isArray(payload.profile.skills)).toBe(true);
  });

  it('hydrates valuesTags and causeTags from individual profile when omitted in payload', async () => {
    const updatedProfile = {
      profileId: userId,
      valuesTags: ['Integrity', 'Innovation'],
      causeTags: ['Climate', 'Education'],
      createdAt: new Date('2026-02-23T00:00:00.000Z'),
      updatedAt: new Date('2026-02-23T00:00:00.000Z'),
    };

    (db.query.individualProfiles.findFirst as any).mockResolvedValue({
      userId,
      values: [{ label: 'Integrity' }, { label: 'Innovation' }],
      causes: ['Climate', 'Education'],
    });
    (db.query.matchingProfiles.findFirst as any).mockResolvedValue(updatedProfile);

    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    (db.insert as any).mockReturnValue({ values });

    const req = new NextRequest('http://localhost/api/core/matching/matching-profile', {
      method: 'PUT',
      body: JSON.stringify({
        desiredRoles: ['Staff Engineer'],
        desiredIndustries: ['Technology'],
        orgTypes: ['startup'],
        workMode: 'remote',
      }),
    });

    const res = await PUT(req);

    expect(res.status).toBe(200);
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: userId,
        valuesTags: ['Integrity', 'Innovation'],
        causeTags: ['Climate', 'Education'],
      })
    );
  });
});
