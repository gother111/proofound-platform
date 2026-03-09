import type { MetadataRoute } from 'next';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';

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

type SitemapSlugRow = {
  handle?: string | null;
  slug?: string | null;
  updated_at?: string | null;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const urls = [
    '/',
    '/about',
    '/manifesto',
    '/careers',
    '/contact',
    '/support',
    '/privacy',
    '/terms',
    '/cookies',
    '/cookies/settings',
  ];

  const [individualRowsResult, organizationRowsResult] = await Promise.all([
    db.execute(sql`
      SELECT handle, updated_at
      FROM profiles
      WHERE handle IS NOT NULL
        AND public_portfolio_state = 'public_indexable'
        AND deleted = false
    `),
    db.execute(sql`
      SELECT slug, updated_at
      FROM organizations
      WHERE slug IS NOT NULL
        AND public_portfolio_state = 'public_indexable'
    `),
  ]);

  const individualRows = getRows<SitemapSlugRow>(individualRowsResult as any);
  const organizationRows = getRows<SitemapSlugRow>(organizationRowsResult as any);

  const staticEntries = urls.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? ('weekly' as const) : ('monthly' as const),
    priority: path === '/' ? 1 : 0.7,
  }));

  const portfolioEntries = individualRows
    .filter((row) => typeof row.handle === 'string' && row.handle.trim().length > 0)
    .map((row) => ({
      url: `${siteUrl}/portfolio/${encodeURIComponent(row.handle as string)}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: 'weekly' as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: 0.6,
    }));

  const organizationEntries = organizationRows
    .filter((row) => typeof row.slug === 'string' && row.slug.trim().length > 0)
    .map((row) => ({
      url: `${siteUrl}/portfolio/org/${encodeURIComponent(row.slug as string)}`,
      lastModified: row.updated_at ? new Date(row.updated_at) : now,
      changeFrequency: 'weekly' as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: 0.6,
    }));

  return [...staticEntries, ...portfolioEntries, ...organizationEntries];
}
