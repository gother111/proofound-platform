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
  assignment = null,
  organizationVisibility = null,
  historicalSlug = null,
}: {
  organization: any;
  assignment?: any;
  organizationVisibility?: any;
  historicalSlug?: any;
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
        const maybeSingle = vi.fn().mockResolvedValue({ data: assignment });
        const limit = vi.fn().mockReturnValue({ maybeSingle });
        const order = vi.fn().mockReturnValue({ limit });
        const eqStatus = vi.fn().mockReturnValue({ order });
        const eqOrgId = vi.fn().mockReturnValue({ eq: eqStatus });
        const select = vi.fn().mockReturnValue({ eq: eqOrgId });
        return { select };
      }

      if (table === 'organization_field_visibility') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: organizationVisibility }),
            }),
          })),
        };
      }

      if (table === 'organization_slug_history') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: historicalSlug }),
            }),
          })),
        };
      }

      throw new Error(`Unexpected table ${table}`);
    }),
  };
}

describe('Organization public portfolio page', () => {
  it('renders public org content with return-to-menu link when returnTo is safe', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        assignment: {
          id: 'assignment-1',
          role: 'Founding product engineer',
          business_value: 'Ship the first trustworthy shortlist',
          location_mode: 'remote',
        },
        organizationVisibility: {
          display_name: 'public',
          mission: 'public',
        },
        organization: {
          id: 'org-1',
          slug: 'acme',
          display_name: 'Acme',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          trust_status: 'platform_reviewed',
          trust_status_updated_at: '2026-03-01T00:00:00.000Z',
          website_verified_at: '2026-03-01T00:00:00.000Z',
          operating_region: 'EU',
          tagline: 'Build trust',
          mission: 'Ship impact',
          website: 'https://acme.org/',
          type: 'company',
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
    expect(screen.getByText(/public organization trust card/i)).toBeInTheDocument();
    expect(screen.getByText('Shareable by direct link')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /trust basics/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /durable trust signals/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /active assignment/i })).toBeInTheDocument();
    expect(screen.getAllByText('Platform reviewed').length).toBeGreaterThan(0);
    expect(screen.getByText('Domain verified')).toBeInTheDocument();
    expect(screen.getByText('Founding product engineer')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
  });

  it('falls back to return-home link when returnTo is unsafe', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        assignment: null,
        organizationVisibility: {
          display_name: 'public',
          mission: 'owner_only',
        },
        organization: {
          id: 'org-1',
          slug: 'acme',
          display_name: 'Acme',
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          trust_status: 'pending',
          tagline: 'Build trust',
          mission: null,
          website: 'https://acme.org/',
          type: 'company',
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
    expect(screen.getAllByText('Build trust').length).toBeGreaterThan(0);
    expect(screen.getByText(/no active assignment yet/i)).toBeInTheDocument();
  });

  it('calls notFound when slug has no public portfolio', async () => {
    vi.mocked(createClient).mockResolvedValue(
      mockSupabaseClient({
        organization: null,
        historicalSlug: null,
      }) as any
    );

    await expect(
      OrganizationPortfolioPublicPage({ params: Promise.resolve({ slug: 'missing' }) })
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
