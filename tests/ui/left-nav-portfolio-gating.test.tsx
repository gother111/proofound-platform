import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeftNav } from '@/components/app/LeftNav';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
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

  it('hides Public Portfolio navigation when gate is active', () => {
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
    expect(screen.queryByRole('link', { name: /public portfolio/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /public portfolio \(locked\)/i })
    ).not.toBeInTheDocument();
  });

  it('renders Public Portfolio as a normal link when gate is inactive', () => {
    render(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: false,
        }}
      />
    );

    const links = screen.getAllByRole('link', { name: /public portfolio/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', '/app/i/portfolio');
  });

  it('shows one-time toast when portfolio transitions from locked to unlocked', () => {
    const { rerender } = render(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: true,
          reason: 'Add 3 skills and one artifact.',
        }}
      />
    );

    rerender(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: false,
        }}
      />
    );

    expect(toastSuccessMock).toHaveBeenCalledWith(
      'Public Portfolio is now unlocked in your navigation.'
    );

    rerender(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: true,
        }}
      />
    );
    rerender(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: false,
        }}
      />
    );

    expect(toastSuccessMock).toHaveBeenCalledTimes(1);
  });

  it('shows Beta testing marker without archived expertise or zen links', () => {
    render(<LeftNav basePath="/app/i" isBetaTesting />);

    expect(screen.getByText(/beta testing/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /private check-ins/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /expertise/i })).not.toBeInTheDocument();
  });

  it('shows only the MVP org navigation corridor', () => {
    usePathnameMock.mockReturnValue('/app/o/acme/home');

    render(<LeftNav basePath="/app/o/acme" />);

    expect(screen.getAllByRole('link', { name: /overview/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
    expect(screen.getAllByRole('link', { name: /assignments & matches/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/matching'
    );
    expect(screen.getAllByRole('link', { name: /trust profile/i })[0]).toHaveAttribute(
      'href',
      '/app/o/acme/profile'
    );
    expect(screen.queryByRole('link', { name: /candidates/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /shortlist/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /team/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^settings$/i })).not.toBeInTheDocument();
  });
});
