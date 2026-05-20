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

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    flow: 'export',
    requestId: 'trace-1',
    actorId: null,
    actorType: 'anonymous',
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

import { GET } from '@/app/api/portfolio/org/[slug]/export/route';
import { createClient } from '@/lib/supabase/server';
import { fetchOrganizationTrustExportData } from '@/lib/portfolio/export-data';
import { generateOrganizationProfilePdf } from '@/lib/portfolio/pdf';
import { emitLaunchTrace } from '@/lib/launch/trace';

function mockSupabase({
  user,
  organization = { id: 'org-1', slug: 'acme' },
  membership = { role: 'org_manager', state: 'active' },
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
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/org/acme',
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        verifiedDomainPath: 'acme.org',
        mission: 'Ship impact',
        whyWorkMatters: 'Build trust',
        operatingContext: 'Small distributed team with tight review loops.',
        website: 'https://acme.org',
        verified: true,
      },
      assignmentSnapshot: {
        role: 'Proof-first product designer',
        engagementType: 'full_time',
        businessValue: 'Own the assignment review loop.',
        description: 'Clarify the work and keep delivery aligned.',
        expectedImpact: 'Proof should show delivery and ownership.',
        outcomes: ['Reduce vague review decisions'],
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

  it('returns canonical JSON when format=json is requested', async () => {
    mockSupabase({ user: { id: 'user-1' } });
    (fetchOrganizationTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/org/acme',
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        verifiedDomainPath: 'acme.org',
        mission: 'Ship impact',
        whyWorkMatters: 'Build trust',
        operatingContext: 'Small distributed team with tight review loops.',
        website: 'https://acme.org',
        verified: true,
      },
      assignmentSnapshot: undefined,
    });

    const response = await GET(
      new Request('http://localhost/api/portfolio/org/acme/export?format=json'),
      {
        params: Promise.resolve({ slug: 'acme' }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toMatchObject({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      organization: { slug: 'acme' },
    });
    expect(generateOrganizationProfilePdf).not.toHaveBeenCalled();
  });

  it('returns text export when format=text is requested', async () => {
    mockSupabase({ user: { id: 'user-1' } });
    (fetchOrganizationTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/org/acme',
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        verifiedDomainPath: 'acme.org',
        mission: 'Ship impact',
        whyWorkMatters: 'Build trust',
        operatingContext: 'Small distributed team with tight review loops.',
        website: 'https://acme.org',
        verified: true,
      },
      assignmentSnapshot: {
        role: 'Proof-first product designer',
        engagementType: 'full_time',
        businessValue: 'Own the assignment review loop.',
        description: 'Clarify the work and keep delivery aligned.',
        expectedImpact: 'Proof should show delivery and ownership.',
        outcomes: ['Reduce vague review decisions'],
      },
    });

    const response = await GET(
      new Request('http://localhost/api/portfolio/org/acme/export?format=text'),
      {
        params: Promise.resolve({ slug: 'acme' }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toContain('Seriousness of review:');
    expect(generateOrganizationProfilePdf).not.toHaveBeenCalled();
  });

  it('returns a format-neutral error when text export generation fails', async () => {
    mockSupabase({ user: { id: 'user-1' } });
    (fetchOrganizationTrustExportData as any).mockResolvedValue({
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/org/acme',
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        verifiedDomainPath: 'acme.org',
        mission: 'Ship impact',
        whyWorkMatters: 'Build trust',
        operatingContext: 'Small distributed team with tight review loops.',
        website: 'https://acme.org',
        verified: true,
      },
      assignmentSnapshot: {
        role: 'Proof-first product designer',
      },
    });

    const response = await GET(
      new Request('http://localhost/api/portfolio/org/acme/export?format=text'),
      {
        params: Promise.resolve({ slug: 'acme' }),
      }
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to generate export' });
    expect(generateOrganizationProfilePdf).not.toHaveBeenCalled();
    expect(emitLaunchTrace).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: 'success',
        state: 'organization_export_ready',
      })
    );
    expect(emitLaunchTrace).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: 'failure',
        state: 'org_export_failed',
      })
    );
  });

  it('returns 403 for canonical reviewer membership', async () => {
    mockSupabase({
      user: { id: 'user-1' },
      membership: { role: 'org_reviewer', state: 'active' },
    });

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('returns 403 for inactive canonical owner membership', async () => {
    mockSupabase({
      user: { id: 'user-1' },
      membership: { role: 'org_owner', state: 'inactive' },
    });

    const response = await GET(new Request('http://localhost/api/portfolio/org/acme/export'), {
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });
});
