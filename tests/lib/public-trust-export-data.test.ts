/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/portfolio/public-projection', () => ({
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
}));

import { fetchPublicTrustExportDataByHandle } from '@/lib/portfolio/export-data';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';

describe('fetchPublicTrustExportDataByHandle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns export data only when the public portfolio is accessible', async () => {
    const exportData = {
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Impact builder',
      },
      publication: {
        requestedState: 'public_link_only',
        effectiveState: 'public_link_only',
        searchIndexingEnabled: false,
      },
      signals: {
        identity: { verified: false },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'unverified', hasIdentityVerification: false },
        proofs: { count: 0 },
        verifications: { count: 0 },
        badges: [],
        activeIssues: [],
      },
      skills: [],
      proofPacks: [],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: false,
        linkedin: false,
        identity: false,
        counts: true,
        skills: false,
        bio: false,
        contact: false,
      },
    };

    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: {
        exportData,
      },
    } as any);

    await expect(fetchPublicTrustExportDataByHandle({} as any, 'jane')).resolves.toEqual(
      exportData
    );
  });

  it.each(['missing', 'unavailable'])('returns null when access status is %s', async (status) => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue(
      status === 'missing'
        ? {
            status: 'missing',
            projection: null,
          }
        : {
            status: 'unavailable',
            projection: {
              effectiveState: 'unavailable',
              exportData: { leaked: true },
            },
          }
    );

    await expect(fetchPublicTrustExportDataByHandle({} as any, 'jane')).resolves.toBeNull();
  });
});
