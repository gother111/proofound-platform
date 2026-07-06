import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AuditLogPage from '@/app/app/i/settings/audit-log/page';

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock('@/components/privacy/AuditLogTable', () => ({
  AuditLogTable: ({ title }: { title?: string }) => (
    <section aria-label="Account history table">{title ?? 'Account history'} table</section>
  ),
}));

describe('settings account history route', () => {
  it('shows the real account history instead of archived purpose copy', () => {
    render(<AuditLogPage />);

    expect(screen.getByRole('heading', { name: 'Account history' })).toBeInTheDocument();
    expect(screen.getByLabelText('Account history table')).toBeInTheDocument();
    expect(screen.getByText('Recent activity table')).toBeInTheDocument();
    expect(screen.queryByText('Purpose edit history is archived')).not.toBeInTheDocument();
  });
});
