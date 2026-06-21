import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import OrganizationProfilePage from '@/app/app/o/[slug]/profile/page';
import { getActiveOrg } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({ id: 'user-1' })),
  getActiveOrg: vi.fn(async () => ({
    org: {
      id: 'org-1',
      slug: 'acme',
      displayName: 'Acme Org',
      tagline: 'This assignment path matters because the work makes proof easier to review.',
      mission: 'Ship proof-first assignment review',
      workingContext: 'Remote-first team with weekly async check-ins.',
      website: 'https://acme.org',
      trustStatus: 'platform_reviewed',
      websiteVerifiedAt: '2026-03-01T00:00:00.000Z',
      orgReadiness: 'org_ready',
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
      <p>{org.operatingContext}</p>
      <p>{org.whyWorkMatters}</p>
    </div>
  ),
}));

describe('Organization trust page editor', () => {
  it('renders only the lean trust corridor and omits culture/value surfaces', async () => {
    const element = await OrganizationProfilePage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    const { container } = render(element);

    expect(screen.getByRole('heading', { name: 'Organization Trust Page' })).toBeInTheDocument();
    const editBadge = screen.getByText('Editable');
    expect(editBadge).toHaveClass('w-fit');
    expect(editBadge).toHaveClass('shrink-0');
    expect(
      screen.getByText(
        /mission, why the work matters, verified domain path, and operating context/i
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('trust-editor')).toBeInTheDocument();
    expect(screen.getByText('Launch essentials ready: 5/5')).toBeInTheDocument();
    expect(screen.getByText('Operating context')).toBeInTheDocument();
    expect(
      screen.getAllByText('Remote-first team with weekly async check-ins.').length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        'This assignment path matters because the work makes proof easier to review.'
      ).length
    ).toBeGreaterThan(0);
    expect(container.querySelectorAll('svg:not([aria-hidden="true"])')).toHaveLength(0);
    expect(screen.queryByText(/trust in hiring/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/trust-first hiring/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/work culture/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Clarity')).not.toBeInTheDocument();
    expect(screen.queryByText('Trust')).not.toBeInTheDocument();
    expect(screen.queryByText(/organization profile/i)).not.toBeInTheDocument();
  });

  it('keeps the domain path checklist item incomplete without a concrete verified path', async () => {
    vi.mocked(getActiveOrg).mockResolvedValueOnce({
      org: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme Org',
        tagline: 'This assignment path matters because the work makes proof easier to review.',
        mission: 'Ship proof-first assignment review',
        workingContext: 'Remote-first team with weekly async check-ins.',
        website: null,
        trustStatus: 'platform_reviewed',
        websiteVerifiedAt: null,
        verified: true,
        orgReadiness: 'draft',
      },
      membership: {
        role: 'org_owner',
      },
    } as any);

    const element = await OrganizationProfilePage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByText('Launch essentials ready: 4/5')).toBeInTheDocument();
    expect(screen.getByText('Needs verified domain signal.')).toBeInTheDocument();
  });
});
