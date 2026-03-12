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
import LegacyTeamCoveragePage from '@/app/app/o/[slug]/team/coverage/page';

describe('portfolio and compatibility shortcut routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects individual shortcut to public portfolio URL', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: 'strict-user' });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: true,
      portfolioLockCode: null,
    });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/portfolio/strict-user?returnTo=%2Fapp%2Fi%2Fhome');
  });

  it('redirects individual shortcut to profile when portfolio is locked', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: 'strict-user' });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: false,
      portfolioLockCode: 'proof',
    });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/app/i/profile?portfolioLocked=1&lockReason=proof');
  });

  it('redirects individual shortcut to profile when handle is missing', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: null });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: true,
      portfolioLockCode: null,
    });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/app/i/profile');
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

  it('redirects legacy team coverage route to team workspace', async () => {
    await expect(
      LegacyTeamCoveragePage({
        params: Promise.resolve({ slug: 'demo-org' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirectMock).toHaveBeenCalledWith('/app/o/demo-org/team');
  });
});
