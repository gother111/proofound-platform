import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DeferredPrivacySettingsClient } from '@/app/app/i/settings/privacy/DeferredPrivacySettingsClient';
import { PrivacySettingsClient } from '@/app/app/i/settings/privacy/PrivacySettingsClient';
import { DeferredVerificationsClient } from '@/app/app/i/verifications/DeferredVerificationsClient';
import { DeferredSettingsContent } from '@/components/settings/DeferredSettingsContent';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
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
  IndividualFieldVisibilityControls: () => <div data-testid="visibility-controls" />,
}));

describe('deferred settings loaders', () => {
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

  it('keeps privacy controls visible with an inline warning when saved visibility fails to load', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as typeof fetch;

    render(<PrivacySettingsClient />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Privacy preferences need a refresh');
    expect(alert).toHaveTextContent('safe defaults');
    expect(screen.getByTestId('visibility-controls')).toBeInTheDocument();

    global.fetch = originalFetch;
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
