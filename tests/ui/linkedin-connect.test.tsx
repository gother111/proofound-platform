import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LinkedInConnect } from '../../src/components/settings/LinkedInConnect';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../src/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('../../src/components/ui/badge', () => ({
  Badge: (props: any) => <span {...props} />,
}));

describe('LinkedInConnect', () => {
  beforeEach(async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ connected: true }),
      }))
    );

    const { apiFetch } = await import('@/lib/api/fetch');
    (apiFetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses apiFetch for linkedin disconnect POST', async () => {
    const { apiFetch } = await import('@/lib/api/fetch');

    render(<LinkedInConnect />);

    const button = await screen.findByRole('button', { name: /disconnect linkedin/i });
    fireEvent.click(button);

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/expertise/linkedin-disconnect',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
