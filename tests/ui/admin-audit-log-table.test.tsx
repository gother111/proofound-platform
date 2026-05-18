import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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
      changes: null,
      metadata: null,
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
});
