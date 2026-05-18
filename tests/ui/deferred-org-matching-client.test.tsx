import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeferredOrgMatchingClient } from '@/app/app/o/[slug]/matching/DeferredOrgMatchingClient';

describe('DeferredOrgMatchingClient', () => {
  it('announces that assignments are loading while the workspace chunk is deferred', () => {
    const loadMatchingView = vi.fn(() => new Promise<never>(() => {}));

    render(<DeferredOrgMatchingClient orgSlug="acme" loadMatchingView={loadMatchingView} />);

    expect(
      screen.getByRole('heading', { name: 'Assignment workspace is loading' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading assignments and matches...');
    expect(screen.getByRole('link', { name: 'Create assignment' })).toHaveAttribute(
      'href',
      '/app/o/acme/assignments/new'
    );
  });

  it('shows a retryable recovery state when the matching workspace fails to load', async () => {
    const loadMatchingView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        OrgMatchingClient: () => <div>Assignment matching ready</div>,
      });

    render(<DeferredOrgMatchingClient orgSlug="acme" loadMatchingView={loadMatchingView} />);

    expect(await screen.findByText('Assignments could not load')).toBeInTheDocument();
    expect(screen.getByText(/Your assignments are still safe/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create assignment' })).toHaveAttribute(
      'href',
      '/app/o/acme/assignments/new'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retry loading assignments' }));

    await waitFor(() => {
      expect(screen.getByText('Assignment matching ready')).toBeInTheDocument();
    });
    expect(loadMatchingView).toHaveBeenCalledTimes(2);
  });
});
