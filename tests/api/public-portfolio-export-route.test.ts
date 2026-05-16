/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/portfolio/public-projection', () => ({
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
}));

vi.mock('@/lib/portfolio/pdf', () => ({
  generateTrustPdf: vi.fn(),
}));

import { GET } from '@/app/api/portfolio/public/[handle]/export/route';
import { generateTrustPdf } from '@/lib/portfolio/pdf';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';

function buildAccessibleAccess() {
  return {
    status: 'accessible' as const,
    projection: {
      exportData: {
        schemaVersion: 'proofound.portfolio-export.v1',
        surface: 'individual_public',
        exportedAt: '2026-03-21T10:00:00.000Z',
        shareUrl: 'https://proofound.io/portfolio/jane',
        profile: {
          id: 'user-1',
          handle: 'jane',
          displayName: 'Jane Doe',
          headline: 'Impact builder',
          bio: 'Proof-first profile',
          contactEmail: undefined,
        },
        signals: {
          identity: { verified: true, method: 'veriff', verifiedAt: '2026-01-01' },
          workEmail: { verified: false },
          linkedin: { verificationStatus: 'verified', hasIdentityVerification: true },
          proofs: { count: 2 },
          verifications: { count: 1 },
          badges: [],
          activeIssues: [],
        },
        skills: [{ id: 'skill-1', name: 'Product Strategy', level: 4 }],
        proofPacks: [
          {
            id: 'pack-1',
            scope: 'public_safe',
            title: 'Proof Pack: Product Strategy',
            summary: 'Launch evidence for Product Strategy',
            ownershipStatement: 'Owned the strategy contribution.',
            evidenceSummary: 'Verified against a public launch memo.',
            outcomesSummary: 'Shipped the MVP in two weeks.',
            verificationStatus: 'verified',
            verificationSummary: 'Scoped verification supports this Proof Pack.',
            freshnessState: 'fresh',
            proofQualityScore: 0.8,
            schemaVersion: 'proof_pack/v2',
            artifactCount: 1,
            contextLabel: 'Product Strategy',
            selectedEvidence: [],
          },
        ],
        visibility: {
          header: true,
          proofBar: true,
          workEmail: false,
          linkedin: true,
          identity: true,
          counts: true,
          skills: true,
          bio: true,
          contact: false,
        },
      },
    },
  };
}

describe('/api/portfolio/public/[handle]/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when profile data cannot be loaded', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'missing',
      projection: null,
    });

    const response = await GET(new Request('http://localhost/api/portfolio/public/jane/export'), {
      params: Promise.resolve({ handle: 'jane' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Profile not found' });
  });

  it('returns a non-empty PDF response when public data exists', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue(
      buildAccessibleAccess() as any
    );
    vi.mocked(generateTrustPdf).mockResolvedValue(Buffer.from('%PDF-1.4 public-profile'));

    const response = await GET(new Request('http://localhost/api/portfolio/public/jane/export'), {
      params: Promise.resolve({ handle: 'jane' }),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('proofound-jane-trust.pdf');
    expect(Number(response.headers.get('content-length'))).toBeGreaterThan(0);
    expect(bytes.length).toBeGreaterThan(0);

    expect(generateTrustPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        profile: expect.objectContaining({
          handle: 'jane',
          contactEmail: undefined,
        }),
        proofPacks: [
          expect.objectContaining({
            title: 'Proof Pack: Product Strategy',
            verificationStatus: 'verified',
          }),
        ],
        visibility: expect.objectContaining({
          contact: false,
          workEmail: false,
        }),
      })
    );
  });

  it('returns canonical JSON when format=json is requested', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue(
      buildAccessibleAccess() as any
    );

    const response = await GET(
      new Request('http://localhost/api/portfolio/public/jane/export?format=json'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_public',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: { handle: 'jane' },
    });
    expect(generateTrustPdf).not.toHaveBeenCalled();
  });

  it('returns text export when format=text is requested', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue(
      buildAccessibleAccess() as any
    );

    const response = await GET(
      new Request('http://localhost/api/portfolio/public/jane/export?format=text'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toContain('Proof-backed summary:');
    expect(generateTrustPdf).not.toHaveBeenCalled();
  });

  it('returns a format-neutral error when export generation fails', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue(
      buildAccessibleAccess() as any
    );
    vi.mocked(generateTrustPdf).mockRejectedValue(new Error('pdf unavailable'));

    const response = await GET(
      new Request('http://localhost/api/portfolio/public/jane/export?format=pdf'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to generate export' });
  });

  it.each(['unavailable', 'private', 'draft', 'unpublished', 'blocked'])(
    'returns 404 for %s public state',
    async (stateLabel) => {
      vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
        status: 'unavailable',
        projection: {
          effectiveState: 'unavailable',
          exportData: buildAccessibleAccess().projection.exportData,
        },
      } as any);

      const response = await GET(
        new Request(`http://localhost/api/portfolio/public/${stateLabel}/export`),
        {
          params: Promise.resolve({ handle: stateLabel }),
        }
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Profile not found' });
      expect(generateTrustPdf).not.toHaveBeenCalled();
    }
  );
});
