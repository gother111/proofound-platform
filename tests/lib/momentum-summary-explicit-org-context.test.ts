import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getMomentumSummaryForOrganization,
  getMomentumUpdatesForPersona,
} from '@/lib/momentum/summary';
import { getOrganizationActivityEvents } from '@/lib/momentum/activity';
import { resolveOrganizationId } from '@/lib/readiness/organization';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  organizationMembers: {
    userId: 'user_id',
    orgId: 'org_id',
    state: 'state',
  },
}));

vi.mock('@/lib/momentum/activity', () => ({
  getIndividualActivityEvents: vi.fn(),
  getOrganizationActivityEvents: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
}));

vi.mock('@/lib/readiness/individual', () => ({
  getIndividualReadiness: vi.fn(),
}));

vi.mock('@/lib/readiness/organization', () => ({
  getOrganizationReadiness: vi.fn(),
  resolveOrganizationId: vi.fn(),
}));

vi.mock('@/lib/performance/ttl-cache', () => ({
  getOrSetTtlCache: vi.fn((_key, loader) => loader()),
  PLATFORM_PERF_CACHE_TTL_MS: 1000,
}));

describe('organization momentum explicit org context', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not pick a latest active organization when summary org context is missing', async () => {
    const summary = await getMomentumSummaryForOrganization('user-1');

    expect(summary.summary).toContain('No explicit organization context');
    expect(resolveOrganizationId).not.toHaveBeenCalled();
  });

  it('does not return organization updates when org context is missing', async () => {
    const payload = await getMomentumUpdatesForPersona('user-1', 'organization', 5);

    expect(payload).toEqual({ persona: 'organization', updates: [] });
    expect(resolveOrganizationId).not.toHaveBeenCalled();
    expect(getOrganizationActivityEvents).not.toHaveBeenCalled();
  });
});
