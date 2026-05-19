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
  title: 'Proofound | Proof Behind the Claim',
  description:
    'Proofound turns real work into blind-safe, proof-backed, privacy-aware hiring signal built around outcomes, evidence, verification, and clearer fit.',
  keywords: [
    'Proofound',
    'evidence based hiring',
    'proof based hiring',
    'verified proof portfolio',
    'blind-safe hiring',
    'privacy safe hiring',
    'structured hiring signal',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound | Proof Behind the Claim',
    description:
      'Replace weak CV signal with structured outcomes, proof artifacts, verification, privacy-safe presentation, and clearer work-to-proof comparison.',
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
    title: 'Proofound | Proof Behind the Claim',
    description:
      'A calmer, proof-first homepage for evidence-based hiring and modern work-to-proof matching.',
    images: [`${siteUrl}/hero-visual.jpg`],
  },
};

export default function Home() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/',
    title: 'Proofound | Proof Behind the Claim',
    description:
      'Proofound is a proof-first hiring corridor that replaces weak CV signal with structured outcomes, evidence, verification, and privacy-safe fit.',
  });

  // Auth check disabled for debugging/verification of landing page
  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="home-jsonld" />
      <ProofoundLanding />
    </>
  );
}
