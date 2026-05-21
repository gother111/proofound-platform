/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/portfolio/public-projection', () => ({
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/portfolio/public/[handle]/summary/route';
import { resolvePublicIndividualPortfolioAccessByHandle } from '@/lib/portfolio/public-projection';
import { log } from '@/lib/log';

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
          bio: 'Proof-backed profile.',
          contactEmail: 'secret@example.com',
        },
        signals: {
          identity: { verified: true, method: 'veriff', verifiedAt: '2026-01-01' },
          workEmail: { verified: false },
          linkedin: { verificationStatus: 'verified', hasIdentityVerification: true },
          proofs: { count: 1 },
          verifications: { count: 0 },
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
            ownershipStatement: 'Owned the launch contribution.',
            evidenceSummary: 'Verified against a public launch memo.',
            outcomesSummary: 'Shipped the MVP in two weeks.',
            verificationStatus: 'verified',
            verificationSummary: 'Scoped verification supports this Proof Pack.',
            freshnessState: 'fresh',
            proofQualityScore: 0.8,
            schemaVersion: 'proof_pack/v2',
            artifactCount: 1,
            contextLabel: 'Product Strategy',
            selectedEvidence: [
              {
                title: 'Launch memo',
                href: 'https://example.com/launch-memo',
                artifactKind: 'link',
                issuedAt: '2026-02-20',
                description: 'Public launch memo',
              },
            ],
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

describe('/api/portfolio/public/[handle]/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when handle is missing', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'missing',
      projection: null,
    });

    const response = await GET(
      new Request('http://localhost/api/portfolio/public/missing/summary'),
      {
        params: Promise.resolve({ handle: 'missing' }),
      }
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Profile not found' });
  });

  it('returns safe public summary text without leaking hidden email', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue(
      buildAccessibleAccess() as any
    );

    const response = await GET(new Request('http://localhost/api/portfolio/public/jane/summary'), {
      params: Promise.resolve({ handle: 'jane' }),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('Jane Doe');
    expect(body).toContain('Proof-backed summary:');
    expect(body).toContain('- Proof Pack: Product Strategy: Shipped the MVP in two weeks.');
    expect(body).toContain('Selected proof packs:');
    expect(body).toContain('Outcomes: Shipped the MVP in two weeks.');
    expect(body).toContain('Context: Product Strategy');
    expect(body).toContain('Verification: Verified evidence');
    expect(body).toContain('Freshness: Fresh');
    expect(body).toContain('Portfolio: https://proofound.io/portfolio/jane');
    expect(body).toContain('Selected evidence: Launch memo (https://example.com/launch-memo)');
    expect(body).toContain('Skills evidenced in selected proof:');
    expect(body).toContain('Product Strategy');
    expect(body).toContain('Email: hidden');
    expect(body).not.toContain('secret@example.com');
    expect(body).not.toContain('Top skills:');
    expect(body).not.toContain('Identity:');
    expect(body).not.toContain('Work email:');
    expect(body).not.toContain('LinkedIn:');
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
        new Request(`http://localhost/api/portfolio/public/${stateLabel}/summary`),
        {
          params: Promise.resolve({ handle: stateLabel }),
        }
      );

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Profile not found' });
    }
  );

  it('logs public summary failures with structured diagnostics', async () => {
    const routeError = new Error('projection failed');
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockRejectedValue(routeError);

    const response = await GET(new Request('http://localhost/api/portfolio/public/jane/summary'), {
      params: Promise.resolve({ handle: 'jane' }),
    });
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to build summary' });
    expect(log.error).toHaveBeenCalledWith('portfolio.public_summary.failed', {
      error: routeError,
    });
  });
});
