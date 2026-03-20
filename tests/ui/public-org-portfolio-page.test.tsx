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
    verifiedDomainPath: 'acme.org',
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
      type: 'company',
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
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'organization_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/org/acme',
      organization: {
        id: 'org-1',
        slug: 'acme',
        displayName: 'Acme',
        verifiedDomainPath: 'acme.org',
        mission: 'Ship impact',
        whyWorkMatters: 'Build trust',
        operatingContext: 'Small distributed team across Europe with weekly async check-ins.',
        website: 'https://acme.org/',
        verified: true,
      },
      assignmentSnapshot: {
        role: 'Proof-first product designer',
        engagementType: 'full_time',
        businessValue: 'Own the assignment review loop and tighten decision quality.',
        description: 'Clarify what work is expected and keep the team aligned on delivery.',
        expectedImpact: 'Proof should show delivery, ownership, and tradeoff reasoning.',
        outcomes: ['Improve assignment clarity', 'Reduce vague review decisions'],
      },
    },
    assignmentSnapshot: {
      role: 'Proof-first product designer',
      engagementType: 'full_time',
      businessValue: 'Own the assignment review loop and tighten decision quality.',
      description: 'Clarify what work is expected and keep the team aligned on delivery.',
      expectedImpact: 'Proof should show delivery, ownership, and tradeoff reasoning.',
      outcomes: ['Improve assignment clarity', 'Reduce vague review decisions'],
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
    expect(screen.getByRole('heading', { name: /mission \/ purpose/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what work is offered/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /assignment clarity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /seriousness of review/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /trust basics/i })).toBeInTheDocument();
    expect(screen.getByText('acme.org')).toBeInTheDocument();
    expect(screen.getByText(/proof-first product designer/i)).toBeInTheDocument();
    expect(screen.getByText(/own the assignment review loop/i)).toBeInTheDocument();
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
          type: 'company',
        },
        assignmentSnapshot: null,
        exportData: {
          ...buildProjection().exportData,
          assignmentSnapshot: undefined,
          organization: {
            id: 'org-1',
            slug: 'acme',
            displayName: 'Acme',
            verifiedDomainPath: undefined,
            mission: undefined,
            whyWorkMatters: 'Build trust',
            operatingContext: undefined,
            website: 'https://acme.org/',
            verified: false,
          },
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
    expect(
      screen.getByText(/assignment detail will appear here once the organization publishes it/i)
    ).toBeInTheDocument();
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

  it('returns page-specific metadata when indexing is explicitly enabled', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection({
        effectiveState: 'public_indexable',
        metadata: {
          path: '/portfolio/org/acme',
          title: 'Acme Labs | Proofound',
          description: 'Mission-driven proof corridor.',
          ogTitle: 'Acme Labs on Proofound',
          ogDescription: 'Mission-driven proof corridor.',
          useGenericPreview: false,
        },
      }) as any
    );

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'acme' }),
    });

    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.title).toBe('Acme Labs | Proofound');
    expect(metadata.openGraph?.title).toBe('Acme Labs on Proofound');
  });

  it('calls notFound when slug has no public portfolio', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(null);

    await expect(
      OrganizationPortfolioPublicPage({ params: Promise.resolve({ slug: 'missing' }) })
    ).rejects.toThrow('NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
