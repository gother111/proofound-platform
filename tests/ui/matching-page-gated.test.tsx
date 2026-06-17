import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import MatchingPage from '@/app/app/i/matching/(workspace)/page';

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
  EnhancedMatchFilters: ({ onFiltersChange }: any) => (
    <button
      type="button"
      onClick={() => onFiltersChange({ skillDomains: [], locationMode: 'onsite' })}
    >
      Apply onsite filter
    </button>
  ),
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

  it('renders introduction readiness guidance when personalized matching is soft-gated', async () => {
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
          title: 'Strengthen Public Page proof',
          description: 'Refresh proof-backed work examples and verification checks.',
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
      expect(screen.getByText('Introductions need more proof')).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Browsing is open, but add a few recent skills and one preference to personalize results.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'You can keep browsing, but introductions unlock after the required proof, one accepted verification, and intro constraints are current.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Recent skills')).toBeInTheDocument();
    expect(screen.getByText('Strengthen Public Page proof')).toBeInTheDocument();
  });

  it('renders the empty matching corridor when browsing is eligible but no assignments are ready', async () => {
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
          json: async () => ({
            topActions: [
              {
                id: 'visual-match-preferences',
                title: 'Tune match preferences',
                description:
                  'Adjust work mode, availability, and compensation before sending interest.',
                actionUrl: '/app/i/matching/preferences',
              },
            ],
          }),
        };
      }

      if (url === '/api/match/profile' && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [], meta: { total: 0 } }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    (global as any).fetch = fetchMock;

    render(<MatchingPage />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'No assignment reviews yet' })
      ).toBeInTheDocument();
    });

    expect(screen.queryByRole('heading', { name: 'No matches yet' })).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Nothing needs your attention right now. Keep your proof and preferences current so new assignment reviews can land cleanly.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Tune match preferences')).toBeInTheDocument();
    expect(screen.queryByText('Introductions need more proof')).not.toBeInTheDocument();
  });

  it('keeps filtered-empty copy review-led instead of fit-led', async () => {
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

      if (url === '/api/match/profile' && init?.method === 'POST') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                id: 'match-1',
                assignmentId: 'assignment-1',
                assignment: {
                  role: 'Proof operations lead',
                  locationMode: 'remote',
                  workMode: 'contract',
                },
              },
            ],
          }),
        };
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    (global as any).fetch = fetchMock;

    render(<MatchingPage />);

    await waitFor(() => {
      expect(screen.getByText('match card')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Apply onsite filter' }));

    expect(
      await screen.findByText(
        'Your review filters are hiding the available assignment reviews. Clear one filter to see more proof-led reviews.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No assignment reviews fit the current filters')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Loosen one filter to widen the corridor.')).not.toBeInTheDocument();
  });
});
