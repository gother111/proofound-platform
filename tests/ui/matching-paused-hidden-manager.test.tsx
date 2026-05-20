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

  it('keeps paused matches inside the active matching route and avoids detail links', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        matches: [
          {
            id: 'match-2',
            matchScore: 0.84,
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
});
