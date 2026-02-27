import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/momentum/summary', () => ({
  getMomentumUpdatesForPersona: vi.fn(),
  getMomentumUpdatesForPersonaCached: vi.fn(),
}));

import { GET } from '@/app/api/updates/route';
import { requireApiAuthContext } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import {
  getMomentumUpdatesForPersona,
  getMomentumUpdatesForPersonaCached,
} from '@/lib/momentum/summary';

function buildRequest() {
  return new NextRequest('http://localhost/api/updates?persona=organization&org=acme&limit=5');
}

describe('GET /api/updates cache flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    });

    (getMomentumUpdatesForPersona as any).mockResolvedValue({
      persona: 'organization',
      updates: [{ id: 'u1', type: 'new_match' }],
    });

    (getMomentumUpdatesForPersonaCached as any).mockResolvedValue({
      persona: 'organization',
      updates: [{ id: 'u2', type: 'new_match' }],
    });
  });

  it('bypasses cache when feature flag is disabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(false);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.updates).toEqual([{ id: 'u1', type: 'new_match' }]);
    expect(payload.persona).toBe('organization');
    expect(getMomentumUpdatesForPersona).toHaveBeenCalledWith('user-1', 'organization', 5, 'acme');
    expect(getMomentumUpdatesForPersonaCached).not.toHaveBeenCalled();
  });

  it('uses cache when feature flag is enabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(true);

    const response = await GET(buildRequest());
    const payload = await response.json();

    expect(payload.updates).toEqual([{ id: 'u2', type: 'new_match' }]);
    expect(payload.persona).toBe('organization');
    expect(getMomentumUpdatesForPersonaCached).toHaveBeenCalledWith(
      'user-1',
      'organization',
      5,
      'acme'
    );
    expect(getMomentumUpdatesForPersona).not.toHaveBeenCalled();
  });
});
