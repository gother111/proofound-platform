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
  permanentRedirect: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-projection', () => ({
  getPublicOrganizationPortfolioProjectionBySlug: vi.fn(),
  getHistoricalOrganizationPublicSlugRedirect: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';
import {
  getHistoricalOrganizationPublicSlugRedirect,
  getPublicOrganizationPortfolioProjectionBySlug,
} from '@/lib/portfolio/public-projection';
import OrganizationPortfolioPublicPage, { generateMetadata } from '@/app/portfolio/org/[slug]/page';

function buildProjection(overrides: Partial<any> = {}) {
  return {
    organizationId: 'org-1',
    slug: 'acme',
    requestedState: 'public_link_only',
    effectiveState: 'public_link_only',
    shareUrl: 'https://proofound.io/portfolio/org/acme',
    publicDisplayName: 'Acme',
    publicSummary: 'Build trust',
    visibility: {
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
      verified: true,
      website: 'https://acme.org/',
      tagline: 'This work matters because trustworthy hiring is still too rare.',
      mission: 'Ship impact',
      working_context: 'Small distributed team across Europe with weekly async check-ins.',
      hiring_process_summary: 'Every assignment goes through internal review before publish.',
      type: 'company',
    },
    assignment: {
      id: 'assignment-1',
      role: 'Founding product engineer',
      business_value: 'Ship the first trustworthy shortlist',
      location_mode: 'remote',
    },
    verificationSummary: {
      publicBadges: [
        { key: 'platform_reviewed', label: 'Platform reviewed' },
        { key: 'domain_confirmed', label: 'Domain verified' },
      ],
    },
    metadata: {
      path: '/portfolio/org/acme',
      title: 'Proofound organization portfolio',
      description: 'Shareable organization trust card on Proofound.',
      ogTitle: 'Proofound organization portfolio',
      ogDescription: 'Shareable organization trust card on Proofound.',
      useGenericPreview: true,
    },
    jsonLd: {
      description: 'Build trust',
    },
    exportData: {
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        tagline: 'Build trust',
        mission: 'Ship impact',
        website: 'https://acme.org/',
        type: 'company',
        verified: true,
        values: [],
        causes: [],
      },
      metrics: {
        activeAssignments: 1,
        teamMembers: 2,
      },
    },
    minimumContentMet: true,
    ...overrides,
  };
}

describe('Organization public portfolio page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0 }),
            }),
          }),
        })),
      })),
    } as any);
    vi.mocked(getHistoricalOrganizationPublicSlugRedirect).mockResolvedValue(null);
  });

  it('renders public org content with return-to-menu link when returnTo is safe', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection() as any
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
    expect(screen.getByRole('heading', { name: /purpose/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /why the work matters/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /working context/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /hiring process clarity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /durable trust signals/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /active assignment/i })).toBeInTheDocument();
    expect(screen.getAllByText('Platform reviewed').length).toBeGreaterThan(0);
    expect(screen.getByText('Domain verified')).toBeInTheDocument();
    expect(screen.getByText('Founding product engineer')).toBeInTheDocument();
    expect(
      screen.getByText(/every assignment goes through internal review before publish/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
    expect(screen.queryByRole('heading', { name: /values/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /causes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /work culture/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /projects/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /partnerships/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /goals/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/team members/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/owner@|reviewer@|member@/i)).not.toBeInTheDocument();
  });

  it('falls back to return-home link when returnTo is unsafe', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection({
        assignment: null,
        visibility: {
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
          trust_status_updated_at: null,
          website_verified_at: null,
          operating_region: null,
          verified: false,
          website: 'https://acme.org/',
          tagline: 'Build trust',
          mission: null,
          working_context: null,
          hiring_process_summary: null,
          type: 'company',
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

  it('returns generic noindex metadata by default', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection() as any
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(metadata.title).toBe('Proofound organization portfolio');
    expect(metadata.alternates?.canonical).toContain('/portfolio/org/acme');
  });

  it('calls notFound when slug has no public portfolio', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(null);

    await expect(
      OrganizationPortfolioPublicPage({ params: Promise.resolve({ slug: 'missing' }) })
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
