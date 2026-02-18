import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VideoProviderSelector } from '@/components/interviews/VideoProviderSelector';

const toastErrorMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: (...args: any[]) => toastErrorMock(...args),
  },
}));

describe('VideoProviderSelector connect routing', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          zoom: { connected: false },
          google: { connected: false },
        }),
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    toastErrorMock.mockReset();
  });

  it('uses canonical provider connect routes', async () => {
    const openMock = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<VideoProviderSelector selectedProvider={null} onSelectProvider={vi.fn()} />);

    const zoomButton = await screen.findByRole('button', { name: /connect zoom/i });
    const googleButton = await screen.findByRole('button', { name: /connect google meet/i });

    fireEvent.click(zoomButton);
    fireEvent.click(googleButton);

    expect(openMock).toHaveBeenNthCalledWith(
      1,
      '/api/integrations/zoom/connect',
      'oauth',
      expect.stringContaining('width=600')
    );
    expect(openMock).toHaveBeenNthCalledWith(
      2,
      '/api/integrations/google/connect',
      'oauth',
      expect.stringContaining('width=600')
    );
    expect(toastErrorMock).toHaveBeenCalledTimes(2);
  });
});
