import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { VerifyEmailContent } from '@/app/(auth)/verify-email/VerifyEmailContent';
import { verifyEmail } from '@/actions/auth';
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

const verifyEmailMock = vi.mocked(verifyEmail);

describe('VerifyEmailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    searchParamsGet.mockReturnValue(null);
    verifyEmailMock.mockResolvedValue({ success: true });
  });

  it('renders the local visual success state without calling the guarded auth action', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
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
  });
});
