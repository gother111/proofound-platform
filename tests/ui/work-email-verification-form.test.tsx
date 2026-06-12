import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { WorkEmailVerificationForm } from '@/components/settings/WorkEmailVerificationForm';
import { apiFetch } from '@/lib/api/fetch';

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}));

describe('WorkEmailVerificationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits verification with normalized email and null orgId, while rendering display_name labels', async () => {
    vi.mocked(apiFetch).mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === '/api/organizations') {
        return {
          ok: true,
          json: async () => ({
            organizations: [{ id: 'org-1', slug: 'acme', display_name: 'Acme Org' }],
          }),
        } as Response;
      }

      if (url === '/api/verification/work-email/send') {
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as Response;
      }

      throw new Error(`Unexpected url: ${url} ${JSON.stringify(init)}`);
    });

    render(<WorkEmailVerificationForm onSuccess={vi.fn()} />);

    expect(await screen.findByText('Acme Org')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/work email address/i), {
      target: { value: 'Person@Acme.Org ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send confirmation email/i }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith(
        '/api/verification/work-email/send',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    const sendCall = vi
      .mocked(apiFetch)
      .mock.calls.find(([url]) => url === '/api/verification/work-email/send');
    expect(sendCall).toBeDefined();

    const [, requestInit] = sendCall!;
    expect(JSON.parse(requestInit!.body as string)).toEqual({
      workEmail: 'person@acme.org',
      orgId: null,
    });
  });

  it('shows explicit empty-state copy when no organizations are available', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ organizations: [] }),
    } as Response);

    render(<WorkEmailVerificationForm onSuccess={vi.fn()} />);

    expect(
      await screen.findByText(/No organizations are available for your account right now/i)
    ).toBeInTheDocument();
  });

  it('keeps organization load failures visible and retryable without blocking email verification', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          organizations: [{ id: 'org-1', slug: 'acme', display_name: 'Acme Org' }],
        }),
      } as Response);

    render(<WorkEmailVerificationForm onSuccess={vi.fn()} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Organization list could not load');
    expect(alert).toHaveTextContent('You can still send the confirmation email now');
    expect(screen.getByRole('button', { name: /send confirmation email/i })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: /retry organization list/i }));

    expect(await screen.findByText('Acme Org')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('blocks free email domains and does not call verification send endpoint', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ organizations: [] }),
    } as Response);

    render(<WorkEmailVerificationForm onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/work email address/i), {
      target: { value: 'person@gmail.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send confirmation email/i }));

    expect(
      await screen.findByText(/Please use your company\/organization email, not a personal email/i)
    ).toBeInTheDocument();

    expect(vi.mocked(apiFetch)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/organizations');
  });
});
