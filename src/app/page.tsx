import { ProofoundLanding } from '@/components/ProofoundLanding';
import type { Metadata } from 'next';

const FALLBACK_SITE_URL = 'https://proofound.io';

function getSiteUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || FALLBACK_SITE_URL;
  const normalized = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  try {
    return new URL(normalized).toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'Proofound | Publish a Public Proof Portfolio on Day 1',
  description:
    'Proofound helps individuals and organizations publish a clean public proof portfolio link on day 1, then grow into matching and collaboration workflows.',
  keywords: [
    'Proofound',
    'public portfolio',
    'proof-based portfolio',
    'verified profile',
    'professional credibility',
    'organization portfolio',
    'evidence based matching',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound | Public Proof Portfolio, Ready to Share',
    description:
      'Create a clean proof-based public portfolio link on day 1. Matching stays available as a secondary benefit as your profile grows.',
    url: siteUrl,
    siteName: 'Proofound',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/hero-visual.jpg`,
        width: 1200,
        height: 630,
        alt: 'Proofound credibility platform landing page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proofound | Public Proof Portfolio',
    description:
      'Publish a clean public proof portfolio link today, then unlock matching and collaboration.',
    images: [`${siteUrl}/hero-visual.jpg`],
  },
};

export default function Home() {
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Proofound',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [],
    description:
      'Proofound is a credibility platform built for public proof portfolios first, with matching and collaboration layered on after.',
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Proofound',
    url: siteUrl,
    description:
      'Public proof portfolios for individuals and organizations, with matching and collaboration workflows.',
  };

  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Proofound',
    url: `${siteUrl}/`,
    isPartOf: {
      '@type': 'WebSite',
      url: siteUrl,
      name: 'Proofound',
    },
    description:
      'Build and share a clean proof-based public portfolio link on day 1, then use matching and workflows as you scale.',
  };

  // Auth check disabled for debugging/verification of landing page
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <ProofoundLanding />
    </>
  );
}
