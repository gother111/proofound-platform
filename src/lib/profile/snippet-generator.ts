/**
 * Public Page share helpers
 *
 * Generates launch-safe Public Page URLs, embeds, and outreach copy
 * PRD Reference: Part 2 F2 - Data Portability & Public Sharing
 */

const CANONICAL_PUBLIC_SITE_HOST = 'proofound.io';
const LEGACY_PUBLIC_SITE_HOSTS = new Set(['proofound.com', 'www.proofound.com']);

function normalizePublicSiteUrl(rawUrl: string | null | undefined): string {
  const fallback = `https://${CANONICAL_PUBLIC_SITE_HOST}`;
  const trimmed = rawUrl?.trim();

  if (!trimmed) {
    return fallback;
  }

  const withScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    const normalized = new URL(parsed.origin);
    const hostname = normalized.hostname.toLowerCase();

    if (LEGACY_PUBLIC_SITE_HOSTS.has(hostname)) {
      normalized.hostname = CANONICAL_PUBLIC_SITE_HOST;
    }

    return normalized.origin.replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

export function resolvePublicSiteBaseUrl(): string {
  return normalizePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

export function buildPublicEmbedURLFromPublicPageURL(publicPageUrl: string): string {
  const trimmed = publicPageUrl.trim().replace(/\/+$/, '');
  return `${trimmed}/embed`;
}

/**
 * Generate embeddable HTML from a launch Public Page URL.
 */
export function generateEmbedCodeFromUrl(
  publicPageUrl: string,
  format: 'card' | 'mini' | 'full' = 'card',
  width: number = 400
): string {
  const embedURL = buildPublicEmbedURLFromPublicPageURL(publicPageUrl);

  const heights = {
    mini: 120,
    card: 300,
    full: 600,
  };

  const height = heights[format] || 300;

  return `<iframe 
  src="${embedURL}?format=${format}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  style="border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
  title="Proofound Profile">
</iframe>`;
}

/**
 * Generate plain outreach copy for a Proofound public page.
 */
export function generateShareText(profile: { name: string; headline?: string }): {
  outreach: string;
  generic: string;
} {
  const genericText = `Review ${profile.name}'s proof-backed Public Page on Proofound`;
  const withHeadline = profile.headline ? `${genericText} - ${profile.headline}` : genericText;

  return {
    outreach: withHeadline,
    generic: withHeadline,
  };
}
