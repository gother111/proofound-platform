export const PUBLIC_PORTFOLIO_STATE_VALUES = [
  'unavailable',
  'public_link_only',
  'public_noindex',
  'public_indexable',
] as const;

export type PublicPortfolioState = (typeof PUBLIC_PORTFOLIO_STATE_VALUES)[number];

const RESERVED_PUBLIC_SLUGS = new Set([
  'about',
  'admin',
  'api',
  'app',
  'auth',
  'blog',
  'careers',
  'company',
  'contact',
  'docs',
  'explore',
  'help',
  'home',
  'jobs',
  'legal',
  'login',
  'org',
  'portfolio',
  'privacy',
  'proofound',
  'robots',
  'settings',
  'share',
  'signup',
  'support',
  'terms',
  'www',
]);

export function normalizePublicSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 60);
}

export function isReservedPublicSlug(value: string): boolean {
  return RESERVED_PUBLIC_SLUGS.has(normalizePublicSlug(value));
}

export function validatePublicSlug(value: string): string | null {
  const normalized = normalizePublicSlug(value);

  if (!normalized) {
    return 'Use at least one lowercase letter or number.';
  }

  if (!/^[a-z0-9-]+$/.test(normalized)) {
    return 'Use lowercase letters, numbers, and hyphens only.';
  }

  if (isReservedPublicSlug(normalized)) {
    return 'That public link is reserved. Choose another.';
  }

  return null;
}
