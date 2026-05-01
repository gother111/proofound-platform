import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NOT_FOUND');
  }),
  permanentRedirect: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-projection', () => ({
  resolvePublicIndividualPortfolioAccessByHandle: vi.fn(),
  getHistoricalPublicProfileHandleRedirect: vi.fn(),
}));

vi.mock('@/lib/portfolio/pdf', () => ({
  generateTrustPdf: vi.fn(),
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

import PortfolioPage from '@/app/portfolio/[handle]/page';
import { GET as summaryGET } from '@/app/api/portfolio/public/[handle]/summary/route';
import { GET as exportGET } from '@/app/api/portfolio/public/[handle]/export/route';
import { generateTrustPdf } from '@/lib/portfolio/pdf';
import { createClient } from '@/lib/supabase/server';
import {
  getHistoricalPublicProfileHandleRedirect,
  resolvePublicIndividualPortfolioAccessByHandle,
} from '@/lib/portfolio/public-projection';

function buildProjection() {
  return {
    profileId: 'user-1',
    handle: 'jane',
    requestedState: 'public_link_only',
    effectiveState: 'public_link_only',
    shareUrl: 'https://proofound.io/portfolio/jane',
    publicDisplayName: 'Jane Doe',
    publicHeadline: 'Impact builder',
    publicBio: 'I build measurable change.',
    publicSkills: ['Strategy'],
    publicProofCount: 1,
    featuredProofs: [],
    visibility: {
      header: true,
      proofBar: true,
      workEmail: false,
      linkedin: true,
      identity: true,
      counts: true,
      skills: true,
      bio: true,
      contact: false,
    },
    individual: {
      work_email: null,
    },
    signals: {
      identity: { verified: false },
      workEmail: { verified: false },
      linkedin: { verificationStatus: 'unverified', hasIdentityVerification: false },
      proofs: { count: 1 },
      verifications: { count: 0 },
      badges: [],
      activeIssues: [],
      badges: [],
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
        identity: { verified: false },
        workEmail: { verified: false },
        linkedin: { verificationStatus: 'unverified', hasIdentityVerification: false },
        proofs: { count: 1 },
        verifications: { count: 0 },
        badges: [],
        activeIssues: [],
      },
      skills: [],
      proofPacks: [
        {
          id: 'pack-1',
          scope: 'public_safe',
          status: 'published',
          title: 'Proof Pack: Strategy delivery',
          summary: 'Structured proof for strategy delivery.',
          ownershipStatement: 'Owned the delivery scope.',
          evidenceSummary: 'Public memo reviewed.',
          outcomesSummary: 'Shipped a measurable result.',
          verificationStatus: 'verified',
          verificationSummary: 'Scoped verification supports this Proof Pack.',
          freshnessState: 'fresh',
          proofQualityScore: 0.8,
          schemaVersion: 'proof_pack/v2',
          artifactCount: 1,
          contextLabel: 'Strategy',
          selectedEvidence: [],
        },
      ],
      visibility: {
        header: true,
        proofBar: true,
        workEmail: false,
        linkedin: true,
        identity: true,
        counts: true,
        skills: true,
        bio: true,
        contact: false,
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
  };
}

describe('public portfolio access consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    } as any);
    vi.mocked(getHistoricalPublicProfileHandleRedirect).mockResolvedValue(null);
    vi.mocked(generateTrustPdf).mockResolvedValue(Buffer.from('%PDF-1.4 public-profile'));
  });

  it('keeps page, summary, and export available for an accessible public portfolio', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'accessible',
      projection: buildProjection() as any,
    });

    const page = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    const summaryResponse = await summaryGET(
      new Request('http://localhost/api/portfolio/public/jane/summary'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );
    const exportResponse = await exportGET(
      new Request('http://localhost/api/portfolio/public/jane/export'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(summaryResponse.status).toBe(200);
    expect(await summaryResponse.text()).toContain('Jane Doe');
    expect(exportResponse.status).toBe(200);
    expect(exportResponse.headers.get('content-type')).toBe('application/pdf');
  });

  it('blocks page, summary, and export together for an unavailable public portfolio', async () => {
    vi.mocked(resolvePublicIndividualPortfolioAccessByHandle).mockResolvedValue({
      status: 'unavailable',
      projection: {
        ...buildProjection(),
        effectiveState: 'unavailable',
      } as any,
    });

    const page = await PortfolioPage({
      params: Promise.resolve({ handle: 'jane' }),
      searchParams: Promise.resolve({}),
    });
    render(page);

    const summaryResponse = await summaryGET(
      new Request('http://localhost/api/portfolio/public/jane/summary'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );
    const exportResponse = await exportGET(
      new Request('http://localhost/api/portfolio/public/jane/export'),
      {
        params: Promise.resolve({ handle: 'jane' }),
      }
    );

    expect(screen.getByRole('heading', { name: 'Portfolio unavailable' })).toBeInTheDocument();
    expect(summaryResponse.status).toBe(404);
    expect(await summaryResponse.json()).toEqual({ error: 'Profile not found' });
    expect(exportResponse.status).toBe(404);
    expect(await exportResponse.json()).toEqual({ error: 'Profile not found' });
    expect(generateTrustPdf).not.toHaveBeenCalled();
  });
});
