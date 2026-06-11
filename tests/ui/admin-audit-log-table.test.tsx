import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: any[]) => apiFetchMock(...args),
}));

import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';

function buildJsonResponse(payload: unknown, ok = true) {
  return {
    ok,
    json: vi.fn().mockResolvedValue(payload),
  } as any;
}

const auditPayload = {
  logs: [
    {
      id: 'audit-1',
      adminId: 'admin-1',
      action: 'verify_organization',
      targetType: 'organization',
      targetId: 'org-1',
      reason: 'Organization evidence checked.',
      createdAt: new Date('2026-02-06T23:25:00.000Z'),
      admin: {
        id: 'admin-1',
        displayName: 'Test Dashboard User',
        handle: null,
      },
    },
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
};

describe('AuditLogTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audit entries with mobile-readable details and desktop table data', async () => {
    apiFetchMock.mockResolvedValue(buildJsonResponse(auditPayload));

    render(<AuditLogTable />);

    await screen.findAllByText('Verify Organization');

    expect(apiFetchMock).toHaveBeenCalledWith('/api/admin/audit?page=1&limit=20&search=');
    expect(screen.getAllByText('Test Dashboard User').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Organization evidence checked.').length).toBeGreaterThan(0);
    expect(screen.getByText('Showing 1 to 1 of 1 logs')).toBeInTheDocument();
  });

  it('does not need raw audit changes or metadata to render the list view', async () => {
    apiFetchMock.mockResolvedValue(
      buildJsonResponse({
        logs: [
          {
            id: 'audit-2',
            adminId: 'admin-1',
            action: 'internal_ops_queue_upload_reviewed',
            targetType: 'internal_ops_queue_item',
            targetId: 'queue-1',
            reason: null,
            createdAt: new Date('2026-02-06T23:25:00.000Z'),
            admin: {
              id: 'admin-1',
              displayName: 'Test Dashboard User',
              handle: null,
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      })
    );

    render(<AuditLogTable />);

    await screen.findAllByText('Internal Ops Queue Upload Reviewed');

    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    expect(screen.queryByText('More information')).not.toBeInTheDocument();
    expect(screen.queryByText('Additional protected details')).not.toBeInTheDocument();
  });

  it('shows an explicit empty state without impossible pagination copy', async () => {
    apiFetchMock.mockResolvedValue(
      buildJsonResponse({
        logs: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      })
    );

    render(<AuditLogTable />);

    await screen.findAllByText('No audit history yet.');

    expect(screen.getByText('No logs to show')).toBeInTheDocument();
  });

  it('shows an explicit error state when audit history cannot load', async () => {
    apiFetchMock.mockRejectedValue(new Error('network unavailable'));

    render(<AuditLogTable />);

    await waitFor(() => {
      expect(
        screen.getByText('Audit history could not be loaded. Try again in a moment.')
      ).toBeInTheDocument();
    });
  });

  it('cancels break-glass preview confirmation without loading protected audit data', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    apiFetchMock.mockResolvedValueOnce(buildJsonResponse(auditPayload));

    render(<AuditLogTable />);

    await screen.findAllByText('Verify Organization');

    fireEvent.change(screen.getByLabelText('Organization id'), {
      target: { value: 'org-1' },
    });
    fireEvent.change(screen.getByLabelText('Break-glass reason'), {
      target: { value: 'Investigating confirmed privacy incident' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    const previewDialog = await screen.findByRole('alertdialog', {
      name: 'Open break-glass audit preview?',
    });
    fireEvent.click(within(previewDialog).getByRole('button', { name: 'Keep closed' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    expect(confirmSpy).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('loads break-glass org audit preview with explicit reason and no raw metadata', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    apiFetchMock.mockResolvedValueOnce(buildJsonResponse(auditPayload)).mockResolvedValueOnce(
      buildJsonResponse({
        orgId: 'org-1',
        accessedAt: '2026-05-20T10:00:00.000Z',
        preview: {
          mode: 'minimum_necessary',
          returned: 1,
          warning:
            'Raw org audit metadata is withheld from the dashboard preview. Use download=true only for approved incident review.',
        },
        logs: [
          {
            id: 7,
            action: 'member.invited',
            targetType: 'organization_member',
            targetId: '[protected target]',
            createdAt: '2026-05-20T10:00:00.000Z',
            riskLabels: ['Protected metadata withheld'],
          },
        ],
      })
    );

    render(<AuditLogTable />);

    await screen.findAllByText('Verify Organization');

    fireEvent.change(screen.getByLabelText('Organization id'), {
      target: { value: 'org-1' },
    });
    fireEvent.change(screen.getByLabelText('Break-glass reason'), {
      target: { value: 'Investigating confirmed privacy incident' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));

    const previewDialog = await screen.findByRole('alertdialog', {
      name: 'Open break-glass audit preview?',
    });
    expect(previewDialog).toBeInTheDocument();
    expect(within(previewDialog).getByText('org-1')).toBeInTheDocument();
    expect(
      within(previewDialog).getByText('Investigating confirmed privacy incident')
    ).toBeInTheDocument();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(within(previewDialog).getByRole('button', { name: 'Confirm preview' }));

    await screen.findByText('1 preview rows for org-1');

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(apiFetchMock).toHaveBeenLastCalledWith('/api/admin/organizations/org-1/audit?limit=10', {
      headers: {
        'x-break-glass-reason': 'Investigating confirmed privacy incident',
      },
    });
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Member Invited')).toBeInTheDocument();
    expect(screen.getByText('Protected metadata withheld')).toBeInTheDocument();
    expect(screen.queryByText('candidate@example.com')).not.toBeInTheDocument();
    expect(screen.queryByText('Raw incident detail')).not.toBeInTheDocument();

    confirmSpy.mockRestore();
  });
});
