import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { ProofoundLanding } from '@/components/ProofoundLanding';
import type { Metadata } from 'next';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';

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
  title: 'Proofound | Proof-Backed Review, Stronger Signal Than CVs',
  description:
    'Proofound helps people publish a public proof portfolio on day one and helps organizations review stronger signal than CVs through blind-by-default review and candidate-consented reveal.',
  keywords: [
    'Proofound',
    'proof-backed review',
    'Proof Pack',
    'blind-by-default review',
    'consented reveal',
    'proof portfolio',
    'stronger signal than CVs',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound | Proof-Backed Review, Blind by Default',
    description:
      'Add proof into a Proof Pack, publish a public proof portfolio on day one, and let organizations review stronger signal than CVs before any consented identity reveal.',
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
    title: 'Proofound | Proof-Backed Review',
    description:
      'Public proof portfolio on day one. Blind-by-default review. Identity-bearing reveal only with candidate consent.',
    images: [`${siteUrl}/hero-visual.jpg`],
  },
};

export default function Home() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/',
    title: 'Proofound | Proof-Backed Review, Stronger Signal Than CVs',
    description:
      'Build a public proof portfolio on day one and move into blind-by-default, proof-backed review with candidate-consented reveal.',
  });

  // Auth check disabled for debugging/verification of landing page
  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="home-jsonld" />
      <ProofoundLanding />
    </>
  );
}
