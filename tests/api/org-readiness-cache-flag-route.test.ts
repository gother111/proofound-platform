import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/readiness/organization', () => ({
  resolveOrganizationId: vi.fn(),
  getOrganizationReadiness: vi.fn(),
  getOrganizationReadinessCached: vi.fn(),
}));

import { GET } from '@/app/api/org/readiness/route';
import { requireApiAuthContext } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { db } from '@/db';
import {
  getOrganizationReadiness,
  getOrganizationReadinessCached,
  resolveOrganizationId,
} from '@/lib/readiness/organization';

function buildRequest() {
  return new NextRequest('http://localhost/api/org/readiness?org=acme');
}

describe('GET /api/org/readiness cache flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    });

    (resolveOrganizationId as any).mockResolvedValue('org-1');

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ total: 1 }]),
      }),
    });

    (getOrganizationReadiness as any).mockResolvedValue({ source: 'base' });
    (getOrganizationReadinessCached as any).mockResolvedValue({ source: 'cached' });
  });

  it('bypasses cache when feature flag is disabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(false);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload).toEqual({ source: 'base' });
    expect(getOrganizationReadiness).toHaveBeenCalledWith('org-1');
    expect(getOrganizationReadinessCached).not.toHaveBeenCalled();
  });

  it('uses cache when feature flag is enabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(true);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload).toEqual({ source: 'cached' });
    expect(getOrganizationReadinessCached).toHaveBeenCalledWith('org-1');
    expect(getOrganizationReadiness).not.toHaveBeenCalled();
  });
});
