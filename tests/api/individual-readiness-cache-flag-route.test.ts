import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  logError: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/feature-flags/server', () => ({
  isFeatureEnabled: vi.fn(),
}));

vi.mock('@/lib/readiness/individual', () => ({
  getIndividualReadiness: vi.fn(),
  getIndividualReadinessCached: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/individual/readiness/route';
import { requireApiAuthContext } from '@/lib/auth';
import { isFeatureEnabled } from '@/lib/feature-flags/server';
import { getIndividualReadiness, getIndividualReadinessCached } from '@/lib/readiness/individual';

describe('GET /api/individual/readiness cache flag', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    });
    (getIndividualReadiness as any).mockResolvedValue({ source: 'base' });
    (getIndividualReadinessCached as any).mockResolvedValue({ source: 'cached' });
  });

  it('bypasses cache when feature flag is disabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(false);

    const response = await GET();
    const payload = await response.json();

    expect(payload).toEqual({ source: 'base' });
    expect(getIndividualReadiness).toHaveBeenCalledWith('user-1');
    expect(getIndividualReadinessCached).not.toHaveBeenCalled();
  });

  it('uses cache when feature flag is enabled', async () => {
    (isFeatureEnabled as any).mockResolvedValue(true);

    const response = await GET();
    const payload = await response.json();

    expect(payload).toEqual({ source: 'cached' });
    expect(getIndividualReadinessCached).toHaveBeenCalledWith('user-1');
    expect(getIndividualReadiness).not.toHaveBeenCalled();
  });

  it('does not expose backend errors when readiness generation fails', async () => {
    (isFeatureEnabled as any).mockResolvedValue(false);
    (getIndividualReadiness as any).mockRejectedValue(
      new Error('relation "individual_profiles" does not exist for verifier@example.com')
    );

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({
      error: 'Failed to build individual readiness',
    });
    expect(JSON.stringify(payload)).not.toContain('individual_profiles');
    expect(JSON.stringify(payload)).not.toContain('verifier@example.com');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('individual_profiles');
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain('verifier@example.com');
  });
});
