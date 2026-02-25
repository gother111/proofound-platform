import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeftNav } from '@/components/app/LeftNav';

const usePathnameMock = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
}));

describe('LeftNav portfolio gating', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue('/app/i/home');
  });

  it('renders Public Portfolio as locked when gate is active', () => {
    render(
      <LeftNav
        basePath="/app/i"
        individualPortfolioGate={{
          locked: true,
          reason: 'Add 3 skills and one artifact.',
        }}
      />
    );

    const lockedButtons = screen.getAllByRole('button', {
      name: /public portfolio \(locked\)/i,
    });
    expect(lockedButtons.length).toBeGreaterThan(0);
    expect(lockedButtons[0]).toHaveAttribute('aria-disabled', 'true');
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
});
