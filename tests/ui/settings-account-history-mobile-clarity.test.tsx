import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuditLogTable } from '@/components/settings/AuditLogTable';
import { AuditLogViewer } from '@/components/settings/AuditLogViewer';
import { apiFetch } from '@/lib/api/fetch';
import { dispatchClientErrorDiagnostic } from '@/lib/client-diagnostics';

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('@/lib/client-diagnostics', () => ({
  dispatchClientErrorDiagnostic: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}));

const apiFetchMock = vi.mocked(apiFetch);
const dispatchClientErrorDiagnosticMock = vi.mocked(dispatchClientErrorDiagnostic);

describe('settings account history mobile clarity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders account history as readable mobile activity cards', async () => {
    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            action: 'Created profile',
            ipHash: 'protected-reference',
            device: 'Unknown browser on a very narrow mobile viewport',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
    } as Response);

    render(<AuditLogTable userId="current" />);

    await waitFor(() => {
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    });

    const mobileCard = screen.getByRole('article');
    expect(mobileCard).toHaveTextContent('Created profile');
    expect(mobileCard).toHaveTextContent('When');
    expect(mobileCard).toHaveTextContent('Access detail');
    expect(mobileCard).toHaveTextContent('Protected');
    expect(mobileCard).toHaveTextContent('Unknown browser on a very narrow mobile viewport');
    expect(mobileCard.parentElement).toHaveClass('md:hidden');
  });

  it('keeps account history load failures safe, diagnostic, and retryable', async () => {
    const rawFailure = new Error('database password leaked-ish');
    apiFetchMock.mockRejectedValueOnce(rawFailure).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            action: 'Created profile',
            ipHash: 'protected-reference',
            device: 'Unknown browser',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
    } as Response);

    render(<AuditLogTable userId="current" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Account history could not load');
    expect(alert).toHaveTextContent('Your privacy records are still safe');
    expect(screen.queryByText('database password leaked-ish')).not.toBeInTheDocument();
    expect(screen.queryByText('No activity recorded yet')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.account_history.load_failed',
      rawFailure
    );

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry account history' }));

    await waitFor(() => {
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
    expect(apiFetchMock).toHaveBeenNthCalledWith(1, '/api/user/audit-log?limit=50&offset=0');
    expect(apiFetchMock).toHaveBeenNthCalledWith(2, '/api/user/audit-log?limit=50&offset=0');
  });

  it('keeps the settings account history viewer failure visible and retryable', async () => {
    const rawFailure = new Error('backend stack trace with sensitive detail');
    apiFetchMock.mockRejectedValueOnce(rawFailure).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            action: 'Created profile',
            ipHash: 'protected-reference',
            device: 'Unknown browser',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
    } as Response);

    render(<AuditLogViewer />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Account history could not load');
    expect(alert).toHaveTextContent('Your privacy records are still safe');
    expect(screen.queryByText('backend stack trace with sensitive detail')).not.toBeInTheDocument();
    expect(screen.queryByText('No activity recorded yet')).not.toBeInTheDocument();
    expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
      'settings.audit_log.load_failed',
      rawFailure
    );
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Account history could not load',
        variant: 'destructive',
      })
    );

    fireEvent.click(within(alert).getByRole('button', { name: 'Retry account history' }));

    await waitFor(() => {
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps settings account history CSV downloads inline and retryable', async () => {
    let createObjectUrlAttempts = 0;
    const createObjectURLMock = vi.fn(() => {
      createObjectUrlAttempts += 1;
      if (createObjectUrlAttempts === 1) {
        throw new Error('raw browser download failure');
      }
      return 'blob:account-history';
    });
    const revokeObjectURLMock = vi.fn();
    const anchorClickMock = vi.fn();
    const originalCreateObjectURL = URL.createObjectURL;
    const originalRevokeObjectURL = URL.revokeObjectURL;
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName);
      if (tagName.toLowerCase() === 'a') {
        element.click = anchorClickMock;
      }
      return element;
    });

    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;

    apiFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        events: [
          {
            id: 'event-1',
            timestamp: '2026-05-16T01:30:00.000Z',
            action: 'Created profile',
            ipHash: 'protected-reference',
            device: 'Unknown browser',
          },
        ],
        total: 1,
        limit: 50,
        offset: 0,
        hasMore: false,
      }),
    } as Response);

    try {
      render(<AuditLogTable userId="current" />);

      expect((await screen.findAllByText('Created profile')).length).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole('button', { name: 'Download activity' }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Account history download could not start');
      expect(alert).toHaveTextContent('Your activity list is still visible');
      expect(alert).not.toHaveTextContent('raw browser download failure');
      expect(within(alert).getByRole('button', { name: 'Retry download' })).toBeInTheDocument();
      expect(dispatchClientErrorDiagnosticMock).toHaveBeenCalledWith(
        'settings.account_history.export_failed',
        expect.any(Error)
      );

      fireEvent.click(within(alert).getByRole('button', { name: 'Retry download' }));

      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent('Account history download started');
      expect(status).toHaveTextContent('Keep this file private');
      expect(anchorClickMock).toHaveBeenCalled();
      expect(createObjectURLMock).toHaveBeenCalled();
      expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:account-history');
      expect(screen.getAllByText('Created profile').length).toBeGreaterThan(0);
    } finally {
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      createElementSpy.mockRestore();
    }
  });
});
