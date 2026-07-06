import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { requestPasswordReset } from '@/actions/auth';
import { ResetPasswordForm } from '@/app/(auth)/reset-password/ResetPasswordForm';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

vi.mock('@/actions/auth', () => ({
  requestPasswordReset: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const requestPasswordResetMock = vi.mocked(requestPasswordReset);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestPasswordResetMock.mockResolvedValue({ error: null });
  });

  it('uses a page-level heading for the reset screen', () => {
    render(<ResetPasswordForm />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Reset your password' })
    ).toBeInTheDocument();
  });

  it('keeps reset request failures safe, diagnostic, and retryable', async () => {
    const rawFailure = 'Auth provider SMTP failure with stack detail';
    requestPasswordResetMock.mockResolvedValueOnce({ error: rawFailure });

    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'candidate@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Reset link could not be sent. Your account is unchanged; check the email and try again.'
    );
    expect(alert).not.toHaveTextContent(rawFailure);
    expect(screen.getByLabelText('Email')).toHaveValue('candidate@example.com');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'auth.reset_password.request_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /send reset link/i })).toBeEnabled()
    );
  });

  it('keeps thrown reset request failures safe and retryable', async () => {
    const rawFailure = new Error('network fetch failed for reset provider');
    requestPasswordResetMock.mockRejectedValueOnce(rawFailure);

    render(<ResetPasswordForm />);

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'candidate@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Reset link could not be sent. Your account is unchanged; check the email and try again.'
    );
    expect(alert).not.toHaveTextContent(rawFailure.message);
    expect(screen.getByLabelText('Email')).toHaveValue('candidate@example.com');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'auth.reset_password.request_failed',
      rawFailure
    );
  });
});
