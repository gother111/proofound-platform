import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IntegrationsClient } from '@/app/app/i/settings/integrations/IntegrationsClient';

const mockSearchParams = new URLSearchParams('');

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/ui/card', () => ({
  Card: (props: any) => <div {...props} />,
  CardHeader: (props: any) => <div {...props} />,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  CardContent: (props: any) => <div {...props} />,
  CardDescription: (props: any) => <p {...props} />,
}));

vi.mock('@/components/ui/button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: (props: any) => <span {...props} />,
}));

describe('IntegrationsClient', () => {
  beforeEach(async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url === '/api/integrations/video') {
          return {
            ok: true,
            json: async () => ({
              integrations: [
                {
                  provider: 'google',
                  connected: true,
                  connectedAt: new Date().toISOString(),
                },
              ],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({}),
        };
      })
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

  it('uses apiFetch for Google provider disconnect DELETE', async () => {
    const { apiFetch } = await import('@/lib/api/fetch');

    render(<IntegrationsClient />);

    const disconnectButton = await screen.findByRole('button', {
      name: /disconnect google calendar/i,
    });
    fireEvent.click(disconnectButton);

    await waitFor(() => expect(apiFetch).toHaveBeenCalled());

    expect(apiFetch).toHaveBeenCalledWith(
      '/api/integrations/video/google',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('renders launch-corridor guidance when Google is the only connected provider', async () => {
    render(<IntegrationsClient />);

    expect(
      await screen.findByText(/google meet is the only connected provider in scope/i)
    ).toBeInTheDocument();
  });
});
