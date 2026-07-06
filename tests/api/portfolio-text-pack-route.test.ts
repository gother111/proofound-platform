/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/export-data', () => ({
  fetchTrustExportData: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/portfolio/text-pack/route';
import { fetchTrustExportData } from '@/lib/portfolio/export-data';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';

function mockSupabaseUser(user: { id: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
  });
}

describe('/api/portfolio/text-pack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is unauthenticated', async () => {
    mockSupabaseUser(null);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when export data is unavailable', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Profile not found' });
  });

  it('returns canonical text export from proof record data', async () => {
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_owner',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Impact builder',
        bio: 'Proof-backed profile.',
        contactEmail: 'jane@example.com',
      },
      signals: {
        identity: { verified: true, method: 'veriff', verifiedAt: '2026-01-01' },
        workEmail: { verified: true },
        linkedin: { confidence: 91, hasVerificationBadge: true },
        proofs: { count: 1 },
        verifications: { count: 0 },
        badges: [],
        activeIssues: [],
      },
      skills: [{ id: 'skill-1', name: 'Product Strategy', level: 4 }],
      proofPacks: [
        {
          id: 'pack-1',
          scope: 'owner_full',
          title: 'Product strategy proof record',
          summary: 'Launch evidence for Product Strategy',
          ownershipStatement: 'Owned the strategy contribution.',
          evidenceSummary: 'Verified against a public launch memo.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this proof record.',
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
        workEmail: true,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: true,
      },
    });

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('content-disposition')).toContain('proofound-jane-summary.txt');
    expect(body).toContain('Portfolio: https://proofound.io/portfolio/jane');
    expect(body).toContain('Proof-backed summary:');
    expect(body).toContain('Selected proof records:');
    expect(body).toContain('Email: jane@example.com');
  });

  it('logs text-pack failures with structured diagnostics', async () => {
    const routeError = new Error('export data failed');
    mockSupabaseUser({ id: 'user-1' });
    (fetchTrustExportData as any).mockRejectedValue(routeError);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to build text pack' });
    expect(log.error).toHaveBeenCalledWith('portfolio.text_pack.failed', {
      error: routeError,
    });
  });
});
