import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const requireAuthMock = vi.fn();
const dbSelectMock = vi.fn();
const listCanonicalProofPackAggregatesForOwnerMock = vi.fn();
const summarizeCanonicalProofOwnerAggregatesMock = vi.fn();

vi.mock('@/lib/auth', () => ({
  requireAuth: (...args: unknown[]) => requireAuthMock(...args),
}));

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => dbSelectMock(...args),
  },
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalProofPackAggregatesForOwner: (...args: unknown[]) =>
    listCanonicalProofPackAggregatesForOwnerMock(...args),
  summarizeCanonicalProofOwnerAggregates: (...args: unknown[]) =>
    summarizeCanonicalProofOwnerAggregatesMock(...args),
}));

vi.mock('drizzle-orm', () => ({
  and: (...args: unknown[]) => ({ op: 'and', args }),
  eq: (...args: unknown[]) => ({ op: 'eq', args }),
  sql: () => ({ op: 'sql' }),
}));

vi.mock('@/db/schema', () => ({
  matches: {
    profileId: 'matches.profile_id',
    score: 'matches.score',
    vector: 'matches.vector',
  },
  verificationRecords: {
    id: 'verification_records.id',
    ownerType: 'verification_records.owner_type',
    ownerId: 'verification_records.owner_id',
    status: 'verification_records.status',
    integrityStatus: 'verification_records.integrity_status',
  },
}));

import { getDashboardMetrics } from '@/lib/dashboard/metrics';

function queryReturning<T>(rows: T[]) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
}

describe('dashboard metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
    requireAuthMock.mockResolvedValue({ id: 'user-1' });
    listCanonicalProofPackAggregatesForOwnerMock.mockResolvedValue([{ pack: { id: 'pack-1' } }]);
    summarizeCanonicalProofOwnerAggregatesMock.mockReturnValue({ packCount: 2 });
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
  });

  it('derives dashboard metrics from canonical proof, verification, and match evidence', async () => {
    dbSelectMock
      .mockReturnValueOnce(queryReturning([{ pending: 1, verified: 2 }]))
      .mockReturnValueOnce(
        queryReturning([
          { score: '0.91', vector: { matches: { highIntent: 2 } } },
          { score: '0.77', vector: { matches: { highIntent: 1 } } },
          { score: '0.80', vector: null },
        ])
      );

    const metrics = await getDashboardMetrics();

    expect(metrics).toEqual({
      proofStoriesCount: 2,
      verifiedSkills: 2,
      pendingVerifications: 1,
      qualifiedMatches: 2,
      activeIntroductions: 3,
    });
    expect(listCanonicalProofPackAggregatesForOwnerMock).toHaveBeenCalledWith(
      'individual_profile',
      'user-1'
    );
  });

  it('does not return a canned zero dashboard in plain mock Supabase mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    dbSelectMock
      .mockReturnValueOnce(queryReturning([{ pending: 3, verified: 1 }]))
      .mockReturnValueOnce(
        queryReturning([{ score: '0.95', vector: { matches: { highIntent: 4 } } }])
      );
    summarizeCanonicalProofOwnerAggregatesMock.mockReturnValue({ packCount: 5 });

    const metrics = await getDashboardMetrics();

    expect(metrics).toMatchObject({
      proofStoriesCount: 5,
      verifiedSkills: 1,
      pendingVerifications: 3,
      qualifiedMatches: 1,
      activeIntroductions: 4,
    });
    expect(dbSelectMock).toHaveBeenCalledTimes(2);
  });
});
