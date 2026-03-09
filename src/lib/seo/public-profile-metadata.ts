import type { Metadata } from 'next';
import { buildPublicMetadata } from '@/lib/seo/public-metadata';

type PublicProfileMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogTitle?: string;
  ogDescription?: string;
  imagePath?: string;
  imageAlt?: string;
  ogType?: 'website' | 'profile';
  robots?: Metadata['robots'];
};

function normalizePath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  return withLeadingSlash.replace(/\/{2,}/g, '/');
}

export function buildPublicProfileMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  imagePath,
  imageAlt,
  ogType,
  robots,
}: PublicProfileMetadataInput): Metadata {
  return buildPublicMetadata({
    title,
    description,
    path: normalizePath(path),
    ogTitle,
    ogDescription,
    imagePath,
    imageAlt,
    ogType,
    robots,
  });
}

export function buildUnavailablePublicProfileMetadata(path: string): Metadata {
  return buildPublicProfileMetadata({
    title: 'Public Profile Unavailable | Proofound',
    description:
      'This public profile link is unavailable. It may be expired, hidden, or no longer active.',
    path,
    ogTitle: 'Public Profile Unavailable',
    ogDescription:
      'This public profile link is unavailable. Ask the owner to share a new Proofound link.',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  });
}
