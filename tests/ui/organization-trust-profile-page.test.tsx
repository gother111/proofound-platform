import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OrganizationProfilePage from '@/app/app/o/[slug]/profile/page';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({ id: 'user-1' })),
  getActiveOrg: vi.fn(async () => ({
    org: {
      id: 'org-1',
      slug: 'acme',
      displayName: 'Acme Org',
      tagline: 'This role matters because the work fixes trust in hiring.',
      mission: 'Ship trust-first hiring',
      workingContext: 'Remote-first team with weekly async check-ins.',
      hiringProcessSummary: 'Assignments are reviewed internally before any publish step.',
      website: 'https://acme.org',
      workCulture: { workNorms: { asyncSyncBalance: 75 } },
      values: ['Clarity', 'Trust'],
    },
    membership: {
      role: 'org_owner',
    },
  })),
}));

vi.mock('@/components/organization/OrgTrustProfileEditor', () => ({
  OrgTrustProfileEditor: ({ org }: any) => (
    <div data-testid="trust-editor">
      <p>{org.displayName}</p>
      <p>{org.mission}</p>
      <p>{org.workingContext}</p>
      <p>{org.hiringProcessSummary}</p>
    </div>
  ),
}));

describe('Organization trust profile page', () => {
  it('renders only the lean trust corridor and omits culture/value surfaces', async () => {
    const element = await OrganizationProfilePage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByText(/organization trust profile/i)).toBeInTheDocument();
    expect(screen.getByText(/mission, why the work matters, working context/i)).toBeInTheDocument();
    expect(screen.getByTestId('trust-editor')).toBeInTheDocument();
    expect(screen.getByText('Remote-first team with weekly async check-ins.')).toBeInTheDocument();
    expect(
      screen.getByText('Assignments are reviewed internally before any publish step.')
    ).toBeInTheDocument();
    expect(screen.queryByText(/work culture/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Clarity')).not.toBeInTheDocument();
    expect(screen.queryByText('Trust')).not.toBeInTheDocument();
  });
});
