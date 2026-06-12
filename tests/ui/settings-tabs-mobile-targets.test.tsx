import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SettingsContent } from '@/components/settings/SettingsContent';

const { dispatchClientErrorDiagnosticMock, resetTourMock, toastErrorMock, toastSuccessMock } =
  vi.hoisted(() => ({
    dispatchClientErrorDiagnosticMock: vi.fn(),
    resetTourMock: vi.fn(async () => ({ success: true })),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
  }));

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
}));

vi.mock('@/actions/tour', () => ({
  resetTour: resetTourMock,
}));

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('@/components/settings/VerificationStatus', () => ({
  VerificationStatus: () => <div data-testid="verification-status" />,
}));

vi.mock('@/components/settings/EmailManager', () => ({
  EmailManager: () => <div data-testid="email-manager" />,
}));

vi.mock('@/components/settings/PasswordChangeForm', () => ({
  PasswordChangeForm: () => <div data-testid="password-change-form" />,
}));

vi.mock('@/components/settings/PrivacyOverview', () => ({
  PrivacyOverview: () => <div data-testid="privacy-overview" />,
}));

vi.mock('@/components/settings/PortfolioVisibilityCard', () => ({
  PortfolioVisibilityCard: () => <div data-testid="portfolio-visibility-card" />,
}));

describe('Settings mobile tab targets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTourMock.mockResolvedValue({ success: true });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: 'alex@proofound.io' }),
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps the top-level settings tabs comfortable to tap on mobile', async () => {
    render(<SettingsContent userId="user-1" />);

    const accountTab = await screen.findByRole('tab', { name: 'Account' });
    const interviewsTab = screen.getByRole('tab', { name: 'Interview Scheduling' });
    const privacyTab = screen.getByRole('tab', { name: 'Privacy & Data' });

    expect(accountTab).toHaveClass('min-h-11');
    expect(interviewsTab).toHaveClass('min-h-11');
    expect(privacyTab).toHaveClass('min-h-11');
  });

  it('keeps failed tour resets safe, diagnostic, and retryable', async () => {
    const rawFailure = 'database tour reset leaked-ish';
    resetTourMock.mockResolvedValueOnce({ success: false, error: rawFailure });

    render(<SettingsContent userId="user-1" />);

    const restartButton = await screen.findByRole('button', { name: /restart tour/i });
    fireEvent.click(restartButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Tour could not restart');
    expect(alert).toHaveTextContent('Your account settings were not changed');
    expect(document.body.textContent ?? '').not.toContain(rawFailure);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Tour could not restart. Your account settings were not changed; please try again.'
    );
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain(rawFailure);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.tour_reset_failed',
      expect.any(Error)
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      rawFailure
    );
    expect(toastSuccessMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /restart tour/i })).toBeEnabled()
    );
  });
});
