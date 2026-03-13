import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminDashboard } from '@/components/admin/AdminDashboard';

const apiFetchMock = vi.fn();

vi.mock('@/lib/api/fetch', () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('@/components/admin/analytics/AdminGrowthChart', () => ({
  AdminGrowthChart: () => <div data-testid="admin-growth-chart" />,
}));

vi.mock('@/components/analytics/FairnessNoteDashboard', () => ({
  FairnessNoteDashboard: () => <div data-testid="fairness-note-dashboard" />,
}));

vi.mock('@/components/metrics/MetricsDashboard', () => ({
  MetricsDashboard: () => <div data-testid="metrics-dashboard" />,
}));

describe('AdminDashboard launch links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiFetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          users: {
            total: 12,
            thisMonth: 2,
            activeLastWeek: 8,
          },
          organizations: {
            total: 4,
            active: 3,
          },
          matches: {
            total: 9,
            thisMonth: 1,
          },
          contracts: {
            total: 2,
            thisMonth: 1,
          },
          assignments: {
            active: 3,
          },
        },
      }),
    });
  });

  it('only links to preserved internal ops surfaces', async () => {
    render(
      <AdminDashboard
        adminUser={{
          userId: 'admin-1',
          email: 'ops@proofound.io',
          platformRole: 'platform_admin',
          adminLevel: 'platform_admin',
        }}
      />
    );

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith('/api/admin/analytics/overview');
    });

    expect(screen.getByRole('link', { name: /verification queue/i })).toHaveAttribute(
      'href',
      '/admin/verification'
    );
    expect(screen.getByRole('link', { name: /audit log/i })).toHaveAttribute(
      'href',
      '/admin/audit'
    );
    expect(screen.getByRole('link', { name: /internal ops hub/i })).toHaveAttribute(
      'href',
      '/admin'
    );

    expect(screen.queryByRole('link', { name: /view all users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view organizations/i })).not.toBeInTheDocument();
  });
});
