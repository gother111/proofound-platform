import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchClientErrorDiagnosticMock } = vi.hoisted(() => ({
  dispatchClientErrorDiagnosticMock: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: dispatchClientErrorDiagnosticMock,
}));

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

import { DeleteAccount } from '@/components/settings/DeleteAccount';
import { apiFetch } from '@/lib/api/fetch';

describe('settings DeleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('announces account status load failures', async () => {
    const loadError = new Error('settings unavailable');
    vi.mocked(apiFetch).mockRejectedValueOnce(loadError);

    render(<DeleteAccount userId="user-1" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('settings unavailable');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.delete_account.status_load_failed',
      loadError
    );
  });

  it('keeps failed deletion recoverable inside the confirmation dialog', async () => {
    const deleteError = { message: 'Password did not match your account.' };
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accountStatus: 'active',
          deletionRequestedAt: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => deleteError,
      } as Response);

    render(<DeleteAccount userId="user-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /delete my account/i }));
    fireEvent.change(screen.getByLabelText(/enter your password to confirm/i), {
      target: { value: 'incorrect-password' },
    });
    fireEvent.change(screen.getByLabelText(/type "delete my account" to confirm/i), {
      target: { value: 'delete my account' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Password did not match your account.');
    expect(screen.getByRole('heading', { name: /confirm account deletion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/enter your password to confirm/i)).toHaveValue(
      'incorrect-password'
    );
    expect(screen.getByLabelText(/type "delete my account" to confirm/i)).toHaveValue(
      'DELETE MY ACCOUNT'
    );
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.delete_account.request_failed',
      expect.any(Error)
    );
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('announces successful deletion politely when the account status refresh succeeds', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accountStatus: 'active',
          deletionRequestedAt: null,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accountStatus: 'active',
          deletionRequestedAt: null,
        }),
      } as Response);

    render(<DeleteAccount userId="user-1" />);

    fireEvent.click(await screen.findByRole('button', { name: /delete my account/i }));
    fireEvent.change(screen.getByLabelText(/enter your password to confirm/i), {
      target: { value: 'correct-password' },
    });
    fireEvent.change(screen.getByLabelText(/type "delete my account" to confirm/i), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(
        'Your account has been deleted permanently.'
      );
    });
  });
});
