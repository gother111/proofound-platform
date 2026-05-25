import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HiddenMatchesList } from '@/components/matching/HiddenMatchesList';
import { SnoozedMatchesList } from '@/components/matching/SnoozedMatchesList';

const { apiFetchMock, refreshMock } = vi.hoisted(() => ({
  apiFetchMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: apiFetchMock,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
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

  it('keeps hidden matches inside the active matching route without score badges', async () => {
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

  it('keeps untitled hidden matches assignment-scoped instead of opportunity-scoped', async () => {
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

  it('keeps paused matches inside the active matching route and avoids detail links', async () => {
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
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
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
});
