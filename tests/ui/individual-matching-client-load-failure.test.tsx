import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingClient } from '@/app/app/i/matching/MatchingClient';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { toast } from 'sonner';

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@/components/matching/MatchingProfileSetup', () => ({
  MatchingProfileSetup: () => <div>Matching profile setup ready</div>,
}));

vi.mock('@/components/matching/IndividualMatchingEmpty', () => ({
  IndividualMatchingEmpty: () => <div>Individual matching empty</div>,
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: ({ result }: { result: { id: string } }) => (
    <div data-testid="match-card">{result.id}</div>
  ),
}));

vi.mock('@/components/matching/EnhancedMatchFilters', () => ({
  EnhancedMatchFilters: () => <div>Filters ready</div>,
}));

vi.mock('@/components/matching/SnoozedMatchesList', () => ({
  SnoozedMatchesList: () => <div>Paused matches ready</div>,
}));

vi.mock('@/components/matching/HiddenMatchesList', () => ({
  HiddenMatchesList: () => <div>Hidden matches ready</div>,
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);
const toastErrorMock = vi.mocked(toast.error);

describe('individual matching load failure recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/app/i/matching');
  });

  it('keeps raw matching load failures out of the UI and retry path', async () => {
    let profileRequests = 0;
    const rawFailure = {
      message: 'database password leaked in provider error',
      requestId: 'provider-secret-123',
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url === '/api/individual/readiness') {
          return {
            ok: true,
            json: async () => ({ topActions: [] }),
          } as Response;
        }

        if (url === '/api/matching-profile') {
          profileRequests += 1;
          if (profileRequests === 1) {
            return {
              ok: false,
              json: async () => rawFailure,
            } as Response;
          }

          return {
            ok: true,
            json: async () => ({ profile: null }),
          } as Response;
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );

    render(<MatchingClient />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Assignment reviews need another moment');
    expect(alert).toHaveTextContent('Your profile, proof records, and paused or hidden choices');
    expect(screen.queryByText(/database password leaked/i)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'matching.client.profile_load_failed',
      rawFailure
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'matching.client.load_failed',
      expect.any(Error)
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Assignment reviews could not load',
      expect.objectContaining({
        description:
          'Retry assignment reviews without changing proof, preferences, or hidden assignment reviews.',
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry assignment reviews' }));

    await waitFor(() => {
      expect(screen.getByText('Matching profile setup ready')).toBeInTheDocument();
    });
    expect(profileRequests).toBe(2);
  });
});
