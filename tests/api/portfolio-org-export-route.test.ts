/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/export-data', () => ({
  fetchOrganizationTrustExportData: vi.fn(),
}));

vi.mock('@/lib/portfolio/pdf', () => ({
  generateOrganizationProfilePdf: vi.fn(),
}));

import { GET } from '@/app/api/portfolio/org/[slug]/export/route';
import { createClient } from '@/lib/supabase/server';
import { fetchOrganizationTrustExportData } from '@/lib/portfolio/export-data';
import { generateOrganizationProfilePdf } from '@/lib/portfolio/pdf';

function mockSupabase({
  user,
  organization = { id: 'org-1', slug: 'acme' },
  membership = { role: 'admin', state: 'active' },
}: {
  user: { id: string } | null;
  organization?: { id: string; slug: string } | null;
  membership?: { role: string; state?: string } | null;
}) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'organizations') {
        const maybeSingle = vi.fn().mockResolvedValue({ data: organization });
        const eqSlug = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq: eqSlug });
        return { select };
      }

      if (table === 'organization_members') {
        const maybeSingle = vi.fn().mockResolvedValue({ data: membership });
        const eqUser = vi.fn().mockReturnValue({ maybeSingle });
        const eqOrg = vi.fn().mockReturnValue({ eq: eqUser });
        const select = vi.fn().mockReturnValue({ eq: eqOrg });
        return { select };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  });
}

describe('/api/portfolio/org/[slug]/export', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when unauthenticated', async () => {
    mockSupabase({ user: null });

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('returns 404 when organization is missing', async () => {
    mockSupabase({ user: { id: 'user-1' }, organization: null });

    const response = await GET(new Request('http://localhost/api/portfolio/org/missing/export'), {
      params: Promise.resolve({ slug: 'missing' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Organization not found' });
  });

  it('returns 403 when user is not an active org member', async () => {
    mockSupabase({ user: { id: 'user-1' }, membership: null });

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('returns 404 when organization export data is unavailable', async () => {
    mockSupabase({ user: { id: 'user-1' } });
    (fetchOrganizationTrustExportData as any).mockResolvedValue(null);

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Organization profile unavailable' });
  });

  it('returns a downloadable PDF on success', async () => {
    mockSupabase({ user: { id: 'user-1' } });
    (fetchOrganizationTrustExportData as any).mockResolvedValue({
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        tagline: 'Build trust',
        mission: 'Ship impact',
        website: 'https://acme.org',
        type: 'company',
        verified: true,
        values: ['Transparency'],
        causes: ['Climate'],
      },
      metrics: {
        activeAssignments: 4,
        teamMembers: 8,
      },
    });
    (generateOrganizationProfilePdf as any).mockResolvedValue(Buffer.from('%PDF-1.4 org-pdf'));

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('content-disposition')).toContain('proofound-org-acme.pdf');
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('returns 403 for viewer membership', async () => {
    mockSupabase({ user: { id: 'user-1' }, membership: { role: 'viewer', state: 'active' } });

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('returns 403 for member membership', async () => {
    mockSupabase({ user: { id: 'user-1' }, membership: { role: 'member', state: 'active' } });

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });
});
