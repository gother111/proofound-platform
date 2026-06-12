import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DeleteAccountSection } from '@/components/privacy/DeleteAccountSection';
import { apiFetch } from '@/lib/api/fetch';

const { dispatchClientErrorDiagnosticMock } = vi.hoisted(() => ({
  dispatchClientErrorDiagnosticMock: vi.fn(),
}));

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('keeps failed deletion recoverable inside the confirmation dialog', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'Password did not match your account.' }),
    } as Response);

    render(<DeleteAccountSection />);

    fireEvent.click(screen.getByRole('button', { name: /delete account now/i }));
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'incorrect-password' },
    });
    fireEvent.change(screen.getByLabelText(/type delete my account/i), {
      target: { value: 'delete my account' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Account deletion could not finish. Check your password and confirmation phrase, then try again.'
    );
    expect(screen.getByRole('alert')).not.toHaveTextContent('Password did not match your account.');
    expect(
      screen.getByRole('heading', { name: /confirm permanent deletion/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveValue('incorrect-password');
    expect(screen.getByLabelText(/type delete my account/i)).toHaveValue('DELETE MY ACCOUNT');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'privacy.delete_account.request_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'Password did not match your account.'
    );
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it('redirects after confirmed deletion succeeds', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<DeleteAccountSection />);

    fireEvent.click(screen.getByRole('button', { name: /delete account now/i }));
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'correct-password' },
    });
    fireEvent.change(screen.getByLabelText(/type delete my account/i), {
      target: { value: 'DELETE MY ACCOUNT' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^delete account$/i }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
    expect(refreshMock).toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith(
      '/api/user/account',
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });
});
