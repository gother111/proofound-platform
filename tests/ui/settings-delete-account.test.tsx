import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { dispatchClientDiagnosticMock, dispatchClientErrorDiagnosticMock } = vi.hoisted(() => ({
  dispatchClientDiagnosticMock: vi.fn(),
  dispatchClientErrorDiagnosticMock: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: dispatchClientDiagnosticMock,
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
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(loadError)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accountStatus: 'active',
          deletionRequestedAt: null,
        }),
      } as Response);

    render(<DeleteAccount userId="user-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Account deletion status could not load. Your privacy controls are still available; retry this section before deleting.'
    );
    expect(alert).not.toHaveTextContent('settings unavailable');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.delete_account.status_load_failed',
      loadError
    );

    fireEvent.click(screen.getByRole('button', { name: /retry status/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(
          'Account deletion status could not load. Your privacy controls are still available; retry this section before deleting.'
        )
      ).not.toBeInTheDocument();
    });
    expect(apiFetch).toHaveBeenCalledTimes(2);
  });

  it('keeps failed deletion recoverable inside the confirmation dialog without raw backend text', async () => {
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
    expect(alert).toHaveTextContent(
      'Account deletion could not finish. Check your password and confirmation phrase, then try again.'
    );
    expect(alert).not.toHaveTextContent('Password did not match your account.');
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
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'settings.delete_account.request_returned_error',
      expect.objectContaining({
        hasReturnedMessage: true,
        hasReason: false,
      })
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'account_deletion_request_failed'
    );
    expect(
      [
        ...dispatchClientDiagnosticMock.mock.calls,
        ...dispatchClientErrorDiagnosticMock.mock.calls,
      ].some((call) => JSON.stringify(call).includes('Password did not match your account.'))
    ).toBe(false);
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
