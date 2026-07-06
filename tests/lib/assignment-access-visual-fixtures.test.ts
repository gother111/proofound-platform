import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const organizationFindFirstMock = vi.fn();
const organizationMemberFindFirstMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    query: {
      organizations: {
        findFirst: (...args: unknown[]) => organizationFindFirstMock(...args),
      },
      organizationMembers: {
        findFirst: (...args: unknown[]) => organizationMemberFindFirstMock(...args),
      },
    },
  },
}));

import { resolveExplicitUserOrgContext } from '@/lib/assignments/access';

describe('assignment access visual fixture gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
    delete process.env.PROOFOUND_VISUAL_FIXTURES;
    delete process.env.VERCEL_ENV;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
    delete process.env.PROOFOUND_VISUAL_FIXTURES;
    delete process.env.VERCEL_ENV;
  });

  it('does not grant the fixed mock organization in plain mock Supabase mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    organizationFindFirstMock.mockResolvedValue({ id: '99999999-9999-4999-9999-999999999999' });
    organizationMemberFindFirstMock.mockResolvedValue(null);

    const orgId = await resolveExplicitUserOrgContext(
      '88888888-8888-4888-8888-888888888888',
      { orgSlug: 'test-org' },
      ['org_manager']
    );

    expect(orgId).toBeNull();
    expect(organizationFindFirstMock).toHaveBeenCalledTimes(1);
    expect(organizationMemberFindFirstMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the fixed mock organization available for explicit visual fixture mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    process.env.PROOFOUND_VISUAL_FIXTURES = 'true';

    const orgId = await resolveExplicitUserOrgContext(
      '88888888-8888-4888-8888-888888888888',
      { orgSlug: 'test-org' },
      ['org_manager']
    );

    expect(orgId).toBe('99999999-9999-4999-9999-999999999999');
    expect(organizationFindFirstMock).not.toHaveBeenCalled();
    expect(organizationMemberFindFirstMock).not.toHaveBeenCalled();
  });

  it('does not grant the fixed mock organization in production visual fixture mode', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    process.env.PROOFOUND_VISUAL_FIXTURES = 'true';
    process.env.VERCEL_ENV = 'production';
    organizationFindFirstMock.mockResolvedValue({ id: '99999999-9999-4999-9999-999999999999' });
    organizationMemberFindFirstMock.mockResolvedValue(null);

    const orgId = await resolveExplicitUserOrgContext(
      '88888888-8888-4888-8888-888888888888',
      { orgSlug: 'test-org' },
      ['org_manager']
    );

    expect(orgId).toBeNull();
    expect(organizationFindFirstMock).toHaveBeenCalledTimes(1);
    expect(organizationMemberFindFirstMock).toHaveBeenCalledTimes(1);
  });
});
