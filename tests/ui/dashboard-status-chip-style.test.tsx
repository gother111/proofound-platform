import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingReadinessCard } from '@/components/dashboard/MatchingReadinessCard';
import { ProfileActivationCard } from '@/components/dashboard/ProfileActivationCard';
import { DASHBOARD_STATUS_CHIP_CLASS } from '@/components/dashboard/chipStyles';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

function expectClassTokens(className: string, tokenString: string) {
  for (const token of tokenString.split(' ').filter(Boolean)) {
    expect(className).toContain(token);
  }
}

describe('Dashboard status badge styling', () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it('uses shared status chip classes in matching readiness header', () => {
    render(<MatchingReadinessCard useMockData />);

    const badge = screen.getByText('Actionable');
    expectClassTokens(badge.className, DASHBOARD_STATUS_CHIP_CLASS);
  });

  it('uses shared status chip classes when profile activation falls back to Not active', async () => {
    apiFetchMock
      .mockRejectedValueOnce(new Error('completeness failed'))
      .mockRejectedValueOnce(new Error('stats failed'));

    render(<ProfileActivationCard />);

    await waitFor(() => {
      expect(screen.getByText('Not active')).toBeInTheDocument();
    });

    const badge = screen.getByText('Not active');
    expectClassTokens(badge.className, DASHBOARD_STATUS_CHIP_CLASS);
  });
});
