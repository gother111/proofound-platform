import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeferredMatchingClient } from '@/app/app/i/matching/DeferredMatchingClient';

describe('DeferredMatchingClient', () => {
  it('announces the matching workspace while the client chunk loads', () => {
    const loadMatchingView = vi.fn(() => new Promise<never>(() => {}));

    render(<DeferredMatchingClient loadMatchingView={loadMatchingView} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Matching workspace' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Preparing matching workspace...');
  });

  it('lets users retry when the matching workspace chunk fails', async () => {
    const loadMatchingView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        MatchingClient: () => <div>Matching workspace ready</div>,
      });

    render(<DeferredMatchingClient loadMatchingView={loadMatchingView} />);

    expect(await screen.findByText('Matching could not load')).toBeInTheDocument();
    expect(screen.getByText(/matching preferences and assignment reviews/i)).toBeInTheDocument();
    expect(screen.queryByText(/preferences and opportunities/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry matching' }));

    await waitFor(() => {
      expect(screen.getByText('Matching workspace ready')).toBeInTheDocument();
    });
    expect(loadMatchingView).toHaveBeenCalledTimes(2);
  });
});
