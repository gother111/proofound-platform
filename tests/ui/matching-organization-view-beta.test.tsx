import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingOrganizationView } from '@/components/matching/MatchingOrganizationView';

const apiFetchMock = vi.fn();
const pushMock = vi.fn();
let searchParamAssignment = '';

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'acme' }),
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => new URLSearchParams(searchParamAssignment),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: ({ result }: { result: any }) => (
    <div data-testid="match-card">{result?.id}</div>
  ),
}));

vi.mock('@/lib/ui/recovery-actions', () => ({
  getOrganizationRecoveryActions: () => [],
}));

describe('MatchingOrganizationView launch corridor', () => {
  const assignments = [
    {
      id: 'assignment-1',
      orgId: 'org-1',
      role: 'Designer',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    searchParamAssignment = '';
    window.localStorage.clear();
  });

  it('does not render the archived beta test initiation CTA', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(screen.getByText('Review focus')).toBeInTheDocument();
    expect(screen.getByText('Choose an assignment to review matches.')).toBeInTheDocument();
    expect(
      screen.getByText('Select an assignment to open its matching queue.')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /matching for designer/i }));

    await waitFor(() => {
      expect(screen.getByText(/no matches for designer yet/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /initiate test/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/mission-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/skills-first/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/balanced/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /weights & filters/i })).not.toBeInTheDocument();
  });

  it('stays on the assignment match API and never calls archived test-match endpoints', async () => {
    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/assignment') {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        };
      }

      throw new Error(`Unexpected url: ${url}`);
    });

    render(<MatchingOrganizationView assignments={assignments as any} onCreateNew={vi.fn()} />);

    expect(apiFetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /matching for designer/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/match/assignment',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    expect(apiFetchMock.mock.calls.some(([url]) => String(url).includes('/test-matches'))).toBe(
      false
    );
  });

  it('opens assignment-specific matching from the assignment card', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(
      <MatchingOrganizationView
        assignments={
          [
            ...assignments,
            {
              id: 'assignment-2',
              orgId: 'org-1',
              role: 'Research Lead',
              status: 'active',
              createdAt: new Date().toISOString(),
            },
          ] as any
        }
        onCreateNew={vi.fn()}
      />
    );

    expect(apiFetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /matching for research lead/i }));

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/match/assignment',
        expect.objectContaining({
          body: expect.stringContaining('"assignmentId":"assignment-2"'),
        })
      );
    });
    expect(pushMock).toHaveBeenCalledWith('/app/o/acme/assignments?matching=assignment-2');
    expect(screen.getByTestId('assignment-matching-grid')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View / Edit' })[1]).toHaveAttribute(
      'href',
      '/app/o/acme/assignments/assignment-2/review'
    );
  });

  it('shows a lightweight badge only for assignments with unseen matching activity', async () => {
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(
      <MatchingOrganizationView
        assignments={
          [
            {
              ...assignments[0],
              matchingSummary: {
                candidateCount: 2,
                reviewChangeCount: 0,
                lastCandidateAt: '2026-05-15T10:00:00.000Z',
                lastReviewChangeAt: null,
                lastActivityAt: '2026-05-15T10:00:00.000Z',
              },
            },
          ] as any
        }
        onCreateNew={vi.fn()}
      />
    );

    expect(screen.getByText('New candidates')).toBeInTheDocument();
    expect(screen.getAllByText('2 candidates').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /matching for designer/i }));

    await waitFor(() => {
      expect(screen.queryByText('New candidates')).not.toBeInTheDocument();
    });
  });
});
