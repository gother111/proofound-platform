import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
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
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
  getHistoricalPublicProfileHandleRedirect: vi.fn(),
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
  getHistoricalPublicProfileHandleRedirect,
  resolvePublicIndividualPortfolioAccessByHandle,
} from '@/lib/portfolio/public-projection';
import PortfolioPage, { generateMetadata } from '@/app/portfolio/[handle]/page';

function buildProjection(overrides: Partial<any> = {}) {
  return {
    profileId: 'user-1',
    handle: 'jane',
    requestedState: 'public_link_only',
    effectiveState: 'public_link_only',
    shareUrl: 'https://proofound.io/portfolio/jane',
    publicDisplayName: 'Jane Doe',
    publicHeadline: 'Impact builder',
    publicBio: 'I build measurable change.',
    publicSkills: ['Strategy', 'Research ops'],
    publicProofCount: 1,
    verifiedPublicProofPackCount: 1,
    traceableSummary: {
      provenanceLabel: 'Generated from public-safe proof records and context tokens',
      hasEnoughData: true,
      segments: [
        {
          key: 'scale',
          label: 'Scale',
          value: 'Company size: 11-50',
          state: 'ready',
          sources: [
            { id: 'pack-1', label: 'Product strategy proof record', detail: 'Product Strategy' },
          ],
        },
        {
          key: 'focus',
          label: 'Focus',
          value: 'Work area: Product strategy',
          state: 'ready',
          sources: [
            { id: 'pack-1', label: 'Product strategy proof record', detail: 'Product Strategy' },
          ],
        },
        {
          key: 'context',
          label: 'Context',
          value: 'Industry: Proof-first assignment review',
          state: 'ready',
          sources: [
            { id: 'pack-1', label: 'Product strategy proof record', detail: 'Product Strategy' },
          ],
        },
      ],
    },
    featuredProofs: [
      {
        id: 'proof-1',
        title: 'Verified proof item',
        role: 'Project',
        timeframe: 'Jan 15, 2026',
        outcomes: ['Delivered measurable outcomes'],
        evidence: [],
        verifiedBy: 'Evidence attested',
        proofPackHref: null,
      },
    ],
    visibility: {
      header: true,
      proofBar: true,
      workEmail: true,
      linkedin: true,
      identity: true,
      counts: true,
      skills: true,
      bio: true,
      contact: true,
    },
    individual: {
      work_email: 'jane@example.com',
    },
    signals: {
      identity: { verified: true, method: 'veriff' },
      workEmail: { verified: true },
      linkedin: { verificationStatus: 'verified', hasIdentityVerification: true },
      proofs: { count: 1 },
      verifications: { count: 1 },
      badges: [],
      activeIssues: [],
      badges: [
        {
          key: 'identity_checked',
          label: 'Identity checked',
          meaning: '',
          doesNotMean: '',
        },
      ],
      activeIssues: [],
    },
    verificationSummary: {
      publicBadges: [],
    },
    exportData: {
      schemaVersion: 'proofound.portfolio-export.v1',
      surface: 'individual_public',
      exportedAt: '2026-03-21T10:00:00.000Z',
      shareUrl: 'https://proofound.io/portfolio/jane',
      profile: {
        id: 'user-1',
        handle: 'jane',
        displayName: 'Jane Doe',
        headline: 'Impact builder',
      },
      publication: {
        requestedState: 'public_link_only',
        effectiveState: 'public_link_only',
        searchIndexingEnabled: false,
      },
      signals: {
        identity: { verified: true, method: 'veriff' },
        workEmail: { verified: true },
        linkedin: { verificationStatus: 'verified', hasIdentityVerification: true },
        proofs: { count: 1 },
        verifications: { count: 1 },
        badges: [],
        activeIssues: [],
        badges: [],
        activeIssues: [],
      },
      skills: [],
      proofPacks: [
        {
          id: 'pack-1',
          scope: 'public_safe',
          status: 'published',
          title: 'Product strategy proof record',
          summary: 'Launch evidence for Product Strategy',
          ownershipStatement: 'Owned the product strategy contribution.',
          evidenceSummary: 'Verified against a public launch memo.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this proof record.',
          freshnessState: 'fresh',
          schemaVersion: 'proof_pack/v2',
          artifactCount: 1,
          contextLabel: 'Product Strategy',
          selectedEvidence: [
            {
              title: 'Launch memo',
              href: 'https://example.com/launch-memo',
              artifactKind: 'link',
              issuedAt: '2026-02-20',
              description: 'Public launch memo',
              semanticsNote: 'Supporting evidence only, not full verification.',
            },
          ],
        },
      ],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: true,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: true,
      },
    },
    metadata: {
      path: '/portfolio/jane',
      title: 'Proofound Public Page',
      description: 'A proof snapshot shared by direct link on Proofound.',
      ogTitle: 'Proofound Public Page',
      ogDescription: 'A proof snapshot shared by direct link on Proofound.',
      useGenericPreview: true,
    },
    jsonLd: {
      description: 'I build measurable change.',
    },
    minimumContentMet: true,
    hasLinkOnlyContent: false,
    hasRevealGatedContent: false,
    ...overrides,
  };
}

describe('Public individual portfolio page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);
    vi.mocked(getHistoricalPublicProfileHandleRedirect).mockResolvedValue(null);
  });

  it('falls back to the public handle when display name is not public', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        handle: 'jane-hidden',
        publicDisplayName: 'jane-hidden',
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane-hidden' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'jane-hidden' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Jane Hidden' })).not.toBeInTheDocument();
  });

  it('renders Self-reported trust tier for accessible portfolios without accepted verification', async () => {
    const baseProjection = buildProjection();

    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        verifiedPublicProofPackCount: 0,
        signals: {
          ...baseProjection.signals,
          verifications: { count: 0 },
        },
        exportData: {
          ...baseProjection.exportData,
          signals: {
            ...baseProjection.exportData.signals,
            verifications: { count: 0 },
          },
          proofPacks: baseProjection.exportData.proofPacks.map((pack: any) => ({
            ...pack,
            verificationStatus: 'unverified',
            verificationSummary: 'No scoped verification is recorded for this proof record yet.',
            evidenceSummary: 'Public memo shared by the owner.',
          })),
        },
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getAllByText('Self-reported').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText('Verified ✓')).not.toBeInTheDocument();
  });

  it('upgrades page and proof trust tiers after accepted verification', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getAllByText('Verified ✓').length).toBeGreaterThanOrEqual(2);
  });

  it('renders public read-only view with updated sections and no owner-only details', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        publicBio: null,
        publicSkills: [],
        individual: { work_email: null },
        visibility: {
          header: true,
          proofBar: true,
          workEmail: false,
          linkedin: true,
          identity: true,
          counts: true,
          skills: false,
          bio: true,
          contact: false,
        },
        featuredProofs: [],
        exportData: {
          ...buildProjection().exportData,
          proofPacks: [],
          visibility: {
            header: true,
            proofBar: true,
            workEmail: false,
            linkedin: true,
            identity: true,
            counts: true,
            skills: false,
            bio: true,
            contact: false,
          },
        },
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/app/i/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByText('Direct-link proof snapshot')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /selected proof records/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /scale \/ focus \/ context/i })).toBeInTheDocument();
    expect(
      screen.getByText('Generated from public-safe proof records and context tokens')
    ).toBeInTheDocument();
    expect(screen.getByText('Company size: 11-50')).toBeInTheDocument();
    expect(screen.getByText('Work area: Product strategy')).toBeInTheDocument();
    expect(screen.getByText('Industry: Proof-first assignment review')).toBeInTheDocument();
    const traceableSourceLabels = screen
      .getAllByText('Product strategy proof record')
      .filter((label) => label.classList.contains('truncate'));
    expect(traceableSourceLabels).toHaveLength(3);
    traceableSourceLabels.forEach((label) => {
      expect(label.parentElement).toHaveClass('max-w-full');
      expect(label.parentElement?.parentElement?.parentElement).toHaveClass('rounded-lg');
    });
    expect(screen.queryByText('Industry: Proof-first hiring')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /proof snapshot/i })).toBeInTheDocument();
    expect(
      screen.getByText(/no selected proof records are available yet/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/contact hidden/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /selected outcomes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /skills snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact & share/i })).toBeInTheDocument();
    expect(screen.getByText(/no selected proof records are available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no public outcome summary is published yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/skills are not shared publicly on this public page/i)
    ).toBeInTheDocument();
    const introLink = screen.getByRole('link', { name: /join to request introduction/i });
    expect(introLink).toHaveAttribute(
      'href',
      '/signup/individual?next=%2Fportfolio%2Fjane&intent=contact-request'
    );
    expect(screen.getByRole('button', { name: /copy proof summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/search engines are off for the MVP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/my next challenge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mission & vision/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^request contact$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/stockholm, sweden/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return to menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return home/i })).not.toBeInTheDocument();
  });

  it('keeps public trust summary humanized when count metadata is private', async () => {
    const baseProjection = buildProjection();

    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        visibility: {
          ...baseProjection.visibility,
          counts: false,
        },
        exportData: {
          ...baseProjection.exportData,
          visibility: {
            ...baseProjection.exportData.visibility,
            counts: false,
          },
        },
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('heading', { name: /proof snapshot/i })).toBeInTheDocument();
    expect(screen.getAllByText('Identity checked').length).toBeGreaterThan(0);
    expect(screen.getByText('Public proof records')).toBeInTheDocument();
    expect(screen.queryByText('Public Proof Packs')).not.toBeInTheDocument();
  });

  it('uses specific names for public evidence links', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getAllByText('Product strategy proof record').length).toBeGreaterThan(0);
    expect(screen.getByText('Trust summary')).toBeInTheDocument();
    expect(screen.getByText('Supporting evidence')).toBeInTheDocument();
    expect(screen.queryByText('Trust Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Supporting Evidence')).not.toBeInTheDocument();
    const evidenceLink = screen.getByRole('link', { name: /open evidence/i });
    expect(evidenceLink).toHaveAttribute('href', 'https://example.com/launch-memo');
    expect(evidenceLink).toHaveClass('min-h-11');
    expect(evidenceLink).toHaveTextContent('Open evidence');
    expect(screen.queryByText(/^Open$/)).not.toBeInTheDocument();
  });

  it('keeps public portfolio contact actions touch-sized on narrow layouts', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('link', { name: /^share link$/i })).toHaveClass('min-h-11');
    expect(screen.getAllByRole('link', { name: /email public contact/i })[0]).toHaveClass(
      'min-h-11'
    );
    expect(screen.queryByRole('link', { name: /^request introduction$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^request contact$/i })).not.toBeInTheDocument();
  });

  it('keeps public empty-state actions touch-sized and keyboard visible', async () => {
    const baseProjection = buildProjection();

    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        publicProofCount: 0,
        visibility: {
          ...baseProjection.visibility,
          contact: false,
          workEmail: false,
        },
        exportData: {
          ...baseProjection.exportData,
          proofPacks: [],
        },
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    const emptyState = screen.getByText(/no selected proof records are available yet/i).parentElement;
    expect(emptyState).not.toBeNull();

    const requestIntroductionLink = within(emptyState as HTMLElement).getByRole('link', {
      name: /^join to request contact$/i,
    });
    expect(requestIntroductionLink).toHaveClass('min-h-11');
    expect(requestIntroductionLink).toHaveClass('focus-visible:ring-2');
  });

  it('renders proof trust signals and ownership as readable public-safe details', async () => {
    const baseProjection = buildProjection();
    const basePack = baseProjection.exportData.proofPacks[0];

    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        exportData: {
          ...baseProjection.exportData,
          proofPacks: [
            {
              ...basePack,
              freshnessState: 'current',
              ownershipStatement:
                'Led discovery, synthesized evidence, and facilitated the operating rhythm.',
            },
          ],
        },
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getAllByText('Verified ✓').length).toBeGreaterThan(0);
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Product Strategy')).toBeInTheDocument();
    expect(screen.getByText(/Led discovery, synthesized evidence/i)).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toContain('Verified evidence / Led discovery');
  });

  it('renders owner-safe public preview and allows return link when provided', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
      },
    } as any);
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/app/i/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/i/home'
    );
    expect(screen.getByRole('link', { name: /edit source proof records/i })).toHaveAttribute(
      'href',
      expect.stringContaining('summarySource=traceable-profile-summary')
    );
    expect(
      screen.getByRole('link', { name: /refresh from current proof records/i })
    ).toHaveAttribute('href', expect.stringContaining('summaryRefresh=traceable-profile-summary'));
    expect(screen.getByText(/public-safe proof selected by the owner/i)).toBeInTheDocument();
    expect(screen.queryByText(/search engines are off for the MVP/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage visibility/i })).toHaveAttribute(
      'href',
      '/app/i/profile?profileView=full&tab=visibility'
    );
    expect(screen.getByText(/work email/i)).toBeInTheDocument();
  });

  it('uses the owner-selected public contact instead of a platform mailbox', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    const { container } = render(element);

    expect(screen.getAllByRole('link', { name: /email public contact/i })[0]).toHaveAttribute(
      'href',
      'mailto:jane@example.com'
    );
    expect(container.querySelector('[href*="hello@proofound.io"]')).toBeNull();
  });

  it('does not widen visibility when a public proof has no safe evidence URL', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        exportData: {
          ...buildProjection().exportData,
          proofPacks: [
            {
              id: 'pack-1',
              scope: 'public_safe',
              status: 'published',
              title: 'Hidden asset proof record',
              summary: 'Internal child asset omitted',
              ownershipStatement: 'Owned the contribution.',
              evidenceSummary: null,
              outcomesSummary: 'Internal child asset omitted',
              verificationStatus: 'unverified',
              verificationSummary: 'Public-safe proof only.',
              freshnessState: 'fresh',
              schemaVersion: 'proof_pack/v2',
              artifactCount: 1,
              contextLabel: 'Project',
              selectedEvidence: [
                {
                  title: 'Hidden asset proof',
                  href: null,
                  artifactKind: 'link',
                  issuedAt: '2026-01-15',
                  description: 'Internal child asset omitted',
                  semanticsNote: 'Supporting evidence only, not full verification.',
                },
              ],
            },
          ],
        },
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getAllByText('Hidden asset proof').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Self-reported').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /open evidence/i })).not.toBeInTheDocument();
  });

  it('returns candidate-specific noindex metadata by default', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ handle: 'jane' }),
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
    expect(metadata.title).toBe('Jane Doe — Proof Portfolio | Proofound');
    expect(metadata.description).toBe('Impact builder');
    expect(metadata.openGraph?.title).toBe('Jane Doe — Proof Portfolio | Proofound');
    expect((metadata.openGraph?.images as any)?.[0]?.url).toContain(
      '/portfolio/jane/opengraph-image'
    );
    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
  });

  it('keeps noindex behavior even when stale projection data requested indexing', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        effectiveState: 'public_indexable',
        metadata: {
          path: '/portfolio/jane',
          title: 'Jane Doe | Proofound',
          description: 'Impact builder',
          ogTitle: 'Jane Doe on Proofound',
          ogDescription: 'Impact builder Explore proof-backed work.',
          useGenericPreview: false,
        },
      }) as any,
    });

    const metadata = await generateMetadata({
      params: Promise.resolve({ handle: 'jane' }),
    });

    expect(metadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
    expect(metadata.title).toBe('Jane Doe — Proof Portfolio | Proofound');
    expect(metadata.openGraph?.title).toBe('Jane Doe — Proof Portfolio | Proofound');
  });

  it('renders the existing unavailable state when the portfolio is not publicly accessible', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'unavailable',
      projection: buildProjection({
        effectiveState: 'unavailable',
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Public Page unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(screen.getByText(/this public page link is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No private profile details were shown from this link/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Public Pages only load selected public-safe proof records/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Ask the owner for a fresh Public Page link/i)).toBeInTheDocument();
    const privacyStatus = screen.getByRole('status');
    expect(privacyStatus).toHaveClass('rounded-xl');
    expect(privacyStatus).toHaveClass('shadow-sm');
    expect(privacyStatus).not.toHaveClass('border-l-4');
    expect(screen.queryByRole('heading', { name: 'Jane Doe' })).not.toBeInTheDocument();
  });

  it('renders the generic unavailable state when handle has no public portfolio', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'missing',
      projection: null,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'missing' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Public Page unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(screen.getByText(/this public page link is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No private profile details were shown from this link/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Public Pages only load selected public-safe proof records/i)
    ).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('keeps unavailable owner previews on the safe in-app return path', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'unavailable',
      projection: buildProjection({
        effectiveState: 'unavailable',
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/app/i/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Public Page unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /return to menu/i })).toHaveAttribute(
      'href',
      '/app/i/home'
    );
    expect(screen.queryByRole('link', { name: 'Return home' })).not.toBeInTheDocument();
    expect(
      screen.getByText(/No private profile details were shown from this link/i)
    ).toBeInTheDocument();
  });
});
