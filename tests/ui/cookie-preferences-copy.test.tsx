import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CookiePreferences,
  CookiePreferencesLoading,
} from '@/components/cookies/CookiePreferences';

const {
  dispatchClientErrorDiagnosticMock,
  getCookiePreferencesMock,
  saveCookiePreferencesMock,
  toastErrorMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  dispatchClientErrorDiagnosticMock: vi.fn(),
  getCookiePreferencesMock: vi.fn(),
  saveCookiePreferencesMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
}));

vi.mock('@/lib/cookies/consent', () => ({
  getCookiePreferences: getCookiePreferencesMock,
  saveCookiePreferences: saveCookiePreferencesMock,
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

describe('CookiePreferences copy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCookiePreferencesMock.mockReturnValue({
      version: 'v1.1.2026-02-12',
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: '2026-06-12T12:00:00.000Z',
    });
    saveCookiePreferencesMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('uses product-quality language instead of broad platform or ad-targeting copy', () => {
    render(<CookiePreferences />);

    expect(screen.getByText(/Proofound is working/i)).toBeInTheDocument();
    expect(screen.getByText(/relevant Proofound updates/i)).toBeInTheDocument();
    expect(screen.queryByText(/use our platform/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Ad targeting/i)).not.toBeInTheDocument();
  });

  it('keeps consent actions touch-safe and stackable for narrow settings screens', () => {
    render(<CookiePreferences />);

    const quickActions = screen.getByRole('group', {
      name: 'Cookie preference quick actions',
    });
    const acceptAll = screen.getByRole('button', { name: 'Accept All' });
    const rejectOptional = screen.getByRole('button', {
      name: 'Reject All (Essential Only)',
    });
    const savePreferences = screen.getByRole('button', { name: 'Save Preferences' });
    const analyticsSwitch = screen.getByRole('switch', { name: /toggle analytics cookies/i });
    const marketingSwitch = screen.getByRole('switch', { name: /toggle marketing cookies/i });

    expect(quickActions).toHaveClass('flex-col');
    expect(quickActions).toHaveClass('sm:flex-row');
    expect(acceptAll).toHaveClass('h-11');
    expect(acceptAll).toHaveClass('min-h-[44px]');
    expect(acceptAll).toHaveClass('w-full');
    expect(rejectOptional).toHaveClass('h-11');
    expect(rejectOptional).toHaveClass('min-h-[44px]');
    expect(rejectOptional).toHaveClass('w-full');
    expect(savePreferences).toHaveClass('h-11');
    expect(savePreferences).toHaveClass('min-h-[44px]');
    expect(savePreferences).toHaveClass('w-full');
    expect(analyticsSwitch).toHaveClass('h-11');
    expect(analyticsSwitch).toHaveClass('w-[68px]');
    expect(marketingSwitch).toHaveClass('h-11');
    expect(marketingSwitch).toHaveClass('w-[68px]');
  });

  it('names the browser-stored consent loading state without implying changes were made', () => {
    render(<CookiePreferencesLoading />);

    const status = screen.getByRole('status');

    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveTextContent('Loading cookie preferences');
    expect(status).toHaveTextContent('saved choices are being read from this browser');
    expect(status).toHaveTextContent('Essential security cookies stay on');
    expect(status).toHaveTextContent('optional analytics and marketing remain unchanged');
    expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
  });

  it('keeps failed preference saves safe, diagnostic, and retryable', async () => {
    const rawFailure = new Error('localStorage quota leaked-ish');
    saveCookiePreferencesMock.mockRejectedValueOnce(rawFailure);

    render(<CookiePreferences />);

    fireEvent.click(screen.getByRole('switch', { name: /toggle analytics cookies/i }));
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Cookie preferences could not be fully saved');
    expect(alert).toHaveTextContent('Your choices are still shown here');
    expect(document.body.textContent ?? '').not.toContain(rawFailure.message);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Cookie preferences could not be fully saved. Your choices are still shown here; please try again before leaving.'
    );
    expect(JSON.stringify(toastErrorMock.mock.calls)).not.toContain(rawFailure.message);
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'cookies.preferences.save_failed',
      rawFailure
    );
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeEnabled()
    );
  });
});
