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
    'Proofound turns real work into blind-safe Proof Packs, public-safe trust surfaces, and clearer assignment review.',
  keywords: [
    'Proofound',
    'evidence based assignment review',
    'proof based submission review',
    'verified proof portfolio',
    'blind-safe assignment review',
    'privacy safe proof review',
    'structured proof review',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Proofound | Proof Behind the Claim',
    description:
      'Replace weak CV claims with structured outcomes, proof artifacts, verification, privacy-safe presentation, and clearer assignment review.',
    url: siteUrl,
    siteName: 'Proofound',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/hero-visual.jpg`,
        width: 1200,
        height: 630,
        alt: 'Proofound proof-first assignment review landing page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proofound | Proof Behind the Claim',
    description: 'A calmer, proof-first homepage for evidence-based assignment review.',
    images: [`${siteUrl}/hero-visual.jpg`],
  },
};

export default function Home() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/',
    title: 'Proofound | Proof Behind the Claim',
    description:
      'Proofound is a proof-first assignment corridor that replaces weak CV claims with structured outcomes, evidence, verification, and privacy-safe review.',
  });

  // Auth check disabled for debugging/verification of landing page
  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="home-jsonld" />
      <ProofoundLanding />
    </>
  );
}
