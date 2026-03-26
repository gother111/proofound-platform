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
  title: 'Proofound | Hire through proof, not profile theater',
  description:
    'Proofound provides proof-backed, blind-by-default candidate review for teams needing stronger signal than CVs.',
  keywords: [
    'Proofound',
    'hiring',
    'Proof Packs',
    'proof-based hiring',
    'privacy-safe review',
    'blind review',
    'assignment-based hiring',
    'public proof portfolio',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound | Hire through proof, not profile theater',
    description:
      'Create clear assignments, review anonymized proof-backed candidates, and request a full reveal only when the work speaks for itself.',
    url: siteUrl,
    siteName: 'Proofound',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/hero-visual.jpg`,
        width: 1200,
        height: 630,
        alt: 'Proofound proof-first hiring corridor landing page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proofound | Hire through proof, not profile theater',
    description:
      'Create clear assignments, review anonymized proof-backed candidates, and request a full reveal only when the work speaks for itself.',
    images: [`${siteUrl}/hero-visual.jpg`],
  },
};

export default function Home() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/',
    title: 'Proofound | Hire through proof, not profile theater',
    description:
      'Create clear assignments, review anonymized proof-backed candidates, and request a full reveal only when the work speaks for itself.',
  });

  // Auth check disabled for debugging/verification of landing page
  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="home-jsonld" />
      <ProofoundLanding />
    </>
  );
}
