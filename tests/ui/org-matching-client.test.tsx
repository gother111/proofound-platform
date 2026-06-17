import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrgMatchingClient } from '@/app/app/o/[slug]/matching/OrgMatchingClient';

const pushMock = vi.fn();
const replaceMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ slug: 'acme' }),
  useRouter: () => ({
    push: pushMock,
    replace: replaceMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => toastErrorMock(...args),
  },
}));

vi.mock('@/components/matching/OrganizationMatchingEmpty', () => ({
  OrganizationMatchingEmpty: ({ onCreateAssignment }: { onCreateAssignment: () => void }) => (
    <button type="button" onClick={onCreateAssignment}>
      Empty assignment corridor
    </button>
  ),
}));

vi.mock('@/components/matching/MatchingOrganizationView', () => ({
  MatchingOrganizationView: ({ assignments }: { assignments: Array<{ role: string }> }) => (
    <div>Matching review workspace loaded for {assignments[0]?.role}</div>
  ),
}));

describe('OrgMatchingClient assignment loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/app/o/acme/assignments');
  });

  it('shows a proof-review loading state before assignments resolve', () => {
    (global as any).fetch = vi.fn(() => new Promise<never>(() => {}));

    render(<OrgMatchingClient />);

    expect(
      screen.getByRole('heading', { name: 'Preparing assignment review workspace' })
    ).toBeInTheDocument();
    expect(screen.getByText(/proof submissions, and review context/i)).toBeInTheDocument();
    expect(screen.getByText(/No shortlist, intro, or reveal action changes/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing assignment review workspace...'
    );
    expect(screen.queryByText('Loading assignments and matches...')).not.toBeInTheDocument();
  });

  it('shows a retryable load failure instead of the empty assignment state', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'assignment service unavailable' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            {
              id: 'assignment-1',
              orgId: 'org-1',
              role: 'Field operations lead',
              status: 'active',
              createdAt: '2026-06-11T10:00:00.000Z',
            },
          ],
        }),
      });

    (global as any).fetch = fetchMock;

    render(<OrgMatchingClient />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Assignments could not load');
    expect(
      screen.getByText(/Your assignments and review queue are still safe/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Empty assignment corridor')).not.toBeInTheDocument();
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Assignments could not load',
      expect.objectContaining({
        description: 'Retry the assignment corridor without leaving this page.',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /retry assignments/i }));

    expect(
      await screen.findByText('Matching review workspace loaded for Field operations lead')
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the real empty assignment state for successful empty responses', async () => {
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });

    render(<OrgMatchingClient />);

    expect(await screen.findByText('Empty assignment corridor')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Empty assignment corridor' }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/app/o/acme/assignments/new');
    });
  });
});
