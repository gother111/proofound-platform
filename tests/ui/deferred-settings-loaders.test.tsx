import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeferredPrivacySettingsClient } from '@/app/app/i/settings/privacy/DeferredPrivacySettingsClient';
import { PrivacySettingsClient } from '@/app/app/i/settings/privacy/PrivacySettingsClient';
import { DeferredVerificationsClient } from '@/app/app/i/verifications/DeferredVerificationsClient';
import { DeferredSettingsContent } from '@/components/settings/DeferredSettingsContent';

const { toastErrorMock } = vi.hoisted(() => ({
  toastErrorMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    success: vi.fn(),
  },
}));

vi.mock('@/components/settings/PrivacyOverview', () => ({
  PrivacyOverview: () => <div data-testid="privacy-overview" />,
}));

vi.mock('@/components/privacy/DataBreakdown', () => ({
  DataBreakdown: () => <div data-testid="data-breakdown" />,
}));

vi.mock('@/components/privacy/AuditLogTable', () => ({
  AuditLogTable: () => <div data-testid="audit-log" />,
}));

vi.mock('@/components/privacy/DeleteAccountSection', () => ({
  DeleteAccountSection: () => <div data-testid="delete-account" />,
}));

vi.mock('@/components/profile/IndividualFieldVisibilityControls', () => ({
  IndividualFieldVisibilityControls: ({
    initialVisibility,
    controlsDisabledReason,
  }: {
    initialVisibility?: any;
    controlsDisabledReason?: string | null;
  }) => (
    <div data-testid="visibility-controls">
      {initialVisibility?.profile ? 'Loaded profile preferences' : 'Safe visibility defaults'}
      {controlsDisabledReason ? (
        <p data-testid="visibility-controls-disabled-reason">{controlsDisabledReason}</p>
      ) : null}
    </div>
  ),
}));

describe('deferred settings loaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('announces privacy controls while they load', () => {
    const loadPrivacySettingsView = vi.fn(() => new Promise<never>(() => {}));

    render(<DeferredPrivacySettingsClient loadPrivacySettingsView={loadPrivacySettingsView} />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy settings' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading privacy controls...');
  });

  it('keeps the privacy page framed while visibility settings load', () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn(() => new Promise<never>(() => {})) as typeof fetch;

    render(<PrivacySettingsClient />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy settings' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Preparing privacy settings...');

    global.fetch = originalFetch;
  });

  it('keeps privacy controls visible and retryable when saved visibility fails to load', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: true }),
      }) as typeof fetch;

    try {
      render(<PrivacySettingsClient />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Privacy preferences need a refresh');
      expect(alert).toHaveTextContent('safe defaults');
      expect(screen.getByTestId('visibility-controls')).toBeInTheDocument();
      expect(screen.getByText('Safe visibility defaults')).toBeInTheDocument();
      expect(screen.getByTestId('visibility-controls-disabled-reason')).toHaveTextContent(
        'Retry privacy preferences before editing'
      );
      expect(toastErrorMock).toHaveBeenCalledWith('Privacy preferences need a refresh', {
        description:
          'Safe defaults are shown until retry succeeds. Retry before editing visibility controls.',
      });
      expect(toastErrorMock).not.toHaveBeenCalledWith('Failed to load privacy settings');

      const retryButton = screen.getByRole('button', { name: /retry privacy preferences/i });
      expect(retryButton).toHaveClass('min-h-[44px]');

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Loaded profile preferences')).toBeInTheDocument();
      expect(screen.queryByTestId('visibility-controls-disabled-reason')).not.toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('keeps thrown privacy visibility load failures safe and retryable', async () => {
    const originalFetch = global.fetch;
    const rawFailure = 'network layer exposed profile visibility endpoint';
    global.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error(rawFailure))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ profile: true }),
      }) as typeof fetch;

    try {
      render(<PrivacySettingsClient />);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Saved privacy preferences could not be loaded.');
      expect(alert).toHaveTextContent('safe defaults');
      expect(screen.queryByText(rawFailure)).not.toBeInTheDocument();
      expect(screen.getByText('Safe visibility defaults')).toBeInTheDocument();
      expect(screen.getByTestId('visibility-controls-disabled-reason')).toHaveTextContent(
        'Saved privacy preferences did not load'
      );
      expect(toastErrorMock).toHaveBeenCalledWith('Privacy preferences need a refresh', {
        description:
          'Safe defaults are shown until retry succeeds. Retry before editing visibility controls.',
      });
      expect(toastErrorMock).not.toHaveBeenCalledWith('Failed to load privacy settings');

      const retryButton = screen.getByRole('button', { name: /retry privacy preferences/i });
      expect(retryButton).toHaveClass('min-h-[44px]');

      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
      expect(screen.getByText('Loaded profile preferences')).toBeInTheDocument();
      expect(screen.queryByTestId('visibility-controls-disabled-reason')).not.toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('focuses anchored privacy sections after deferred visibility settings load', async () => {
    const originalFetch = global.fetch;
    const originalPath = window.location.href;
    const originalScrollIntoView = Element.prototype.scrollIntoView;
    const scrollIntoViewMock = vi.fn();
    const focusMock = vi.fn();
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(focusMock);
    Element.prototype.scrollIntoView = scrollIntoViewMock;
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ profile: true }),
    })) as typeof fetch;
    window.history.pushState({}, '', '/app/i/settings/privacy#privacy-delete');

    try {
      render(<PrivacySettingsClient />);

      expect(await screen.findByTestId('delete-account')).toBeInTheDocument();
      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        });
      });
      expect(focusMock).toHaveBeenCalledWith({ preventScroll: true });
    } finally {
      global.fetch = originalFetch;
      window.history.pushState({}, '', originalPath);
      rafSpy.mockRestore();
      if (originalScrollIntoView) {
        Element.prototype.scrollIntoView = originalScrollIntoView;
      } else {
        delete (Element.prototype as Partial<Element>).scrollIntoView;
      }
      focusSpy.mockRestore();
    }
  });

  it('lets users retry privacy controls after the chunk fails', async () => {
    const loadPrivacySettingsView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        PrivacySettingsClient: () => <div>Privacy controls ready</div>,
      });

    render(<DeferredPrivacySettingsClient loadPrivacySettingsView={loadPrivacySettingsView} />);

    expect(await screen.findByText('Privacy controls could not load')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry privacy controls' }));

    await waitFor(() => {
      expect(screen.getByText('Privacy controls ready')).toBeInTheDocument();
    });
    expect(loadPrivacySettingsView).toHaveBeenCalledTimes(2);
  });

  it('announces account settings while they load', () => {
    const loadSettingsView = vi.fn(() => new Promise<never>(() => {}));

    render(<DeferredSettingsContent userId="user-1" loadSettingsView={loadSettingsView} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading settings...');
    expect(screen.getByRole('status').parentElement).toHaveClass('w-full', 'min-w-0');
  });

  it('lets users retry account settings after the chunk fails', async () => {
    const loadSettingsView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        SettingsContent: () => <div>Settings ready</div>,
      });

    render(<DeferredSettingsContent userId="user-1" loadSettingsView={loadSettingsView} />);

    expect(await screen.findByText('Settings could not load')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry settings' }));

    await waitFor(() => {
      expect(screen.getByText('Settings ready')).toBeInTheDocument();
    });
    expect(loadSettingsView).toHaveBeenCalledTimes(2);
  });

  it('announces verification center while it loads', () => {
    const loadVerificationsView = vi.fn(() => new Promise<never>(() => {}));

    render(
      <DeferredVerificationsClient
        incomingRequests={[]}
        sentRequests={[]}
        userEmail="user@example.com"
        loadVerificationsView={loadVerificationsView}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading verification center...');
  });

  it('lets users retry the verification center after the chunk fails', async () => {
    const loadVerificationsView = vi
      .fn()
      .mockRejectedValueOnce(new Error('chunk missing'))
      .mockResolvedValueOnce({
        VerificationsClient: () => <div>Verification center ready</div>,
      });

    render(
      <DeferredVerificationsClient
        incomingRequests={[]}
        sentRequests={[]}
        userEmail="user@example.com"
        loadVerificationsView={loadVerificationsView}
      />
    );

    expect(await screen.findByText('Verification center could not load')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry verifications' }));

    await waitFor(() => {
      expect(screen.getByText('Verification center ready')).toBeInTheDocument();
    });
    expect(loadVerificationsView).toHaveBeenCalledTimes(2);
  });
});
