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
      vi.fn(async (input: string | URL) => {
        const url = typeof input === 'string' ? input : input.toString();

        if (url === '/api/user/email') {
          return {
            ok: true,
            json: async () => ({ email: 'sofia.martinez@proofound-demo.com' }),
          };
        }

        if (url === '/api/integrations/video') {
          return {
            ok: true,
            json: async () => ({
              integrations: [
                { provider: 'zoom', connected: false, connectedAt: null },
                { provider: 'google', connected: false, connectedAt: null },
              ],
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({}),
        };
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows inline Zoom and Google controls in settings integrations tab', async () => {
    render(<SettingsContent userId="user-1" />);

    expect(await screen.findByRole('button', { name: /connect zoom/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /connect google calendar/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /if you do not connect a provider, you can still schedule with a manual link/i
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('linkedin-connect')).toBeInTheDocument();
  });
});
