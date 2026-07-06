import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OrgAssignmentsAliasPage from '@/app/app/o/[slug]/assignments/page';

vi.mock('@/components/ui/v2/AppSurface', () => ({
  AppSurface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/app/app/o/[slug]/matching/OrgMatchingClient', () => ({
  OrgMatchingClient: () => <div>Assignment matching workspace</div>,
}));

describe('OrgAssignmentsAliasPage', () => {
  it('keeps the organization breadcrumb finger-friendly', async () => {
    render(
      await OrgAssignmentsAliasPage({ params: Promise.resolve({ slug: 'acme' }) })
    );

    const organizationLink = screen.getByRole('link', { name: 'Organization' });
    expect(organizationLink).toHaveAttribute('href', '/app/o/acme/home');
    expect(organizationLink).toHaveClass('min-h-11');
  });
});
