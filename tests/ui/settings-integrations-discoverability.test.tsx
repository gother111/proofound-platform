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
    get: (key: string) => (key === 'tab' ? 'integrations' : null),
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

vi.mock('@/components/settings/LinkedInConnect', () => ({
  LinkedInConnect: () => <div data-testid="linkedin-connect" />,
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

vi.mock('@/components/dashboard/CustomizableDashboard', () => ({
  CustomizableDashboard: () => <div data-testid="customizable-dashboard" />,
}));

describe('Settings integrations discoverability', () => {
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

  it('shows a direct link to the dedicated Zoom/Google integrations manager', async () => {
    render(<SettingsContent userId="user-1" />);

    const manageLink = await screen.findByRole('link', {
      name: /manage zoom & google integrations/i,
    });

    expect(manageLink).toHaveAttribute('href', '/app/i/settings/integrations');
    expect(
      screen.getByText(/google meet and zoom are managed in the dedicated integrations page/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId('linkedin-connect')).toBeInTheDocument();
  });
});
