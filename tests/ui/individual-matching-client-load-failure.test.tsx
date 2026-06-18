import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MatchingClient } from '@/app/app/i/matching/MatchingClient';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
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
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@/components/matching/MatchingProfileSetup', () => ({
  MatchingProfileSetup: () => <div>Matching profile setup ready</div>,
}));

vi.mock('@/components/matching/IndividualMatchingEmpty', () => ({
  IndividualMatchingEmpty: () => <div>Individual matching empty</div>,
}));

vi.mock('@/components/matching/MatchResultCard', () => ({
  MatchResultCard: ({
    result,
    onInterested,
  }: {
    result: { id: string };
    onInterested: () => void;
  }) => (
    <div data-testid="match-card">
      <span>{result.id}</span>
      <button type="button" onClick={onInterested}>
        Express interest
      </button>
    </div>
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

const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);
const apiFetchMock = vi.mocked(apiFetch);
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
              status: 503,
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
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'matching.client.profile_load_failed',
      {
        status: 503,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'database password leaked'
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'provider-secret-123'
    );
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(
      'database password leaked'
    );
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(
      'provider-secret-123'
    );
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Assignment reviews could not load',
      expect.objectContaining({
        description:
          'Retry assignment reviews without changing proof, preferences, or hidden assignment reviews.',
      })
    );

    const retryButton = screen.getByRole('button', { name: 'Retry assignment reviews' });
    expect(retryButton).toHaveClass('min-h-[44px]');
    expect(screen.getByRole('button', { name: 'Review proof readiness' })).toHaveClass(
      'min-h-[44px]'
    );

    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Matching profile setup ready')).toBeInTheDocument();
    });
    expect(profileRequests).toBe(2);
  });

  it('keeps raw assignment-review result failures out of diagnostics and retry UI', async () => {
    const rawFailure = {
      message: 'debug match result query leaked candidate@example.com',
      requestId: 'match-result-provider-secret-123',
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
          return {
            ok: true,
            json: async () => ({ profile: { id: 'user-1' } }),
          } as Response;
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );

    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/profile') {
        return {
          ok: false,
          status: 502,
          json: async () => rawFailure,
        } as Response;
      }

      throw new Error(`Unexpected apiFetch URL: ${url}`);
    });

    render(<MatchingClient />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Assignment reviews need another moment');
    expect(alert).toHaveTextContent('Your profile, proof records, and paused or hidden choices');
    expect(document.body).not.toHaveTextContent(/candidate@example.com/i);
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'matching.client.matches_load_failed',
      {
        status: 502,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'candidate@example.com'
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'match-result-provider-secret-123'
    );
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(
      'candidate@example.com'
    );
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(
      'match-result-provider-secret-123'
    );
  });

  it('keeps failed interest requests safe and retryable without changing corridor state', async () => {
    const rawFailure = {
      message: 'debug: intro workflow write failed for candidate@example.com',
      requestId: 'interest-provider-secret-123',
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
          return {
            ok: true,
            json: async () => ({ profile: { id: 'user-1' } }),
          } as Response;
        }

        throw new Error(`Unexpected fetch URL: ${url}`);
      }) as any
    );

    apiFetchMock.mockImplementation(async (url: string) => {
      if (url === '/api/match/profile') {
        return {
          ok: true,
          json: async () => ({
            items: [
              {
                id: 'match-1',
                assignmentId: 'assignment-1',
                assignment: { role: 'Proof operations lead' },
              },
            ],
          }),
        } as Response;
      }

      if (url === '/api/match/interest') {
        return {
          ok: false,
          status: 500,
          json: async () => rawFailure,
        } as Response;
      }

      throw new Error(`Unexpected apiFetch URL: ${url}`);
    });

    render(<MatchingClient />);

    expect(
      await screen.findByRole('button', { name: 'Manage paused or hidden reviews' })
    ).toHaveClass('min-h-[44px]');

    fireEvent.click(await screen.findByRole('button', { name: 'Express interest' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(
        'Interest could not be recorded',
        expect.objectContaining({
          description:
            'No intro, reveal, or review state changed. Retry before moving to the next assignment review.',
        })
      );
    });

    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'matching.client.interest_returned_error',
      {
        status: 500,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'candidate@example.com'
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(
      'interest-provider-secret-123'
    );
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(
      'candidate@example.com'
    );
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(
      'interest-provider-secret-123'
    );
    expect(document.body).not.toHaveTextContent(/candidate@example.com/i);
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain('candidate@example.com');
  });
});
