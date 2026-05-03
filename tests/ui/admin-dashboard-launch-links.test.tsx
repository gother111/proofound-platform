import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AdminPage from '@/app/admin/page';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const requirePlatformAdminMock = vi.fn();
const usePathnameMock = vi.fn();
const resolveGcpCvOcrSafeStatusMock = vi.fn();

vi.mock('@/lib/auth/admin', () => ({
  requirePlatformAdmin: () => requirePlatformAdminMock(),
}));

vi.mock('@/lib/expertise/gcp-cv-ocr-status', () => ({
  resolveGcpCvOcrSafeStatus: () => resolveGcpCvOcrSafeStatusMock(),
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
    expect(screen.getByText(/cv ocr sandbox/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/^disabled$/i);
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
