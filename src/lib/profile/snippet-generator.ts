/**
 * Public Profile Snippet Generator
 *
 * Generates shareable profile snippets with privacy controls
 * PRD Reference: Part 2 F2 - Data Portability & Public Sharing
 */

import { nanoid } from 'nanoid';

const CANONICAL_SNIPPET_HOST = 'proofound.io';
const LEGACY_SNIPPET_HOSTS = new Set(['proofound.com', 'www.proofound.com']);

export type SnippetFields = Record<string, boolean | number | null | undefined>;

export interface ProfileSnippet {
  id: string;
  userId: string;
  shareToken: string; // Unique token for public access
  expiresAt?: Date;
  fields: SnippetFields;
  theme: 'light' | 'dark' | 'auto';
  format: 'card' | 'mini' | 'full';
  createdAt: Date;
}

/**
 * Generate a new share token
 */
export function generateShareToken(): string {
  return nanoid(16); // 16-character random string
}

function normalizePublicSiteUrl(rawUrl: string | null | undefined): string {
  const fallback = `https://${CANONICAL_SNIPPET_HOST}`;
  const trimmed = rawUrl?.trim();

  if (!trimmed) {
    return fallback;
  }

  const withScheme = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    const normalized = new URL(parsed.origin);
    const hostname = normalized.hostname.toLowerCase();

    if (LEGACY_SNIPPET_HOSTS.has(hostname)) {
      normalized.hostname = CANONICAL_SNIPPET_HOST;
    }

    return normalized.origin.replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

export function resolvePublicSnippetBaseUrl(): string {
  return normalizePublicSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

/**
 * Build public profile URL
 */
export function buildPublicProfileURL(shareToken: string): string {
  const baseURL = resolvePublicSnippetBaseUrl();
  const safeToken = encodeURIComponent(shareToken.trim());
  return `${baseURL}/p/${safeToken}`;
}

export function buildPublicEmbedURLFromProfileURL(profileUrl: string): string {
  const trimmed = profileUrl.trim().replace(/\/+$/, '');
  return `${trimmed}/embed`;
}

/**
 * Generate embeddable HTML snippet
 */
export function generateEmbedCode(
  shareToken: string,
  format: 'card' | 'mini' | 'full' = 'card',
  width: number = 400
): string {
  const url = buildPublicProfileURL(shareToken);
  return generateEmbedCodeFromUrl(url, format, width);
}

/**
 * Generate embeddable HTML snippet from a full profile URL
 */
export function generateEmbedCodeFromUrl(
  profileUrl: string,
  format: 'card' | 'mini' | 'full' = 'card',
  width: number = 400
): string {
  const embedURL = buildPublicEmbedURLFromProfileURL(profileUrl);

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
 * Generate social media share text
 */
export function generateShareText(profile: { name: string; headline?: string }): {
  twitter: string;
  linkedin: string;
  generic: string;
} {
  const genericText = `Check out ${profile.name}'s professional profile on Proofound`;
  const withHeadline = profile.headline ? `${genericText} - ${profile.headline}` : genericText;

  return {
    twitter: withHeadline.slice(0, 280), // Twitter character limit
    linkedin: withHeadline,
    generic: withHeadline,
  };
}

/**
 * Validate snippet configuration
 */
export function validateSnippetConfig(fields: SnippetFields): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Must have at least one field enabled
  const hasAnyField = Object.values(fields).some((value) => value === true);
  if (!hasAnyField) {
    errors.push('At least one field must be enabled');
  }

  // If skills enabled, topSkills should be reasonable
  if (fields.skills === true && typeof fields.topSkills === 'number') {
    if (fields.topSkills < 1 || fields.topSkills > 20) {
      errors.push('Top skills must be between 1 and 20');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get snippet analytics (view count, last accessed, etc.)
 */
export interface SnippetAnalytics {
  views: number;
  uniqueVisitors: number;
  lastViewedAt?: Date;
  referrers: Array<{
    source: string;
    count: number;
  }>;
}
