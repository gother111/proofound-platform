import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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

vi.mock('@/components/seo/JsonLdScripts', () => ({
  JsonLdScripts: ({ items }: { items: unknown[] }) => (
    <>
      {items.map((_, index) => (
        <script key={index} data-testid="json-ld" type="application/ld+json" />
      ))}
    </>
  ),
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
      tagline: 'This work matters because proof-first assignment review still needs trust.',
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
      description: 'Shareable organization trust page on Proofound.',
      ogTitle: 'Proofound organization portfolio',
      ogDescription: 'Shareable organization trust page on Proofound.',
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
  afterEach(() => {
    delete (navigator as Partial<Navigator>).clipboard;
  });

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
    expect(screen.getByText(/public organization trust page/i)).toBeInTheDocument();
    expect(screen.getByText('Shareable by direct link')).toBeInTheDocument();
    expect(screen.getByText('Proof-first trust page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /mission \/ purpose/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /what work is offered/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /assignment clarity/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /proof-review readiness/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /organization basics/i })).toBeInTheDocument();
    expect(screen.getByText('acme.org')).toBeInTheDocument();
    expect(screen.getByText(/proof-first product designer/i)).toBeInTheDocument();
    expect(screen.getByText(/own the assignment review loop/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this page is public trust context, not the review workspace/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/search engines are off; only people with this link can open/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/proof submissions, member details, and private review context stay inside/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /blind-by-default review stays separate from this public page until a proof-review participant consents to reveal/i
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );

    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteText,
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /copy share link/i }));

    expect(await screen.findByText('Organization trust page link copied.')).toBeInTheDocument();
    expect(clipboardWriteText).toHaveBeenCalledWith('https://proofound.io/portfolio/org/acme');

    expect(screen.queryByRole('heading', { name: /values/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /causes/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /work culture/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /projects/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /partnerships/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /goals/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/team members/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/owner@|reviewer@|member@/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/public organization profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/minimal public profile/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/minimal trust page/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /seriousness of review/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Searchable')).not.toBeInTheDocument();
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
          trust_status: 'domain_verified',
          trust_status_updated_at: '2026-05-18T00:00:00.000Z',
          website_verified_at: '2026-05-18T00:00:00.000Z',
          operating_region: null,
          verified: true,
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
      screen.getByText(/no active assignment is published on this trust page yet/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/no engagement type published yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /assignment context will appear here once the organization publishes review-ready work/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/proof expectations are not published yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/assignment detail will appear here once the organization publishes it/i)
    ).toBeInTheDocument();
  });

  it('keeps sparse long organization data readable on narrow public portfolio layouts', async () => {
    const longName =
      'Nordic Distributed Proof Operations Research Collective For Very Long Public Names';
    const longWebsite =
      'https://proof-operations-research-collective.example.com/teams/very-long-public-profile-path';

    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection({
        publicDisplayName: longName,
        publicSummary: '',
        verifiedDomainPath:
          'proof-operations-research-collective.example.com/verified/organization/domain/path',
        organization: {
          id: 'org-1',
          slug: 'acme',
          display_name: longName,
          public_portfolio_state: 'public_link_only',
          search_indexing_enabled_at: null,
          trust_status: 'pending',
          trust_status_updated_at: null,
          website_verified_at: null,
          operating_region: null,
          verified: false,
          website: longWebsite,
          tagline: null,
          mission: null,
          working_context: null,
          type: 'company',
        },
        assignmentSnapshot: null,
      }) as any
    );

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
      searchParams: Promise.resolve({ returnTo: '/app/o/acme/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: longName })).toHaveClass('break-words');
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveClass('w-full');
    expect(screen.getByRole('button', { name: /copy share link/i })).toHaveClass('w-full');
    expect(screen.getByRole('link', { name: /website/i })).toHaveClass('w-full');
    expect(screen.getByText(longWebsite)).toHaveClass('break-words');
    expect(
      screen.getByText(/a short purpose statement has not been published yet/i)
    ).toBeInTheDocument();
  });

  it('keeps member PDF export available on narrow organization portfolio layouts', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'member-1' } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 1 }),
            }),
          }),
        })),
      })),
    } as any);
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection() as any
    );

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
      searchParams: Promise.resolve({ returnTo: '/app/o/acme/home' }),
    });

    render(element);

    const downloadButton = screen.getByRole('button', { name: /download organization pdf/i });
    expect(downloadButton).toHaveClass('w-full');
    expect(downloadButton.closest('.hidden')).toBeNull();
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

  it('explains when search indexing is explicitly enabled for public organization trust pages', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(
      buildProjection({ effectiveState: 'public_indexable' }) as any
    );

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByText('Indexing allowed')).toBeInTheDocument();
    expect(
      screen.getByText(/search indexing is explicitly enabled for this organization trust page/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/search engines are off; only people with this link can open/i)
    ).not.toBeInTheDocument();
  });

  it('renders the generic unavailable state when slug has no public portfolio', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(null);

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'missing' }),
      searchParams: Promise.resolve({}),
    });

    const { container } = render(element);

    expect(container.querySelectorAll('main')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Organization trust page unavailable' })
    ).toBeInTheDocument();
    expect(screen.getByText(/this organization link is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No organization trust details were shown from this link/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/only load selected public-safe basics when the owner has an active/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Assignments, member details, and review context stay hidden/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ask the organization for a fresh public trust page link/i)
    ).toBeInTheDocument();
    const trustStatus = screen.getByRole('status');
    expect(trustStatus).toHaveClass('rounded-xl');
    expect(trustStatus).toHaveClass('shadow-sm');
    expect(trustStatus).not.toHaveClass('border-l-4');
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('keeps unavailable organization previews on the safe in-app return path', async () => {
    vi.mocked(getPublicOrganizationPortfolioProjectionBySlug).mockResolvedValue(null);

    const element = await OrganizationPortfolioPublicPage({
      params: Promise.resolve({ slug: 'acme' }),
      searchParams: Promise.resolve({ returnTo: '/app/o/acme/home' }),
    });

    render(element);

    expect(
      screen.getByRole('heading', { name: 'Organization trust page unavailable' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/o/acme/home'
    );
    expect(screen.queryByRole('link', { name: 'Return home' })).not.toBeInTheDocument();
    expect(
      screen.getByText(/No organization trust details were shown from this link/i)
    ).toBeInTheDocument();
  });
});
