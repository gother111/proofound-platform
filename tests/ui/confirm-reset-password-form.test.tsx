import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { confirmPasswordReset } from '@/actions/auth';
import { ConfirmResetPasswordForm } from '@/app/(auth)/reset-password/confirm/ConfirmResetPasswordForm';
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

const confirmPasswordResetMock = vi.mocked(confirmPasswordReset);

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
});
