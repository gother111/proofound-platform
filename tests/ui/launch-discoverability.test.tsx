import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TopBar } from '@/components/app/TopBar';
import { SettingsContent } from '@/components/settings/SettingsContent';

const usePathnameMock = vi.fn();
const pushMock = vi.fn();
const refreshMock = vi.fn();
const getMock = vi.fn(() => null);

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
  useSearchParams: () => ({
    get: getMock,
  }),
}));

vi.mock('@/actions/auth', () => ({
  signOut: vi.fn(),
}));

vi.mock('@/actions/tour', () => ({
  resetTour: vi.fn(async () => ({ success: true })),
}));

vi.mock('@/components/settings/PrivacyOverview', () => ({
  PrivacyOverview: () => <div>PrivacyOverview</div>,
}));
vi.mock('@/components/settings/VerificationStatus', () => ({
  VerificationStatus: () => <div>VerificationStatus</div>,
}));
vi.mock('@/components/settings/EmailManager', () => ({
  EmailManager: () => <div>EmailManager</div>,
}));
vi.mock('@/components/settings/PasswordChangeForm', () => ({
  PasswordChangeForm: () => <div>PasswordChangeForm</div>,
}));
vi.mock('@/components/settings/PortfolioVisibilityCard', () => ({
  PortfolioVisibilityCard: () => <div>PortfolioVisibilityCard</div>,
}));

describe('launch discoverability surfaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue('/app/i/home');
    getMock.mockReturnValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ email: 'alex@proofound.io' }),
      }))
    );
  });

  it('removes the top-bar notifications entry point', () => {
    render(<TopBar userName="Alex" userInitials="A" />);

    expect(screen.queryByLabelText(/notifications/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/open profile menu/i)).toBeInTheDocument();
  });

  it('removes notifications from the active settings surface', async () => {
    render(<SettingsContent userId="user-1" />);

    expect(await screen.findByRole('tab', { name: /account/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /interview scheduling/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /privacy & data/i })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /notifications/i })).not.toBeInTheDocument();
  });
});
