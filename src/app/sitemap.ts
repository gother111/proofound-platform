import type { MetadataRoute } from 'next';
import { sql } from 'drizzle-orm';

import { db } from '@/db';
import { getRows } from '@/lib/db/rows';
import { isSchemaCompatibilityError } from '@/lib/db/schemaCompatibility';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

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

async function fetchPortfolioSitemapRows(): Promise<{
  individualRows: SitemapSlugRow[];
  organizationRows: SitemapSlugRow[];
}> {
  try {
    const [organizationRowsResult] = await Promise.all([
      db.execute(sql`
        SELECT o.slug, o.updated_at
        FROM organizations o
        INNER JOIN portfolio_publication_states s
          ON s.subject_type = 'organization'
         AND s.subject_id = o.id
        WHERE o.slug IS NOT NULL
          AND s.sitemap_state = 'included'
      `),
    ]);

    return {
      individualRows: [],
      organizationRows: getRows<SitemapSlugRow>(organizationRowsResult as any),
    };
  } catch (error) {
    if (
      isSchemaCompatibilityError(error, {
        columns: ['public_portfolio_state', 'sitemap_state'],
        relations: ['profiles', 'organizations', 'portfolio_publication_states'],
      })
    ) {
      log.warn('seo.sitemap.schema_compatibility_fallback', {
        code:
          error && typeof error === 'object' && 'code' in error
            ? String((error as { code?: string | number }).code ?? '')
            : undefined,
      });

      return {
        individualRows: [],
        organizationRows: [],
      };
    }

    throw error;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const urls = [
    '/',
    '/login',
    '/auth/login',
    '/signup',
    '/signup/individual',
    '/signup/organization',
    '/reset-password',
    '/reset-password/confirm',
    '/verify-email',
    '/onboarding',
    '/accept-invite',
    '/verify-work-email',
    '/privacy',
    '/terms',
    '/cookies',
    '/cookies/settings',
  ];

  const { individualRows, organizationRows } = await fetchPortfolioSitemapRows();

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
