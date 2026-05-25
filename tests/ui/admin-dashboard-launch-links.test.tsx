import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminPage from '@/app/admin/page';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const requirePlatformAdminMock = vi.fn();
const usePathnameMock = vi.fn();
const resolveGcpCvOcrSafeStatusMock = vi.fn();
const getAdminLaunchHealthSummaryMock = vi.fn();

vi.mock('@/lib/auth/admin', () => ({
  requirePlatformAdmin: () => requirePlatformAdminMock(),
}));

vi.mock('@/lib/expertise/gcp-cv-ocr-status', () => ({
  resolveGcpCvOcrSafeStatus: () => resolveGcpCvOcrSafeStatusMock(),
}));

vi.mock('@/lib/launch/admin-health-summary', () => ({
  getAdminLaunchHealthSummary: () => getAdminLaunchHealthSummaryMock(),
}));

vi.mock('next/navigation', async () => {
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    usePathname: () => usePathnameMock(),
  };
});

describe('admin launch links', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePlatformAdminMock.mockResolvedValue({
      userId: 'admin-1',
      email: 'ops@proofound.io',
      platformRole: 'platform_admin',
      adminLevel: 'platform_admin',
    });
    resolveGcpCvOcrSafeStatusMock.mockResolvedValue({ status: 'disabled' });
    getAdminLaunchHealthSummaryMock.mockResolvedValue({
      status: 'ready',
      verdict: 'READY',
      generatedAt: '2026-05-20T02:58:33.442Z',
      artifactPath: '.artifacts/launch-validation-2026-05-20/final-launch-checklist-status.json',
      counts: {
        pass: 36,
        fail: 0,
        blocked: 0,
        unverified: 4,
      },
      trueBlockers: [],
      externalPrerequisites: [
        'Incident owner / support lead roles are assigned',
        'Critical alerts are configured',
        'Backups and restore discipline are verified',
        'Go/no-go is signed only after fresh evidence is green',
      ],
    });
    usePathnameMock.mockReturnValue('/admin');
  });

  it('keeps the real admin page limited to verification and audit launch actions', async () => {
    render(await AdminPage());

    expect(screen.getByRole('link', { name: /open operations queues/i })).toHaveAttribute(
      'href',
      '/admin/verification'
    );
    expect(screen.getByRole('link', { name: /open audit log/i })).toHaveAttribute(
      'href',
      '/admin/audit'
    );

    expect(screen.queryByRole('link', { name: /users/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /organizations/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /fairness/i })).not.toBeInTheDocument();
    expect(screen.getByText(/cv ocr production/i)).toBeInTheDocument();
    expect(screen.getByText(/launch health/i)).toBeInTheDocument();
    expect(screen.getByText(/^READY$/)).toBeInTheDocument();
    expect(screen.getByText(/^36$/)).toBeInTheDocument();
    expect(screen.getByText(/^Pass$/)).toBeInTheDocument();
    expect(screen.getByText(/^4$/)).toBeInTheDocument();
    expect(screen.getByText(/^Open$/)).toBeInTheDocument();
    expect(screen.getByText(/still needs 4 external proof items/i)).toBeInTheDocument();
    expect(screen.getByText(/^disabled$/i)).toBeInTheDocument();
    expect(screen.queryByText(/processor|secret|extracted text/i)).not.toBeInTheDocument();
  });

  it('keeps the active admin navigation inside the preserved launch corridor', () => {
    render(
      <AdminSidebar adminEmail="ops@proofound.io" adminRole="platform_admin" collapsed={false} />
    );

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin');
    expect(screen.getByRole('link', { name: /verification/i })).toHaveAttribute(
      'href',
      '/admin/verification'
    );
    expect(screen.getByRole('link', { name: /account history/i })).toHaveAttribute(
      'href',
      '/admin/audit'
    );
  });
});
