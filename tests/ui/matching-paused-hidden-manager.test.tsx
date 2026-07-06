import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HiddenMatchesList } from '@/components/matching/HiddenMatchesList';
import { SnoozedMatchesList } from '@/components/matching/SnoozedMatchesList';

const { apiFetchMock, pushMock, refreshMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock('next/image', () => ({
  default: ({ alt }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <span aria-label={alt || 'organization image'} />
  ),
}));

describe('matching paused/hidden manager launch safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps hidden assignment reviews inside the active matching route without score badges', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: 'match-1',
            assignmentId: 'assignment-1',
            score: 0.93,
            assignment: {
              title: 'Proof operations lead',
              locationMode: 'remote',
              country: 'SE',
            },
            organization: {
              name: 'Proofound Labs',
            },
          },
        ],
      }),
    });

    render(<HiddenMatchesList />);

    expect(await screen.findByText('Proof operations lead')).toBeInTheDocument();
    expect(screen.getAllByText('Hidden').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('93%')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view/i })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('/app/i/matching/assignment-1');
  });

  it('keeps untitled hidden assignment reviews assignment-scoped instead of opportunity-scoped', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: 'match-untitled',
            assignmentId: 'assignment-untitled',
            assignment: {
              locationMode: 'hybrid',
              country: 'SE',
            },
            organization: {
              name: 'Proofound Labs',
            },
          },
        ],
      }),
    });

    render(<HiddenMatchesList />);

    expect(await screen.findByText('Assignment')).toBeInTheDocument();
    expect(screen.queryByText('Opportunity')).not.toBeInTheDocument();
  });

  it('shows a recoverable hidden-review load error and retries in place', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network unavailable')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: 'match-restored-load',
            assignment: {
              title: 'Restored hidden assignment',
              locationMode: 'remote',
              country: 'SE',
            },
            organization: {
              name: 'Proofound Labs',
            },
          },
        ],
      }),
    });

    render(<HiddenMatchesList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Hidden assignment reviews could not load'
    );
    expect(
      screen.getByText(
        'Your hidden assignment reviews are unchanged. Retry this panel to refresh the list.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('No hidden assignment reviews right now.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry hidden reviews' })).toHaveClass(
      'min-h-[44px]'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry hidden reviews' }));

    expect(await screen.findByText('Restored hidden assignment')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it('rolls back and announces a failed hidden-review restore', async () => {
    const onRestored = vi.fn();

    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              id: 'match-with/slash',
              assignment: {
                title: 'Hidden assignment to restore',
                locationMode: 'remote',
                country: 'SE',
              },
              organization: {
                name: 'Proofound Labs',
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<HiddenMatchesList onRestored={onRestored} />);

    expect(await screen.findByText('Hidden assignment to restore')).toBeInTheDocument();

    const restoreButton = screen.getByRole('button', { name: 'Unhide' });
    expect(restoreButton).toHaveClass('min-h-[44px]');
    fireEvent.click(restoreButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Assignment review could not be restored. It is still hidden, and you can try again.'
    );
    expect(screen.getByText('Hidden assignment to restore')).toBeInTheDocument();
    expect(onRestored).not.toHaveBeenCalled();
    expect(apiFetchMock).toHaveBeenLastCalledWith('/api/match/hide?matchId=match-with%2Fslash', {
      method: 'DELETE',
    });
  });

  it('keeps the empty hidden state assignment-review scoped', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ matches: [] }),
    });

    render(<HiddenMatchesList />);

    expect(await screen.findByText('No hidden assignment reviews right now.')).toBeInTheDocument();
    expect(screen.queryByText('No hidden matches right now.')).not.toBeInTheDocument();
  });

  it('keeps paused assignment reviews inside the active matching route and avoids detail links', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: 'match-2',
            proofFitLabel: 'Strong proof alignment',
            snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            assignment: {
              id: 'assignment-2',
              title: 'Evidence reviewer',
              description: 'Review proof-backed work samples.',
              status: 'active',
            },
            organization: {
              id: 'org-1',
              name: 'Proofound Labs',
              logoUrl: null,
            },
          },
        ],
      }),
    });

    render(<SnoozedMatchesList />);

    expect(await screen.findByText('Evidence reviewer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore' })).toHaveClass('min-h-[44px]');
    expect(screen.queryByRole('button', { name: /view details/i })).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('/app/i/matching/assignment-2');

    await waitFor(() => {
      expect(screen.getByText('Strong proof alignment')).toBeInTheDocument();
    });
  });

  it('does not derive paused-match labels from raw score fields', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: 'match-score-leak',
            matchScore: 0.93,
            snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            assignment: {
              id: 'assignment-score-leak',
              title: 'Score-free paused assignment',
              description: 'The client must not infer labels from score fields.',
              status: 'active',
            },
            organization: {
              id: 'org-1',
              name: 'Proofound Labs',
              logoUrl: null,
            },
          },
        ],
      }),
    });

    render(<SnoozedMatchesList />);

    expect(await screen.findByText('Score-free paused assignment')).toBeInTheDocument();
    expect(screen.getByText('Proof review needed')).toBeInTheDocument();
    expect(screen.queryByText('Strong proof alignment')).not.toBeInTheDocument();
    expect(document.body.innerHTML).not.toContain('93%');
  });

  it('keeps the empty paused review state inside the matching route without a full reload', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ matches: [] }),
    });

    render(<SnoozedMatchesList />);

    expect(await screen.findByText('No paused assignment reviews right now')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Assignment reviews you pause will appear here until you restore them or the pause period ends.'
      )
    ).toBeInTheDocument();

    const backButton = screen.getByRole('button', { name: 'Back to matching feed' });
    expect(backButton).toHaveClass('min-h-[44px]');
    fireEvent.click(backButton);

    expect(pushMock).toHaveBeenCalledWith('/app/i/matching');
  });

  it('shows a recoverable paused-review load error and retries in place', async () => {
    apiFetchMock.mockRejectedValueOnce(new Error('network unavailable')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ matches: [] }),
    });

    render(<SnoozedMatchesList />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Paused assignment reviews could not load'
    );
    expect(
      screen.getByText(
        'Your paused assignment reviews are unchanged. Retry this panel to refresh the list.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry paused reviews' })).toHaveClass(
      'min-h-[44px]'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry paused reviews' }));

    expect(await screen.findByText('No paused assignment reviews right now')).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it('rolls back and announces a failed paused-match restore', async () => {
    const onRestored = vi.fn();

    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          matches: [
            {
              id: 'paused/match-1',
              proofFitLabel: 'Proof review needed',
              snoozedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              assignment: {
                id: 'assignment-paused-1',
                title: 'Paused assignment to restore',
                description: 'Keep this match paused when restore fails.',
                status: 'active',
              },
              organization: {
                id: 'org-1',
                name: 'Proofound Labs',
                logoUrl: null,
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
      });

    render(<SnoozedMatchesList onRestored={onRestored} />);

    expect(await screen.findByText('Paused assignment to restore')).toBeInTheDocument();

    const restoreButton = screen.getByRole('button', { name: 'Restore' });
    expect(restoreButton).toHaveClass('min-h-[44px]');
    fireEvent.click(restoreButton);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Assignment review could not be restored. It is still paused, and you can try again.'
    );
    expect(screen.getByText('Paused assignment to restore')).toBeInTheDocument();
    expect(onRestored).not.toHaveBeenCalled();
    expect(apiFetchMock).toHaveBeenLastCalledWith('/api/matches/paused%2Fmatch-1/snooze', {
      method: 'DELETE',
    });
  });
});
