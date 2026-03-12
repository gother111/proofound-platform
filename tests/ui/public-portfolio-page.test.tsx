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
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
  getHistoricalPublicProfileHandleRedirect: vi.fn(),
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
      proofPacks: [],
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
      title: 'Proofound public portfolio',
      description: 'Shareable by direct link on Proofound.',
      ogTitle: 'Proofound public portfolio',
      ogDescription: 'Shareable by direct link on Proofound.',
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
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({ returnTo: '/app/i/home' }),
    });

    render(element);

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByText('Shareable by direct link')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /proof-based summary/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /featured proofs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /skills snapshot/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /contact & share/i })).toBeInTheDocument();
    expect(screen.getByText(/no public summary is published yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no public proof is available yet/i)).toBeInTheDocument();
    expect(
      screen.getByText(/skills are not shared publicly in this portfolio/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /request introduction/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy recruiter summary/i })).toBeInTheDocument();
    expect(screen.queryByText(/my next challenge/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mission & vision/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/stockholm, sweden/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return to menu/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /return home/i })).not.toBeInTheDocument();
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
    expect(screen.getByText(/search engines are off by default/i)).toBeInTheDocument();
    expect(screen.getByText(/work email/i)).toBeInTheDocument();
  });

  it('does not widen visibility when a public proof has no safe evidence URL', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection({
        featuredProofs: [
          {
            id: 'proof-1',
            title: 'Hidden asset proof',
            role: 'Project',
            timeframe: 'Jan 15, 2026',
            outcomes: ['Internal child asset omitted'],
            evidence: [],
            verifiedBy: 'Public evidence',
            proofPackHref: null,
          },
        ],
      }) as any,
    });

    const element = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });

    render(element);

    expect(screen.getByText('Hidden asset proof')).toBeInTheDocument();
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
    expect(metadata.title).toBe('Proofound public portfolio');
    expect(metadata.alternates?.canonical).toContain('/portfolio/jane');
  });

  it('returns page-specific metadata when indexing is explicitly enabled', async () => {
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
      index: true,
      follow: true,
    });
    expect(metadata.title).toBe('Jane Doe | Proofound');
    expect(metadata.openGraph?.title).toBe('Jane Doe on Proofound');
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

    expect(screen.getByRole('heading', { name: 'Portfolio unavailable' })).toBeInTheDocument();
    expect(screen.getByText(/this public portfolio link is unavailable/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Jane Doe' })).not.toBeInTheDocument();
  });

  it('calls notFound when handle has no public portfolio', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'missing',
      projection: null,
    });

    await expect(PortfolioPage({ params: Promise.resolve({ handle: 'missing' }) })).rejects.toThrow(
      'NOT_FOUND'
    );
    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
