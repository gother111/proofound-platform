// Robots.txt handler to return stable crawl rules with 200 instead of 404.
const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /o/
Sitemap: https://proofound.io/sitemap.xml
`;

export const runtime = 'edge';

export async function GET() {
  return new Response(ROBOTS_TXT, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
