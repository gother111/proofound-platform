/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/export-data', () => ({
  fetchPublicTrustExportDataByHandle: vi.fn(),
}));

vi.mock('@/lib/portfolio/pdf', () => ({
  generateTrustPdf: vi.fn(),
}));

import { GET } from '@/app/api/portfolio/public/[handle]/export/route';
import { createClient } from '@/lib/supabase/server';
import { fetchPublicTrustExportDataByHandle } from '@/lib/portfolio/export-data';
import { generateTrustPdf } from '@/lib/portfolio/pdf';

describe('/api/portfolio/public/[handle]/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue({});
  });

  it('returns 404 when profile data cannot be loaded', async () => {
    (fetchPublicTrustExportDataByHandle as any).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/portfolio/public/jane/export'), {
      params: Promise.resolve({ handle: 'jane' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Profile not found' });
  });

  it('returns a non-empty PDF response when public data exists', async () => {
    (fetchPublicTrustExportDataByHandle as any).mockResolvedValue({
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
        attestations: { count: 0 },
      },
      skills: [{ id: 'skill-1', name: 'Product Strategy', level: 4 }],
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
    });
    (generateTrustPdf as any).mockResolvedValue(Buffer.from('%PDF-1.4 public-profile'));

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
        visibility: expect.objectContaining({
          contact: false,
          workEmail: false,
        }),
      })
    );
  });
});
