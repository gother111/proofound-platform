import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeferredMatchingClient } from '@/app/app/i/matching/DeferredMatchingClient';

describe('DeferredMatchingClient', () => {
  it('announces the matching workspace while the client chunk loads', () => {
    const loadMatchingView = vi.fn(() => new Promise<never>(() => {}));

    render(<DeferredMatchingClient loadMatchingView={loadMatchingView} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Assignment review workspace' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Preparing assignment review workspace...'
    );
  });

  it('lets users retry when the matching workspace chunk fails', async () => {
    const loadMatchingView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        MatchingClient: () => <div>Assignment review workspace ready</div>,
      });

    render(<DeferredMatchingClient loadMatchingView={loadMatchingView} />);

    expect(await screen.findByText('Assignment reviews could not load')).toBeInTheDocument();
    expect(screen.getByText(/review preferences and assignment reviews/i)).toBeInTheDocument();
    expect(screen.queryByText(/preferences and opportunities/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry assignment reviews' }));

    await waitFor(() => {
      expect(screen.getByText('Assignment review workspace ready')).toBeInTheDocument();
    });
    expect(loadMatchingView).toHaveBeenCalledTimes(2);
  });
});
