import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeftNav } from '@/components/app/LeftNav';
import { TopBarProfileMenu } from '@/components/app/TopBarProfileMenu';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

vi.mock('@/actions/auth', () => ({
  signOut: '/auth/logout',
}));

const toastSuccessMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: any[]) => toastSuccessMock(...args),
  },
}));

describe('LeftNav portfolio gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue('/app/i/home');
    window.sessionStorage.clear();
  });

  it('keeps the individual nav focused on profile-owned portfolio IA', () => {
    render(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: true,
          reason: 'Add 3 skills and one artifact.',
        }}
      />
    );

    expect(screen.getAllByRole('link', { name: /overview/i })[0]).toHaveAttribute(
      'href',
      '/app/i/home'
    );
    expect(screen.getAllByRole('link', { name: /profile/i })[0]).toHaveAttribute(
      'href',
      '/app/i/profile'
    );
    expect(screen.getAllByRole('link', { name: /communications/i })[0]).toHaveAttribute(
      'href',
      '/app/i/communications'
    );
    expect(screen.getAllByRole('link', { name: /matching/i })[0]).toHaveAttribute(
      'href',
      '/app/i/matching'
    );
    expect(screen.getAllByRole('link', { name: /^settings$/i })[0]).toHaveAttribute(
      'href',
      '/app/i/settings'
    );
    expect(screen.queryByRole('link', { name: /public portfolio/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /public portfolio \(locked\)/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^messages$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^interviews$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^verifications$/i })).not.toBeInTheDocument();
  });

  it('does not re-add Public Portfolio when the gate is inactive', () => {
    render(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: false,
        }}
      />
    );

    expect(screen.queryByRole('link', { name: /public portfolio/i })).not.toBeInTheDocument();
    expect(toastSuccessMock).not.toHaveBeenCalled();
  });

  it('shows Beta testing marker without archived expertise or zen links', () => {
    render(<LeftNav basePath="/app/i" isBetaTesting />);

    expect(screen.getByText(/beta testing/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /private check-ins/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /expertise/i })).not.toBeInTheDocument();
  });

  it('keeps individual settings discoverable from the account menu', () => {
    render(<TopBarProfileMenu userName="Yurii" basePath="/app/i" onClose={vi.fn()} />);

    expect(screen.getByRole('menuitem', { name: /account settings/i })).toHaveAttribute(
      'href',
      '/app/i/settings'
    );
    expect(screen.getByRole('menuitem', { name: /privacy controls/i })).toHaveAttribute(
      'href',
      '/app/i/settings/privacy'
    );
    expect(screen.getByRole('menuitem', { name: /export or delete data/i })).toHaveAttribute(
      'href',
      '/app/i/settings?tab=privacy'
    );
    expect(screen.getByRole('menuitem', { name: /audit log/i })).toHaveAttribute(
      'href',
      '/app/i/settings/audit-log'
    );
  });

  it('keeps org account menu inside the organization profile corridor', () => {
    render(<TopBarProfileMenu userName="Acme" basePath="/app/o/acme" onClose={vi.fn()} />);

    expect(screen.getByRole('menuitem', { name: /organization profile/i })).toHaveAttribute(
      'href',
      '/app/o/acme/profile'
    );
    expect(screen.getByRole('menuitem', { name: /public preview/i })).toHaveAttribute(
      'href',
      '/app/o/acme/portfolio'
    );
    expect(screen.queryByRole('menuitem', { name: /^settings$/i })).not.toBeInTheDocument();
  });

  it('shows only the MVP org navigation corridor', () => {
    usePathnameMock.mockReturnValue('/app/o/acme/home');

    render(<LeftNav basePath="/app/o/acme" />);

    expect(screen.getAllByRole('link', { name: /overview/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
    expect(screen.getAllByRole('link', { name: /^assignments$/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/assignments'
    );
    expect(screen.getAllByRole('link', { name: /communications/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/communications'
    );
    expect(screen.getAllByRole('link', { name: /organization profile/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/profile'
    );
    expect(screen.getAllByRole('link', { name: /public preview/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/portfolio'
    );
    expect(screen.queryByRole('link', { name: /candidates/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /shortlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /team/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^settings$/i })).not.toBeInTheDocument();
  });
});
