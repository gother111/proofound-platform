import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import OrganizationPortfolioPublicPage from '@/app/portfolio/org/[slug]/page';

function mockSupabaseClient({
  organization,
  activeAssignments = 4,
  teamMembers = 8,
}: {
  organization: any;
  activeAssignments?: number;
  teamMembers?: number;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'organizations') {
        const maybeSingle = vi.fn().mockResolvedValue({ data: organization });
        const eq = vi.fn().mockReturnValue({ maybeSingle });
        const select = vi.fn().mockReturnValue({ eq });
        return { select };
      }

      if (table === 'assignments') {
        const eqStatus = vi.fn().mockResolvedValue({ count: activeAssignments });
        const eqOrgId = vi.fn().mockReturnValue({ eq: eqStatus });
        const select = vi.fn().mockReturnValue({ eq: eqOrgId });
        return { select };
      }

      if (table === 'organization_members') {
        const eqStatus = vi.fn().mockResolvedValue({ count: teamMembers });
        const eqOrgId = vi.fn().mockReturnValue({ eq: eqStatus });
        const select = vi.fn().mockReturnValue({ eq: eqOrgId });
        return { select };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe('Organization public portfolio page', () => {
  it('renders public org content with return-to-menu link when returnTo is safe', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        organization: {
          id: 'org-1',
          slug: 'acme',
          display_name: 'Acme',
          tagline: 'Build trust',
          mission: 'Ship impact',
          website: 'https://acme.org/',
          type: 'company',
          values: [{ label: 'Transparency' }],
          causes: ['Climate'],
          verified: true,
        },
      }) as any
    );

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
      searchParams: Promise.resolve({ returnTo: '/app/o/acme/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Acme' })).toBeInTheDocument();
    expect(screen.getByText(/public organization portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/trust summary/i)).toBeInTheDocument();
    expect(screen.getByText(/mission/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
  });

  it('falls back to return-home link when returnTo is unsafe', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        organization: {
          id: 'org-1',
          slug: 'acme',
          display_name: 'Acme',
          tagline: null,
          mission: null,
          website: null,
          type: null,
          values: [],
          causes: [],
          verified: false,
        },
      }) as any
    );

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
      searchParams: Promise.resolve({ returnTo: '/portfolio/org/acme' }),
    });

    render(element);

    expect(screen.getByRole('link', { name: /return home/i })).toHaveAttribute('href', '/');
  });

  it('calls notFound when slug has no public portfolio', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        organization: null,
      }) as any
    );

    await expect(
      OrganizationPortfolioPublicPage({ params: Promise.resolve({ slug: 'missing' }) })
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
