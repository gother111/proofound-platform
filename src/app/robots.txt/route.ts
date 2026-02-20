function getSiteUrl(): string {
  const fallbackUrl = 'https://proofound.io';
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || fallbackUrl;
  const normalized = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  try {
    return new URL(normalized).toString().replace(/\/$/, '');
  } catch {
    return fallbackUrl;
  }
}

export const runtime = 'edge';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /o/
Sitemap: ${getSiteUrl()}/sitemap.xml
`;

  return new Response(robotsTxt, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
