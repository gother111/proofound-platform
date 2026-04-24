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
import OrganizationPortfolioShortcutPage from '@/app/app/o/[slug]/portfolio/page';
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

  it('redirects /auth/login compatibility route to /login', () => {
    expect(() => LegacyAuthLoginPage()).toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
