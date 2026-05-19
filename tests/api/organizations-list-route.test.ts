import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { GET } from '@/app/api/organizations/route';
import { requireApiAuth } from '@/lib/api/auth';

vi.mock('@/lib/api/auth', () => ({
  requireApiAuth: vi.fn(),
}));

function mockOrganizationsResponse(
  rows: Array<{ id: string; display_name: string | null; slug: string }>,
  error: { message: string } | null = null
) {
  const limit = vi.fn().mockResolvedValue({
    data: rows.map((org) => ({ org })),
    error,
  });
  const eqState = vi.fn().mockReturnValue({ limit });
  const eqUser = vi.fn().mockReturnValue({ eq: eqState });
  const select = vi.fn().mockReturnValue({ eq: eqUser });
  const from = vi.fn().mockReturnValue({ select });

  vi.mocked(requireApiAuth).mockResolvedValue({
    user: { id: 'user-1' },
    supabase: { from },
  } as any);
}

describe('GET /api/organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when caller is unauthenticated', async () => {
    vi.mocked(requireApiAuth).mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) as any
    );

    const response = await GET(new NextRequest('http://localhost/api/organizations'));

    expect(response.status).toBe(401);
  });

  it('returns normalized camelCase displayName while keeping display_name compatibility', async () => {
    mockOrganizationsResponse([{ id: 'org-1', display_name: 'Acme Impact', slug: 'acme-impact' }]);

    const response = await GET(new NextRequest('http://localhost/api/organizations'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.organizations).toEqual([
      {
        id: 'org-1',
        slug: 'acme-impact',
        displayName: 'Acme Impact',
        display_name: 'Acme Impact',
      },
    ]);
  });

  it('returns null display fields when source display_name is null', async () => {
    mockOrganizationsResponse([{ id: 'org-2', display_name: null, slug: 'unnamed-org' }]);

    const response = await GET(new NextRequest('http://localhost/api/organizations'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.organizations).toEqual([
      {
        id: 'org-2',
        slug: 'unnamed-org',
        displayName: null,
        display_name: null,
      },
    ]);
  });

  it('sorts active member organizations without exposing a global organization directory', async () => {
    mockOrganizationsResponse([
      { id: 'org-b', display_name: 'Zebra Works', slug: 'zebra-works' },
      { id: 'org-a', display_name: 'Acme Impact', slug: 'acme-impact' },
    ]);

    const response = await GET(new NextRequest('http://localhost/api/organizations'));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.organizations.map((org: { id: string }) => org.id)).toEqual(['org-a', 'org-b']);
  });
});
