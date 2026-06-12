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
      expect(screen.getByText('Created profile')).toBeInTheDocument();
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(2);
  });
});
