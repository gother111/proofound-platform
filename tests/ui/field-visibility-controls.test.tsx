import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FieldVisibilityControls } from '@/components/privacy/FieldVisibilityControls';

const apiFetchMock = vi.fn();
const dispatchClientDiagnosticMock = vi.fn();
const dispatchClientErrorDiagnosticMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientDiagnostic: (...args: unknown[]) => dispatchClientDiagnosticMock(...args),
  dispatchClientErrorDiagnostic: (...args: unknown[]) => dispatchClientErrorDiagnosticMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: (...args: unknown[]) => toastErrorMock(...args),
    info: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
  SelectValue: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('FieldVisibilityControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks editing defaults and lets users retry when saved privacy settings fail to load', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'privacy service unavailable' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fieldVisibility: { displayName: 'hidden' },
          redactMode: false,
        }),
      } as Response);

    render(<FieldVisibilityControls userId="user-1" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Privacy field controls could not load');
    expect(alert).toHaveTextContent('Retry before changing field visibility.');
    expect(screen.queryByRole('button', { name: 'Save Privacy Settings' })).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'privacy.field_controls.load_failed',
      expect.any(Error)
    );
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'privacy.field_controls.load_returned_error',
      {
        status: 503,
        hasReturnedError: true,
      }
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'privacy_field_controls_load_request_failed'
    );
    expect(toastErrorMock).toHaveBeenCalledWith('Privacy field controls could not load', {
      description:
        'Your saved privacy choices could not be loaded. Retry before changing field visibility.',
    });

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry privacy controls' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Redact Mode/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Save Privacy Settings' })).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/user/privacy-settings');
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/user/privacy-settings');
  });

  it('keeps preview tabs and primary privacy actions touch-safe on mobile', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        fieldVisibility: { displayName: 'public' },
        redactMode: false,
      }),
    } as Response);

    render(<FieldVisibilityControls userId="user-1" />);

    const saveButton = await screen.findByRole('button', { name: 'Save Privacy Settings' });
    const resetButton = screen.getByRole('button', { name: 'Reset to Defaults' });
    expect(saveButton).toHaveClass('w-full', 'sm:w-auto');
    expect(resetButton).toHaveClass('w-full', 'sm:w-auto');

    const settingsTab = screen.getByRole('tab', { name: 'Settings' });
    const previewTab = screen.getByRole('tab', { name: 'Audience Preview' });
    expect(previewTab.parentElement).toHaveClass('min-h-[44px]');
    expect(settingsTab).toHaveClass('min-h-11');
    expect(previewTab).toHaveClass('min-h-11');

    fireEvent.mouseDown(previewTab, { button: 0, ctrlKey: false });
    fireEvent.mouseUp(previewTab, { button: 0, ctrlKey: false });
    fireEvent.click(previewTab);
    await waitFor(() => expect(previewTab).toHaveAttribute('aria-selected', 'true'));

    for (const name of ['Public Page', 'Trusted review', 'Assignment review']) {
      const previewButton = screen.getByRole('button', { name });
      expect(previewButton).toHaveClass('h-11', 'min-h-[44px]', 'min-w-[44px]');
      expect(previewButton).toHaveClass('w-full', 'sm:w-auto');
    }
  });

  it('keeps failed saves visible and retryable without surfacing returned privacy errors', async () => {
    apiFetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          fieldVisibility: { displayName: 'public' },
          redactMode: false,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'policy debug: user user-1 cannot update profile_visibility' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(<FieldVisibilityControls userId="user-1" />);

    const saveButton = await screen.findByRole('button', { name: 'Save Privacy Settings' });
    fireEvent.click(saveButton);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Privacy settings were not saved');
    expect(alert).toHaveTextContent(
      'Your visibility choices were not saved. They are still selected here; retry before leaving this page.'
    );
    expect(alert).not.toHaveTextContent('policy debug');
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'privacy.field_controls.save_failed',
      expect.any(Error)
    );
    expect(dispatchClientDiagnosticMock).toHaveBeenCalledWith(
      'privacy.field_controls.save_returned_error',
      {
        status: 500,
        hasReturnedError: true,
      }
    );
    expect((dispatchClientErrorDiagnosticMock.mock.calls[0]?.[1] as Error).message).toBe(
      'privacy_field_controls_save_request_failed'
    );
    expect(toastErrorMock).toHaveBeenCalledWith('Privacy settings were not saved', {
      description:
        'Your visibility choices were not saved. They are still selected here; retry before leaving this page.',
    });

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry save' }));

    await waitFor(() => expect(apiFetchMock).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
