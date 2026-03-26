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
    get: (key: string) => (key === 'tab' ? 'interviews' : null),
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

describe('Settings interview scheduling discoverability', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: 'sofia.martinez@proofound-demo.com' }),
      }))
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps launch interview scheduling manual-first on the same settings tab', async () => {
    render(<SettingsContent userId="user-1" />);

    expect(await screen.findByText(/Manual meeting links are the MVP default/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Interview Scheduling' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.getByText(/No Google Meet or third-party calendar connection is required/i)).toBeInTheDocument();
  });
});
