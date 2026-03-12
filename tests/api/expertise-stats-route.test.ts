import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/readiness/individual-state', () => ({
  getIndividualReadinessState: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalSkillProofSummariesForOwner: vi.fn(),
}));

import { GET } from '@/app/api/expertise/stats/route';
import { requireApiAuthContext } from '@/lib/auth';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { listCanonicalSkillProofSummariesForOwner } from '@/lib/proofs/canonical-pack';

describe('/api/expertise/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        })),
      },
    } as any);
    vi.mocked(getIndividualReadinessState).mockResolvedValue({
      counts: {
        skillsCount: 4,
        skillsWithRecency: 3,
        proofCount: 2,
        qualifyingProofLinkedL4Count: 2,
      },
      highestState: 'browse_ready',
      legacyTier: 'lite',
      trustLevel: 'developing',
      states: ['portfolio_ready', 'browse_ready'],
      flags: {
        hasIntentSignal: true,
        hasLogisticsSignal: true,
        hasPurposeBlock: true,
        hasIntroConstraints: false,
        hasTrustedSignal: true,
      },
      missingByState: {
        portfolio_ready: [],
        browse_ready: [],
        qualified_intro_ready: [],
      },
      nextBestActions: [],
    } as any);
  });

  it('derives proof and verification counts from canonical skill summaries', async () => {
    vi.mocked(listCanonicalSkillProofSummariesForOwner).mockResolvedValue([
      {
        skillId: 'skill-1',
        proofCount: 2,
        verificationCount: 1,
      },
      {
        skillId: 'skill-2',
        proofCount: 1,
        verificationCount: 0,
      },
    ] as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.skillsWithProofs).toBe(2);
    expect(body.skillsWithVerifications).toBe(1);
    expect(body.eligibility.nextTierTarget.message).toContain('anchored proof');
    expect(body.eligibility.nextTierTarget.message).not.toContain('add a few recent skills');
  });
});
