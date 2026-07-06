import { beforeEach, describe, expect, it, vi } from 'vitest';

const { notFoundMock, redirectMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getActiveOrg: vi.fn(),
}));

import OrgCandidatesPage from '@/app/app/o/[slug]/candidates/page';
import { getActiveOrg, requireAuth } from '@/lib/auth';

describe('organization candidates page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
    (getActiveOrg as any).mockResolvedValue({
      org: {
        id: 'org-1',
        slug: 'acme',
      },
      membership: {
        role: 'org_manager',
      },
    });
  });

  it('keeps the private candidates alias gated and redirects active organization members', async () => {
    await expect(
      OrgCandidatesPage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(getActiveOrg).toHaveBeenCalledWith('acme', 'user-1');
    expect(redirectMock).toHaveBeenCalledWith('/app/o/acme/assignments');
  });

  it('returns not found when the signed-in user is not a member of the organization', async () => {
    (getActiveOrg as any).mockResolvedValueOnce(null);

    await expect(
      OrgCandidatesPage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
