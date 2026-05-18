import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeferredMessagesClient } from '@/app/app/i/messages/DeferredMessagesClient';

describe('DeferredMessagesClient', () => {
  it('announces conversations while the messages workspace loads', () => {
    const loadMessagesView = vi.fn(() => new Promise<never>(() => {}));

    render(<DeferredMessagesClient loadMessagesView={loadMessagesView} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading conversations...');
  });

  it('lets users retry when the messages workspace chunk fails', async () => {
    const loadMessagesView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        MessagesClient: () => <div>Messages workspace ready</div>,
      });

    render(<DeferredMessagesClient loadMessagesView={loadMessagesView} />);

    expect(await screen.findByText('Conversations could not load')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry conversations' }));

    await waitFor(() => {
      expect(screen.getByText('Messages workspace ready')).toBeInTheDocument();
    });
    expect(loadMessagesView).toHaveBeenCalledTimes(2);
  });
});
