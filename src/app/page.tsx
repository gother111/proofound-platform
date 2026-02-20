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
  title: 'Proofound | Credibility Infrastructure for Verified Professional Matching',
  description:
    'Proofound is a credibility and verification platform for professionals and organizations that need evidence-based matching and trustworthy reputation signals.',
  keywords: [
    'Proofound',
    'credibility platform',
    'verified professional profile',
    'evidence based matching',
    'trustworthy hiring platform',
    'professional verification',
    'mission aligned opportunities',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound | Credibility Infrastructure for Verified Professional Matching',
    description:
      'Build a profile backed by evidence, not vanity metrics. Match with professionals and organizations using transparent credibility signals.',
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
    title: 'Proofound | Credibility Infrastructure',
    description:
      'Evidence-based profiles and transparent professional matching for individuals and organizations.',
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
      'Proofound is a credibility and connection platform built for authenticity, evidence-based verification, and mission-aligned matching.',
  };

  const webSiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Proofound',
    url: siteUrl,
    description:
      'Evidence-based professional matching and verification for individuals and organizations.',
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
      'Build a profile backed by evidence, not vanity metrics. Match with individuals and organizations that share your mission.',
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
