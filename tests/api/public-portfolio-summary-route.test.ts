/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/export-data', () => ({
  fetchPublicTrustExportDataByHandle: vi.fn(),
}));

import { GET } from '@/app/api/portfolio/public/[handle]/summary/route';
import { createClient } from '@/lib/supabase/server';
import { fetchPublicTrustExportDataByHandle } from '@/lib/portfolio/export-data';

describe('/api/portfolio/public/[handle]/summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue({});
  });

  it('returns 404 when handle is unavailable', async () => {
    (fetchPublicTrustExportDataByHandle as any).mockResolvedValue(null);

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
    (fetchPublicTrustExportDataByHandle as any).mockResolvedValue({
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
        attestations: { count: 0 },
      },
      skills: [],
      proofPacks: [],
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

    const response = await GET(new Request('http://localhost/api/portfolio/public/jane/summary'), {
      params: Promise.resolve({ handle: 'jane' }),
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(body).toContain('Jane Doe');
    expect(body).toContain('Email: hidden');
    expect(body).not.toContain('secret@example.com');
  });
});
