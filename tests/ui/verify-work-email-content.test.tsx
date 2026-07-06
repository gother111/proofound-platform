import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { VerifyWorkEmailContent } from '@/app/verify-work-email/VerifyWorkEmailContent';
import { VISUAL_VERIFY_TOKENS } from '@/lib/verification/visual-link-fixtures';
import { dispatchClientDiagnostic, dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

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

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: vi.fn(),
  dispatchClientErrorDiagnostic: vi.fn(),
}));

const dispatchClientDiagnosticMock = vi.mocked(dispatchClientDiagnostic);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('VerifyWorkEmailContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParamsGet.mockReturnValue(null);
    vi.stubGlobal('fetch', vi.fn());
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_SUPABASE', 'true');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'true');
    vi.stubEnv('VERCEL_ENV', 'development');
  });

  it('gives missing-token users clear recovery actions', async () => {
    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Verification failed' })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText('Request a fresh work-email link from settings.', { exact: false })
    ).toBeInTheDocument();
    expect(screen.getByText(/Verification token is missing/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open work-email settings/i }));
    expect(routerPush).toHaveBeenCalledWith('/app/i/settings');

    fireEvent.click(screen.getByRole('button', { name: /return to public page/i }));
    expect(routerPush).toHaveBeenCalledWith('/app/i/profile');
  });

  it('renders the local visual success state without calling the verification API', async () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === 'token' ? VISUAL_VERIFY_TOKENS.workEmailSuccess : null
    );

    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Work email verified' })
      ).toBeInTheDocument();
    });

    expect(screen.getByText('elena.reviewer@northstar-evidence.example')).toBeInTheDocument();
    expect(screen.getByText(/Your workplace check is now active/i)).toBeInTheDocument();
    expect(
      screen.getByText('You can return to your verification center when ready.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Redirecting to your profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/workplace signal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/match quality/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/profile now shows/i)).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /go to verification center/i }));
    expect(routerPush).toHaveBeenCalledWith('/app/i/verifications');
  });

  it('keeps visual work-email tokens on the guarded verification API path in plain mock mode', async () => {
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    searchParamsGet.mockImplementation((key: string) =>
      key === 'token' ? VISUAL_VERIFY_TOKENS.workEmailSuccess : null
    );
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        message: 'Work email verified successfully!',
        workEmail: 'real-check@example.com',
      }),
    } as Response);

    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/verification/work-email/verify?token=${VISUAL_VERIFY_TOKENS.workEmailSuccess}`
      );
    });

    expect(screen.getByText('real-check@example.com')).toBeInTheDocument();
  });

  it('keeps unexpected returned verification errors safe and diagnostic', async () => {
    const rawFailure = 'database function leaked work_email_token_hash constraint detail';
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    searchParamsGet.mockImplementation((key: string) => (key === 'token' ? 'token-raw' : null));
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: rawFailure }),
    } as Response);

    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Verification failed' })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(
        'Work-email verification could not be completed. Request a fresh link from settings and try again.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'verification.work_email_verify.returned_error',
      {
        status: 500,
        hasReturnedError: true,
      }
    );
    expect(JSON.stringify(dispatchClientDiagnosticMock.mock.calls)).not.toContain(rawFailure);
    expect(JSON.stringify(dispatchClientErrorDiagnosticMock.mock.calls)).not.toContain(rawFailure);
  });

  it('keeps thrown verification failures safe and diagnostic', async () => {
    const thrownFailure = new Error('network stack exposed verification endpoint');
    vi.stubEnv('NEXT_PUBLIC_PROOFOUND_VISUAL_FIXTURES', 'false');
    vi.stubEnv('PROOFOUND_VISUAL_FIXTURES', 'false');
    searchParamsGet.mockImplementation((key: string) => (key === 'token' ? 'token-thrown' : null));
    vi.mocked(global.fetch).mockRejectedValue(thrownFailure);

    render(<VerifyWorkEmailContent />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Verification failed' })
      ).toBeInTheDocument();
    });

    expect(screen.queryByText(thrownFailure.message)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Work-email verification could not be completed. Request a fresh link from settings and try again.'
      )
    ).toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'verification.work_email_verify.client_failed',
      thrownFailure
    );
  });
});
