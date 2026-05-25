import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsContent } from '@/components/settings/SettingsContent';

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
  resetTour: vi.fn(async () => ({ success: true })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
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
});
