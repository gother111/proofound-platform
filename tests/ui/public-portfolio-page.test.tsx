import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
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
    traceableSummary: {
      provenanceLabel: 'Generated from public-safe Proof Packs and context tokens',
      hasEnoughData: true,
      segments: [
        {
          key: 'scale',
          label: 'Scale',
          value: 'Company size: 11-50',
          state: 'ready',
          sources: [
            { id: 'pack-1', label: 'Proof Pack: Product Strategy', detail: 'Product Strategy' },
          ],
        },
        {
          key: 'focus',
          label: 'Focus',
          value: 'Work area: Product strategy',
          state: 'ready',
          sources: [
            { id: 'pack-1', label: 'Proof Pack: Product Strategy', detail: 'Product Strategy' },
          ],
        },
        {
          key: 'context',
          label: 'Context',
          value: 'Industry: Proof-first assignment review',
          state: 'ready',
          sources: [
            { id: 'pack-1', label: 'Proof Pack: Product Strategy', detail: 'Product Strategy' },
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
          title: 'Proof Pack: Product Strategy',
          summary: 'Launch evidence for Product Strategy',
          ownershipStatement: 'Owned the product strategy contribution.',
          evidenceSummary: 'Verified against a public launch memo.',
          outcomesSummary: 'Shipped the MVP in two weeks.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this Proof Pack.',
          freshnessState: 'fresh',
          proofQualityScore: 0.8,
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
    expect(screen.getByRole('heading', { name: /selected proof packs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /scale \/ focus \/ context/i })).toBeInTheDocument();
    expect(
      screen.getByText('Generated from public-safe Proof Packs and context tokens')
    ).toBeInTheDocument();
    expect(screen.getByText('Company size: 11-50')).toBeInTheDocument();
    expect(screen.getByText('Work area: Product strategy')).toBeInTheDocument();
    expect(screen.getByText('Industry: Proof-first assignment review')).toBeInTheDocument();
    expect(screen.queryByText('Industry: Proof-first hiring')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /proof snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /selected outcomes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /skills snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact & share/i })).toBeInTheDocument();
    expect(screen.getByText(/no selected proof packs are available yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no public outcome summary is published yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/skills are not shared publicly on this public page/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request introduction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy share link/i }).closest('.hidden')).toBeNull();
    expect(
      screen.getByRole('button', { name: /download trust pdf/i }).closest('.hidden')
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /copy proof summary/i }).closest('.hidden')
    ).toBeNull();
    expect(
      screen.getByText(/export and copy actions use only this page's public-safe details/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /copy recruiter summary/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/wider screens/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/my next challenge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mission & vision/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stockholm, sweden/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return to menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return home/i })).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: /show details/i }));

    expect(screen.getByRole('link', { name: /open launch memo/i })).toHaveAttribute(
      'href',
      'https://example.com/launch-memo'
    );
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
    expect(screen.getByRole('link', { name: /edit source proof packs/i })).toHaveAttribute(
      'href',
      expect.stringContaining('summarySource=traceable-profile-summary')
    );
    expect(screen.getByRole('link', { name: /refresh from current proof packs/i })).toHaveAttribute(
      'href',
      expect.stringContaining('summaryRefresh=traceable-profile-summary')
    );
    expect(screen.getByText(/search engines are off until the owner opts in/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /manage visibility/i })).toHaveAttribute(
      'href',
      '/app/i/profile?profileView=full&tab=visibility'
    );
    expect(screen.getByText(/work email/i)).toBeInTheDocument();
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
              title: 'Proof Pack: Hidden asset proof',
              summary: 'Internal child asset omitted',
              ownershipStatement: 'Owned the contribution.',
              evidenceSummary: null,
              outcomesSummary: 'Internal child asset omitted',
              verificationStatus: 'unverified',
              verificationSummary: 'Public-safe proof only.',
              freshnessState: 'fresh',
              proofQualityScore: null,
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

    fireEvent.click(screen.getByRole('button', { name: /show details/i }));

    expect(screen.getAllByText('Hidden asset proof').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /open evidence/i })).not.toBeInTheDocument();
  });

  it('returns generic noindex metadata by default', async () => {
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
    expect(metadata.title).toBe('Proofound Public Page');
    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
  });

  it('returns safe generic metadata even when stale projection data requested indexing', async () => {
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
    expect(metadata.title).toBe('Proofound Public Page');
    expect(metadata.openGraph?.title).toBe('Proofound Public Page');
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

    expect(screen.getByRole('heading', { name: 'Public page unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(screen.getByText(/this public page link is unavailable/i)).toBeInTheDocument();
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

    expect(screen.getByRole('heading', { name: 'Public page unavailable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/');
    expect(screen.getByText(/this public page link is unavailable/i)).toBeInTheDocument();
    expect(notFoundMock).not.toHaveBeenCalled();
  });
});
