import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
  getActiveOrg: vi.fn(),
}));

vi.mock('@/components/organization/OrgCandidatesWorkspace', () => ({
  OrgCandidatesWorkspace: ({ orgId }: { orgId: string }) => (
    <div data-testid="org-candidates-workspace">{orgId}</div>
  ),
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

  it('mounts the private candidates workspace for active organization members', async () => {
    const element = await OrgCandidatesPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(requireAuth).toHaveBeenCalledTimes(1);
    expect(getActiveOrg).toHaveBeenCalledWith('acme', 'user-1');
    expect(screen.getByTestId('org-candidates-workspace')).toHaveTextContent('org-1');
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
