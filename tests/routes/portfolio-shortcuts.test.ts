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

import { requireAuth } from '@/lib/auth';
import IndividualPortfolioShortcutPage from '@/app/app/i/portfolio/page';
import OrganizationPortfolioShortcutPage from '@/app/app/o/[slug]/portfolio/page';
import LegacyAuthLoginPage from '@/app/auth/login/page';
import LegacyTeamCoveragePage from '@/app/app/o/[slug]/team/coverage/page';

describe('portfolio and compatibility shortcut routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects individual shortcut to public portfolio URL', async () => {
    (requireAuth as any).mockResolvedValue({ handle: 'strict-user' });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/portfolio/strict-user');
  });

  it('redirects individual shortcut to profile when handle is missing', async () => {
    (requireAuth as any).mockResolvedValue({ handle: null });

    await expect(IndividualPortfolioShortcutPage()).rejects.toThrow('NEXT_REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/app/i/profile');
  });

  it('redirects organization shortcut to public org portfolio URL', async () => {
    await expect(
      OrganizationPortfolioShortcutPage({
        params: Promise.resolve({ slug: 'acme' }),
      })
    ).rejects.toThrow('NEXT_REDIRECT');

    expect(redirectMock).toHaveBeenCalledWith('/portfolio/org/acme');
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
