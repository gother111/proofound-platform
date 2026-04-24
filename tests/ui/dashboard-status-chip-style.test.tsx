import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InterviewsFeedbackCard } from '@/components/dashboard/InterviewsFeedbackCard';
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

    const badge = screen.getByText('Portfolio ready');
    expectClassTokens(badge.className, DASHBOARD_STATUS_CHIP_CLASS);
    expect(badge.className).toContain('whitespace-nowrap');
    expect(badge.className).toContain('shrink-0');
  });

  it('uses shared status chip classes when portfolio status falls back to the first launch state', async () => {
    apiFetchMock
      .mockRejectedValueOnce(new Error('completeness failed'))
      .mockRejectedValueOnce(new Error('stats failed'));

    render(<ProfileActivationCard />);

    await waitFor(() => {
      expect(
        screen.getAllByText('Portfolio ready').some((node) => node.className.includes('shrink-0'))
      ).toBe(true);
    });

    const badge = screen
      .getAllByText('Portfolio ready')
      .find((node) => node.className.includes('shrink-0'));
    expect(badge).toBeDefined();
    expectClassTokens(badge.className, DASHBOARD_STATUS_CHIP_CLASS);
    expect(badge.className).toContain('whitespace-nowrap');
    expect(badge.className).toContain('shrink-0');
  });

  it('uses shared status chip classes for interviews feedback status badge', () => {
    render(
      <InterviewsFeedbackCard initialData={{ interviews: [{ id: '1', status: 'scheduled' }] }} />
    );

    const badge = screen
      .getAllByText('On track')
      .find((node) => node.className.includes('shrink-0'));
    expect(badge).toBeDefined();
    expectClassTokens(badge!.className, DASHBOARD_STATUS_CHIP_CLASS);
    expect(badge!.className).toContain('whitespace-nowrap');
    expect(badge!.className).toContain('shrink-0');
  });
});
