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

describe('MatchingPage soft-gated state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders browse-readiness guidance when personalized browse is soft-gated', async () => {
    const blockedPayload = {
      items: [],
      meta: {
        softGated: true,
        message:
          'Browsing is open, but add a few recent skills and one preference to personalize results.',
      },
      eligibility: {
        criteria: {
          skillsWithRecency: {
            id: 'skillsWithRecency',
            label: 'Recent skills',
            met: false,
            detail: 'Add skills with last used dates.',
            current: 2,
            required: 3,
          },
        },
      },
      topActions: [
        {
          id: 'update-public-portfolio',
          title: 'Strengthen public portfolio',
          description: 'Refresh proof-backed work examples and trust signals.',
          actionUrl: '/app/i/profile?profileView=full&tab=proof_packs',
        },
      ],
    };

    const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.startsWith('/api/csrf-token')) {
        return {
          ok: true,
          json: async () => ({ token: 'csrf-token' }),
        };
      }

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
      expect(screen.getByText('Browse readiness')).toBeInTheDocument();
    });

    expect(screen.getByText('Recent skills')).toBeInTheDocument();
    expect(screen.getByText('Strengthen public portfolio')).toBeInTheDocument();
  });
});
