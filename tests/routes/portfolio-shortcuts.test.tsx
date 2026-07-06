import { beforeEach, describe, expect, it, vi } from 'vitest';

const { redirectMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/profile/completion-flow.server', () => ({
  getIndividualProfileCompletionState: vi.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';
import IndividualPortfolioShortcutPage from '@/app/app/i/portfolio/page';
import OrgMatchingPage from '@/app/app/o/[slug]/matching/page';
import OrganizationPortfolioShortcutPage from '@/app/app/o/[slug]/portfolio/page';
import OrgShortlistPage from '@/app/app/o/[slug]/shortlist/page';
import LegacyAuthLoginPage from '@/app/auth/login/page';

describe('portfolio and compatibility shortcut routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects ready users to the profile visibility tab', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: 'strict-user' });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: true,
      portfolioLockCode: null,
      checks: { hasFirstProof: true },
    });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/app/i/profile?profileView=full&tab=visibility');
  });

  it('redirects locked users to the profile Proof Packs tab with the lock reason', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: 'strict-user' });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: false,
      portfolioLockCode: 'proof',
      checks: { hasFirstProof: false },
    });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith(
      '/app/i/profile?profileView=full&tab=proof_packs&portfolioLocked=1&lockReason=proof&proof=first'
    );
  });

  it('redirects organization shortcut to public org portfolio URL', async () => {
    await expect(
      OrganizationPortfolioShortcutPage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirectMock).toHaveBeenCalledWith(
      '/portfolio/org/acme?returnTo=%2Fapp%2Fo%2Facme%2Fhome'
    );
  });

  it('keeps reserved slug characters encoded inside organization shortcut redirects', async () => {
    await expect(
      OrganizationPortfolioShortcutPage({
        params: Promise.resolve({ slug: 'acme?next=../other' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirectMock).toHaveBeenCalledWith(
      '/portfolio/org/acme%3Fnext%3D..%2Fother?returnTo=%2Fapp%2Fo%2Facme%253Fnext%253D..%252Fother%2Fhome'
    );
  });

  it('keeps reserved slug characters encoded inside org assignment shortcut redirects', async () => {
    await expect(
      OrgShortlistPage({
        params: Promise.resolve({ slug: 'acme?next=../other' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenLastCalledWith(
      '/app/o/acme%3Fnext%3D..%2Fother/assignments?from=shortlist'
    );

    await expect(
      OrgMatchingPage({
        params: Promise.resolve({ slug: 'foo/bar' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenLastCalledWith('/app/o/foo%2Fbar/assignments');
  });

  it('redirects /auth/login compatibility route to /login', () => {
    expect(() => LegacyAuthLoginPage()).toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
