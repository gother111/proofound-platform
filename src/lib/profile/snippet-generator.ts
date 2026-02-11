/**
 * Public Profile Snippet Generator
 *
 * Generates shareable profile snippets with privacy controls
 * PRD Reference: Part 2 F2 - Data Portability & Public Sharing
 */

import { nanoid } from 'nanoid';

const PRODUCTION_SITE_URL = 'https://proofound.io';

export interface ProfileSnippet {
  id: string;
  userId: string;
  shareToken: string; // Unique token for public access
  expiresAt?: Date;
  fields: {
    name: boolean;
    headline: boolean;
    bio: boolean;
    skills: boolean;
    topSkills?: number; // Number of top skills to show
    experience: boolean;
    education: boolean;
    location: boolean;
    profileImage: boolean;
    values: boolean;
    causes: boolean;
  };
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

/**
 * Build public profile URL
 */
export function buildPublicProfileURL(shareToken: string): string {
  const baseURL = resolvePublicProfileBaseURL();
  return `${baseURL}/p/${shareToken}`;
}

/**
 * Resolve the canonical base URL for public profile sharing.
 *
 * Source order:
 * 1) NEXT_PUBLIC_SITE_URL
 * 2) SITE_URL
 * 3) Localhost fallback (non-production only)
 * 4) Locked production fallback
 */
export function resolvePublicProfileBaseURL(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim();

  if (candidate) {
    try {
      return new URL(candidate).origin.replace(/\/$/, '');
    } catch {
      // Invalid URL config should not break snippet generation in the client.
    }
  }

  const isProduction =
    process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';

  if (!isProduction) {
    return 'http://localhost:3000';
  }

  return PRODUCTION_SITE_URL;
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
  const embedURL = `${url}/embed`;

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
export function validateSnippetConfig(fields: ProfileSnippet['fields']): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Must have at least one field enabled
  const hasAnyField = Object.values(fields).some((v) => v === true);
  if (!hasAnyField) {
    errors.push('At least one field must be enabled');
  }

  // If skills enabled, topSkills should be reasonable
  if (fields.skills && fields.topSkills !== undefined) {
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
