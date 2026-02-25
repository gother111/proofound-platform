import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  notFoundMock,
  createClientMock,
  organizationMaybeSingleMock,
  assignmentsCountMock,
  membersCountMock,
} = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  createClientMock: vi.fn(),
  organizationMaybeSingleMock: vi.fn(),
  assignmentsCountMock: vi.fn(),
  membersCountMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

import OrganizationPortfolioPublicPage from '@/app/portfolio/org/[slug]/page';

describe('Organization public portfolio page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    createClientMock.mockResolvedValue({
      from: (table: string) => {
        if (table === 'organizations') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: organizationMaybeSingleMock,
              }),
            }),
          };
        }

        if (table === 'assignments') {
          return {
            select: () => ({
              eq: () => ({
                eq: assignmentsCountMock,
              }),
            }),
          };
        }

        if (table === 'organization_members') {
          return {
            select: () => ({
              eq: () => ({
                eq: membersCountMock,
              }),
            }),
          };
        }

        throw new Error(`Unexpected table mock: ${table}`);
      },
    });
  });

  it('renders public org portfolio content', async () => {
    organizationMaybeSingleMock.mockResolvedValue({
      data: {
        id: 'org-acme',
        slug: 'acme',
        display_name: 'Acme',
        tagline: 'Build trust',
        mission: 'Ship impact',
        website: 'https://acme.org/',
        type: 'company',
        values: ['Integrity'],
        causes: ['Climate'],
        verified: true,
      },
    });
    assignmentsCountMock.mockResolvedValue({ count: 2 });
    membersCountMock.mockResolvedValue({ count: 7 });

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText(/public organization portfolio/i)).toBeInTheDocument();
    expect(screen.getByText('Ship impact')).toBeInTheDocument();
  });

  it('calls notFound when slug has no public portfolio', async () => {
    organizationMaybeSingleMock.mockResolvedValue({ data: null });
    assignmentsCountMock.mockResolvedValue({ count: 0 });
    membersCountMock.mockResolvedValue({ count: 0 });

    await expect(
      OrganizationPortfolioPublicPage({ params: Promise.resolve({ slug: 'missing' }) })
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
