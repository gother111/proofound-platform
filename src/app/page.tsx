import { JsonLdScripts } from '@/components/seo/JsonLdScripts';
import { ProofoundLanding } from '@/components/ProofoundLanding';
import type { Metadata } from 'next';
import { buildStaticPageJsonLd } from '@/lib/seo/json-ld';
import {
  PROOFOUND_HOME_DESCRIPTION,
  PROOFOUND_HOME_OG_DESCRIPTION,
  PROOFOUND_HOME_TITLE,
} from '@/lib/seo/public-metadata';

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
  title: PROOFOUND_HOME_TITLE,
  description: PROOFOUND_HOME_DESCRIPTION,
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
    title: PROOFOUND_HOME_TITLE,
    description: PROOFOUND_HOME_OG_DESCRIPTION,
    url: siteUrl,
    siteName: 'Proofound',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/hero-visual.jpg`,
        width: 1200,
        height: 630,
        alt: 'Proofound verified proof hiring landing page',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PROOFOUND_HOME_TITLE,
    description: PROOFOUND_HOME_OG_DESCRIPTION,
    images: [`${siteUrl}/hero-visual.jpg`],
  },
};

export default function Home() {
  const jsonLdItems = buildStaticPageJsonLd({
    path: '/',
    title: PROOFOUND_HOME_TITLE,
    description: PROOFOUND_HOME_DESCRIPTION,
  });

  return (
    <>
      <JsonLdScripts items={jsonLdItems} idPrefix="home-jsonld" />
      <ProofoundLanding />
    </>
  );
}
