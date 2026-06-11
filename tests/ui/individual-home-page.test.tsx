import React from 'react';
import { render, screen } from '@testing-library/react';
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

  it('keeps mobile readiness actions touch-friendly', async () => {
    render(await IndividualHomePage());

    expect(screen.getByRole('heading', { name: /welcome back, mock/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /start proof/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ className: expect.stringContaining('min-h-9') }),
      ])
    );
    expect(screen.getAllByRole('link', { name: /view request/i })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ className: expect.stringContaining('min-h-9') }),
      ])
    );
    expect(screen.getByRole('link', { name: /export or delete/i })).toHaveAttribute(
      'href',
      '/app/i/settings/privacy#privacy-delete'
    );
  });
});
