import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import IndividualHomePage from '@/app/app/i/home/page';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({
    id: 'user-1',
    displayName: 'Mock Individual',
    handle: 'mock-individual',
  })),
}));

vi.mock('@/lib/dashboard/metrics', () => ({
  getDashboardMetrics: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { getDashboardMetrics } from '@/lib/dashboard/metrics';

describe('IndividualHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDashboardMetrics).mockResolvedValue({
      proofStoriesCount: 0,
      verifiedSkills: 0,
      pendingVerifications: 1,
      qualifiedMatches: 0,
      activeIntroductions: 0,
    });
  });

  it('keeps readiness actions touch-friendly across breakpoints', async () => {
    render(await IndividualHomePage());

    expect(screen.getByRole('heading', { name: /welcome back, mock/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Manage visibility, export, and assignment-review access/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/privacy-safe proof summaries/i)).toBeInTheDocument();
    expect(screen.queryByText(/matching corridor/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/blind profiles/i)).not.toBeInTheDocument();

    for (const readinessAction of [
      ...screen.getAllByRole('link', { name: /start proof/i }),
      ...screen.getAllByRole('link', { name: /view request/i }),
    ]) {
      expect(readinessAction.className).toMatch(/min-h-(11|\[44px\])/);
    }

    const firstMobileActionRow = screen.getByTestId('readiness-mobile-action-row-0');
    const firstProofDetail = screen.getByText(/start with one useful artifact/i);

    expect(firstMobileActionRow).toHaveClass('sm:hidden');
    expect(within(firstMobileActionRow).getByRole('link', { name: /start proof/i })).toBeVisible();
    expect(firstMobileActionRow.compareDocumentPosition(firstProofDetail)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    expect(screen.getByRole('link', { name: /export or delete/i })).toHaveAttribute(
      'href',
      '/app/i/settings/privacy#privacy-delete'
    );
  });
});
