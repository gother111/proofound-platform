import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MatchingPage from '@/app/app/i/matching/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock('@/components/matching/IndividualMatchingEmpty', () => ({
  IndividualMatchingEmpty: ({ onSetup }: any) => <button onClick={onSetup}>Setup</button>,
}));

vi.mock('@/components/matching/MatchingProfileSetup', () => ({
  MatchingProfileSetup: () => <div>setup wizard</div>,
}));

vi.mock('@/components/matching/EnhancedMatchFilters', () => ({
  EnhancedMatchFilters: () => <div>filters</div>,
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: () => <div>match card</div>,
}));

vi.mock('@/components/matching/SnoozedMatchesList', () => ({
  SnoozedMatchesList: () => <div>snoozed</div>,
}));

vi.mock('@/components/matching/HiddenMatchesList', () => ({
  HiddenMatchesList: () => <div>hidden</div>,
}));

vi.mock('@/components/ui/skeleton', () => ({
  SkeletonCard: () => <div>skeleton</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('MatchingPage soft-gated state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders non-blocking checklist when eligibility is incomplete', async () => {
    const softGatedPayload = {
      message: 'Your profile is not matchable yet.',
      eligibility: {
        eligible: false,
        message: 'Complete these steps to improve match quality.',
        criteria: {
          skillsWithRecency: {
            id: 'skillsWithRecency',
            label: 'Skills with recency',
            met: false,
            detail: 'Add skills with last used dates.',
            current: 2,
            required: 10,
          },
          proofs: {
            id: 'proofs',
            label: 'Proof artifacts',
            met: false,
            detail: 'Add one proof.',
            current: 0,
            required: 1,
          },
          constraints: {
            id: 'constraints',
            label: 'Matching constraints',
            met: false,
            detail: 'Set work mode and availability.',
            current: false,
            required: 'work mode + availability + compensation',
          },
          purpose: {
            id: 'purpose',
            label: 'Purpose block',
            met: false,
            detail: 'Add mission or values.',
            current: false,
            required: 'mission OR values OR causes',
          },
        },
      },
      topActions: [
        {
          id: 'update-expertise-atlas',
          title: 'Update Expertise Atlas',
          description: 'Add skills and proofs.',
          actionUrl: '/app/i/expertise',
        },
      ],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: { id: 'user-1' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ topActions: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => softGatedPayload,
      });

    (global as any).fetch = fetchMock;

    render(<MatchingPage />);

    await waitFor(() => {
      expect(screen.getByText('Get match-ready in 4 quick steps')).toBeInTheDocument();
    });

    expect(screen.getByText('Skills with recency')).toBeInTheDocument();
    expect(screen.getAllByText('Update Expertise Atlas').length).toBeGreaterThan(0);
    expect(screen.queryByText('Profile setup required')).not.toBeInTheDocument();
  });
});
