import type { Metadata } from 'next';

const FALLBACK_SITE_URL = 'https://proofound.io';
const DEFAULT_OG_IMAGE = '/hero-visual.jpg';

export const PROOFOUND_HOME_TITLE = 'Proofound | Verified proof, not CV noise';
export const PROOFOUND_HOME_DESCRIPTION =
  'Hire and get hired through verified proof, not CV noise. Proofound helps people create proof profiles and helps organizations screen on real work.';
export const PROOFOUND_HOME_OG_DESCRIPTION =
  'Replace weak CV signal with proof profiles, privacy-safe evidence, and clearer screening for individuals and organizations.';

export function getPublicSiteUrl(): string {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || FALLBACK_SITE_URL;
  const normalized = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  try {
    return new URL(normalized).toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_SITE_URL;
  }
}

export function buildIndividualProofPortfolioTitle(displayName: string): string {
  return `${displayName} — Proof Portfolio | Proofound`;
}

export function buildIndividualProofPortfolioDescription(input: {
  displayName: string;
  headline?: string | null;
}): string {
  const headline = input.headline?.trim();
  return headline || `${input.displayName}'s proof portfolio on Proofound.`;
}

export function buildIndividualProofPortfolioOgImagePath(handle: string): string {
  return `/portfolio/${encodeURIComponent(handle)}/opengraph-image`;
}

type PublicMetadataOptions = {
  title: string;
  description: string;
  path: string;
  canonicalPath?: string | null;
  ogTitle?: string;
  ogDescription?: string;
  imagePath?: string;
  imageAlt?: string;
  ogType?: 'website' | 'profile';
  keywords?: string[];
  robots?: Metadata['robots'];
};

export function buildPublicMetadata({
  title,
  description,
  path,
  canonicalPath,
  ogTitle,
  ogDescription,
  imagePath = DEFAULT_OG_IMAGE,
  imageAlt = 'Proofound verified proof hiring preview',
  ogType = 'website',
  keywords,
  robots,
}: PublicMetadataOptions): Metadata {
  const siteUrl = getPublicSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const normalizedCanonicalPath =
    canonicalPath === undefined
      ? normalizedPath
      : canonicalPath === null
        ? null
        : canonicalPath.startsWith('/')
          ? canonicalPath
          : `/${canonicalPath}`;
  const canonicalUrl = normalizedCanonicalPath
    ? `${siteUrl}${normalizedCanonicalPath === '/' ? '' : normalizedCanonicalPath}`
    : null;
  const imageUrl = imagePath.startsWith('http') ? imagePath : `${siteUrl}${imagePath}`;

  return {
    title,
    description,
    keywords,
    robots,
    alternates: canonicalUrl
      ? {
          canonical: canonicalUrl,
        }
      : undefined,
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      url: canonicalUrl ?? `${siteUrl}${normalizedPath === '/' ? '' : normalizedPath}`,
      siteName: 'Proofound',
      type: ogType,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      images: [imageUrl],
    },
  };
}
