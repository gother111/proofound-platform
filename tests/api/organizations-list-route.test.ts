import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/organizations/route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

function mockOrganizationsResponse(
  rows: Array<{ id: string; display_name: string | null; slug: string }>,
  error: { message: string } | null = null
) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  const from = vi.fn().mockReturnValue({ select });

  vi.mocked(createClient).mockResolvedValue({ from } as any);
}

describe('GET /api/organizations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
