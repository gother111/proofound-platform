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

vi.mock('@/lib/readiness/individual', () => ({
  getIndividualReadiness: vi.fn(),
}));

vi.mock('@/app/app/i/portfolio/PortfolioWorkspaceClient', () => ({
  PortfolioWorkspaceClient: ({ completionState, readiness }: any) => (
    <div data-testid="portfolio-workspace-client">
      <span>{completionState.portfolioLockCode ?? 'no-lock'}</span>
      <span>{readiness.flags.portfolioReady ? 'portfolio-ready' : 'portfolio-in-progress'}</span>
    </div>
  ),
}));

import { requireAuth } from '@/lib/auth';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';
import { getIndividualReadiness } from '@/lib/readiness/individual';
import IndividualPortfolioShortcutPage from '@/app/app/i/portfolio/page';
import OrganizationPortfolioShortcutPage from '@/app/app/o/[slug]/portfolio/page';
import LegacyAuthLoginPage from '@/app/auth/login/page';
import LegacyTeamCoveragePage from '@/app/app/o/[slug]/team/coverage/page';
import { render, screen } from '@testing-library/react';
import React from 'react';

describe('portfolio and compatibility shortcut routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the individual portfolio workspace when the profile is ready', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: 'strict-user' });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: true,
      portfolioLockCode: null,
    });
    (getIndividualReadiness as any).mockResolvedValue({
      flags: { portfolioReady: true },
    });

    const page = await IndividualPortfolioShortcutPage();
    render(page);

    expect(screen.getByTestId('portfolio-workspace-client')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('keeps locked users inside the individual portfolio workspace', async () => {
    (requireAuth as any).mockResolvedValue({ id: 'user-1', handle: 'strict-user' });
    (getIndividualProfileCompletionState as any).mockResolvedValue({
      isPortfolioReady: false,
      portfolioLockCode: 'proof',
    });
    (getIndividualReadiness as any).mockResolvedValue({
      flags: { portfolioReady: false },
    });

    const page = await IndividualPortfolioShortcutPage();
    render(page);

    expect(screen.getByTestId('portfolio-workspace-client')).toBeInTheDocument();
    expect(screen.getByText('proof')).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
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
