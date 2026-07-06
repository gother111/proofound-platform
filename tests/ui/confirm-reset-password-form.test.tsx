import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { confirmPasswordReset } from '@/actions/auth';
import { ConfirmResetPasswordForm } from '@/app/(auth)/reset-password/confirm/ConfirmResetPasswordForm';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { VISUAL_VERIFY_TOKENS } from '@/lib/verification/visual-link-fixtures';

const routerPush = vi.fn();
const routerReplace = vi.fn();
const searchParamsGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
  }),
  useSearchParams: () => ({
    get: searchParamsGet,
  }),
}));

vi.mock('@/actions/auth', () => ({
  confirmPasswordReset: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const confirmPasswordResetMock = vi.mocked(confirmPasswordReset);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('ConfirmResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    searchParamsGet.mockImplementation((key: string) =>
      key === 'token' ? VISUAL_VERIFY_TOKENS.resetPasswordSuccess : null
    );
    confirmPasswordResetMock.mockResolvedValue({ success: true });
  });

  it('renders the local visual reset form without validating a guarded recovery session', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');

    render(<ConfirmResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText('Set new password')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm password')).toBeInTheDocument();
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
  });

  it('shows inline validation before accepting the visual reset submit', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');

    render(<ConfirmResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText('Set new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Proofound123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Proofound124' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
  });

  it('records visual reset success locally without auto-redirecting', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');

    render(<ConfirmResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText('Set new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Proofound123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Proofound123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText('Password reset successful')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Your password has been reset. You can continue to login when ready.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to login now/i })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(confirmPasswordResetMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('keeps failed reset confirmation retryable without raw auth service text', async () => {
    const rawFailure = 'Auth provider token expired with stack detail';
    searchParamsGet.mockReturnValue(null);
    confirmPasswordResetMock.mockResolvedValueOnce({ error: rawFailure });

    render(<ConfirmResetPasswordForm />);

    await waitFor(() => {
      expect(screen.getByText('Set new password')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'Proofound123' },
    });
    fireEvent.change(screen.getByLabelText('Confirm password'), {
      target: { value: 'Proofound123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Password was not reset. Your existing password is unchanged; request a new link or try again.'
    );
    expect(alert).not.toHaveTextContent(rawFailure);
    expect(screen.getByLabelText('New password')).toHaveValue('Proofound123');
    expect(screen.getByLabelText('Confirm password')).toHaveValue('Proofound123');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'auth.reset_password.confirm_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    expect(routerPush).not.toHaveBeenCalled();
  });
});
