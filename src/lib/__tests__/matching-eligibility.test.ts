import { beforeEach, describe, expect, it, vi } from 'vitest';

import { evaluateIndividualMatchability } from '@/lib/matching/eligibility';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    query: {
      matchingProfiles: {
        findFirst: vi.fn(),
      },
      individualProfiles: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
  },
}));

function mockCountQueries(skillCount: number, proofCount: number) {
  const whereMock = vi
    .fn()
    .mockResolvedValueOnce([{ count: skillCount }])
    .mockResolvedValueOnce([{ count: proofCount }]);

  const fromMock = vi.fn(() => ({ where: whereMock }));
  (db.select as any).mockImplementation(() => ({ from: fromMock }));
}

describe('evaluateIndividualMatchability', () => {
  const profileId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns eligible when all A7 criteria are met', async () => {
    (db.query.matchingProfiles.findFirst as any).mockResolvedValue({
      profileId,
      workMode: 'remote',
      availabilityEarliest: '2026-03-01',
      availabilityLatest: '2026-04-01',
      compMin: 100000,
      compMax: 140000,
      currency: 'USD',
    });
    (db.query.individualProfiles.findFirst as any).mockResolvedValue({
      userId: profileId,
      mission: 'Build trustworthy systems',
      values: [],
      causes: [],
    });
    mockCountQueries(10, 1);

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(true);
    expect(result.tier).toBe('strong');
    expect(result.unmetCriteria).toHaveLength(0);
    expect(result.nextTierTarget).toBeNull();
  });

  it('returns lite tier when base criteria are met with 3+ skills but below strong threshold', async () => {
    (db.query.matchingProfiles.findFirst as any).mockResolvedValue({
      profileId,
      workMode: 'remote',
      availabilityEarliest: '2026-03-01',
      availabilityLatest: '2026-04-01',
      compMin: 90000,
      compMax: 120000,
      currency: 'USD',
    });
    (db.query.individualProfiles.findFirst as any).mockResolvedValue({
      userId: profileId,
      mission: null,
      values: ['impact'],
      causes: [],
    });
    mockCountQueries(3, 1);

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(true);
    expect(result.tier).toBe('lite');
    expect(result.nextTierTarget?.tier).toBe('strong');
    expect(result.nextTierTarget?.remaining.skillsWithRecency).toBe(7);
  });

  it('fails each criterion independently', async () => {
    (db.query.matchingProfiles.findFirst as any).mockResolvedValue({
      profileId,
      workMode: null,
      availabilityEarliest: null,
      availabilityLatest: null,
      compMin: null,
      compMax: null,
      currency: null,
    });
    (db.query.individualProfiles.findFirst as any).mockResolvedValue({
      userId: profileId,
      mission: null,
      values: [],
      causes: [],
    });
    mockCountQueries(2, 0);

    const result = await evaluateIndividualMatchability(profileId);

    expect(result.eligible).toBe(false);
    expect(result.unmetCriteria).toContain('skillsWithRecency');
    expect(result.unmetCriteria).toContain('proofs');
    expect(result.unmetCriteria).toContain('purpose');
    expect(result.unmetCriteria).toContain('constraints');
    expect(result.topActions.map((action) => action.actionUrl)).toEqual(
      expect.arrayContaining(['/app/i/expertise', '/app/i/matching/preferences', '/app/i/profile'])
    );
  });
});
