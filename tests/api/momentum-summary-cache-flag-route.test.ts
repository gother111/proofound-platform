import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/momentum/summary', () => ({
  getMomentumSummary: vi.fn(),
  getMomentumSummaryCached: vi.fn(),
}));

import { GET } from '@/app/api/momentum/summary/route';
import { requireApiAuthContext } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { getMomentumSummary, getMomentumSummaryCached } from '@/lib/momentum/summary';

function buildRequest() {
  return new NextRequest('http://localhost/api/momentum/summary?persona=organization&org=acme');
}

describe('GET /api/momentum/summary cache flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    });

    (getMomentumSummary as any).mockResolvedValue({ source: 'base' });
    (getMomentumSummaryCached as any).mockResolvedValue({ source: 'cached' });
  });

  it('bypasses cache when feature flag is disabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(false);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload).toEqual({ source: 'base' });
    expect(getMomentumSummary).toHaveBeenCalledWith('user-1', 'organization', 'acme');
    expect(getMomentumSummaryCached).not.toHaveBeenCalled();
  });

  it('uses cache when feature flag is enabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(true);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload).toEqual({ source: 'cached' });
    expect(getMomentumSummaryCached).toHaveBeenCalledWith('user-1', 'organization', 'acme');
    expect(getMomentumSummary).not.toHaveBeenCalled();
  });
});
