import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { VerifyEmailPageFallback } from '@/app/(auth)/verify-email/VerifyEmailPageFallback';
import { VerifyEmailContent } from '@/app/(auth)/verify-email/VerifyEmailContent';
import { verifyEmail } from '@/actions/auth';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';
import { VISUAL_VERIFY_TOKENS } from '@/lib/verification/visual-link-fixtures';

const routerPush = vi.fn();
const searchParamsGet = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPush,
  }),
  useSearchParams: () => ({
    get: searchParamsGet,
  }),
}));

vi.mock('@/actions/auth', () => ({
  verifyEmail: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const verifyEmailMock = vi.mocked(verifyEmail);
const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('VerifyEmailPageFallback', () => {
  it('keeps the page-level verification fallback specific and account-safe', () => {
    render(<VerifyEmailPageFallback />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Verifying your email' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Checking verification link...');
    expect(
      screen.getByText(/No profile, proof, or privacy setting changes from this loading state/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
  });
});

describe('VerifyEmailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    searchParamsGet.mockReturnValue(null);
    verifyEmailMock.mockResolvedValue({ success: true });
  });

  it('renders the local visual success state without calling the guarded auth action', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');
    searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return VISUAL_VERIFY_TOKENS.emailSuccess;
      if (key === 'type') return 'signup';
      return null;
    });

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-success')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { level: 1, name: 'Email verified!' })).toBeInTheDocument();
    expect(screen.getByText('You can continue to login when ready.')).toBeInTheDocument();
    expect(screen.queryByText(/Redirecting to login/i)).not.toBeInTheDocument();
    expect(verifyEmailMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
  });

  it('keeps visual email tokens on the guarded auth action path in plain mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('VERCEL_ENV', 'development');
    searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return VISUAL_VERIFY_TOKENS.emailSuccess;
      if (key === 'type') return 'signup';
      return null;
    });

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(verifyEmailMock).toHaveBeenCalled();
    });

    expect(verifyEmailMock.mock.calls[0][0].get('token')).toBe(VISUAL_VERIFY_TOKENS.emailSuccess);
    expect(verifyEmailMock.mock.calls[0][0].get('type')).toBe('signup');
    expect(screen.getByText('Redirecting to login in a few seconds.')).toBeInTheDocument();
  });

  it('keeps the real success state truthful while preserving auto-redirect behavior', async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'real-token';
      if (key === 'type') return 'email';
      return null;
    });

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-success')).toBeInTheDocument();
    });

    expect(screen.getByText('Redirecting to login in a few seconds.')).toBeInTheDocument();
    expect(verifyEmailMock).toHaveBeenCalled();
    expect(verifyEmailMock.mock.calls[0][0].get('token')).toBe('real-token');
    expect(verifyEmailMock.mock.calls[0][0].get('type')).toBe('email');
  });

  it('uses a page-level heading for verification failures', async () => {
    searchParamsGet.mockReturnValue(null);

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-error')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Verification failed' })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No verification token provided');
    expect(verifyEmailMock).not.toHaveBeenCalled();
  });

  it('preserves known expired-link verification copy', async () => {
    searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'expired-token';
      if (key === 'type') return 'email';
      return null;
    });
    verifyEmailMock.mockResolvedValue({ error: 'Invalid or expired verification link' });

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid or expired verification link');
    expect(dispatchClientDiagnosticMock).not.toHaveBeenCalledWith(
      'auth.verify_email.returned_error',
      expect.anything()
    );
  });

  it('keeps unexpected returned verification errors safe and diagnostic', async () => {
    const rawError = 'Supabase verifyOtp failed: token_hash stack detail';
    searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'real-token';
      if (key === 'type') return 'email';
      return null;
    });
    verifyEmailMock.mockResolvedValue({ error: rawError });

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not verify this email link. The link may be expired; try signing up again or go to login.'
    );
    expect(screen.queryByText(rawError)).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith('auth.verify_email.returned_error', {
      hasReturnedError: true,
    });
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawError);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawError);
  });

  it('keeps thrown verification failures safe and diagnostic', async () => {
    const thrownError = new Error('network failed while verifying email token');
    searchParamsGet.mockImplementation((key: string) => {
      if (key === 'token') return 'real-token';
      if (key === 'type') return 'signup';
      return null;
    });
    verifyEmailMock.mockRejectedValue(thrownError);

    render(<VerifyEmailContent />);

    await waitFor(() => {
      expect(screen.getByTestId('verify-email-error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not verify this email link. The link may be expired; try signing up again or go to login.'
    );
    expect(screen.queryByText(thrownError.message)).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'auth.verify_email.failed',
      thrownError
    );
  });
});
