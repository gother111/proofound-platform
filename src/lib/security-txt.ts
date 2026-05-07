export function getSecurityTxtSiteUrl(): string {
  const fallbackUrl = 'https://proofound.io';
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || fallbackUrl;
  const normalized = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

  try {
    return new URL(normalized).toString().replace(/\/$/, '');
  } catch {
    return fallbackUrl;
  }
}

export function buildSecurityTxtBody(siteUrl = getSecurityTxtSiteUrl()): string {
  return [
    'Contact: mailto:security@proofound.io',
    'Expires: 2027-05-07T00:00:00Z',
    'Preferred-Languages: en',
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Policy: ${siteUrl}/privacy`,
    '',
  ].join('\n');
}

export const securityTxtHeaders = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
} as const;
