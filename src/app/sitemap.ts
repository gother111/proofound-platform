import type { MetadataRoute } from 'next';

function getBaseUrl(): string {
  // Prefer explicit site url, then Vercel deployment url, then production default.
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`.replace(/\/+$/, '');

  return 'https://proofound.io';
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const lastModified = new Date();

  const routes = [
    '/',
    '/login',
    '/signup',
    '/about',
    '/manifesto',
    '/careers',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
  ];

  return routes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified,
  }));
}
