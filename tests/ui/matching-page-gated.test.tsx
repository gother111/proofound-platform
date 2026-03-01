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

vi.mock('@/components/ui/skeleton', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/skeleton')>();
  return {
    ...actual,
    SkeletonCard: () => <div>skeleton</div>,
  };
});

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('MatchingPage blocked state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dedicated blocked card for profile-not-matchable payload', async () => {
    const blockedPayload = {
      error: 'PROFILE_NOT_MATCHABLE',
      message: 'Your profile is not matchable yet.',
      eligibility: {
        criteria: {
          skillsWithRecency: {
            id: 'skillsWithRecency',
            label: 'Skills with recency',
            met: false,
            detail: 'Add skills with last used dates.',
            current: 2,
            required: 10,
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

    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url === '/api/matching-profile') {
        return {
          ok: true,
          json: async () => ({ profile: { id: 'user-1' } }),
        };
      }

      if (url === '/api/individual/readiness') {
        return {
          ok: true,
          json: async () => ({ topActions: [] }),
        };
      }

      if (url === '/api/match/test') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      if (url === '/api/match/profile' && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => blockedPayload,
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    (global as any).fetch = fetchMock;

    render(<MatchingPage />);

    await waitFor(() => {
      expect(screen.getByText('Profile setup required')).toBeInTheDocument();
    });

    expect(screen.getByText('Skills with recency')).toBeInTheDocument();
    expect(screen.getByText('Update Expertise Atlas')).toBeInTheDocument();
  });
});
