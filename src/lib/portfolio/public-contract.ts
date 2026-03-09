import type { Metadata } from 'next';

import type { PublicPortfolioState } from '@/lib/portfolio/slug-policy';

type EffectiveStateOptions = {
  requestedState: PublicPortfolioState | null | undefined;
  searchIndexingEnabled: boolean;
  minimumContentMet: boolean;
  redactMode?: boolean | null;
  hasLinkOnlyContent?: boolean;
  hasRevealGatedContent?: boolean;
};

export const INDEX_VISIBLE_LEVELS = new Set(['public', 'public_indexable']);

export function resolveRequestedPublicPortfolioState(
  value: string | null | undefined
): PublicPortfolioState {
  switch (value) {
    case 'public_link_only':
    case 'public_noindex':
    case 'public_indexable':
    case 'unavailable':
      return value;
    default:
      return 'unavailable';
  }
}

export function isVisibleOnPublicPage(level: string | null | undefined): boolean {
  if (!level) return false;
  return level === 'public';
}

export function isSearchSafePublicLevel(level: string | null | undefined): boolean {
  if (!level) return false;
  return INDEX_VISIBLE_LEVELS.has(level);
}

export function deriveEffectivePublicPortfolioState({
  requestedState,
  searchIndexingEnabled,
  minimumContentMet,
  redactMode = false,
  hasLinkOnlyContent = false,
  hasRevealGatedContent = false,
}: EffectiveStateOptions): PublicPortfolioState {
  const requested = resolveRequestedPublicPortfolioState(requestedState);

  if (!minimumContentMet || requested === 'unavailable') {
    return 'unavailable';
  }

  if (requested === 'public_link_only') {
    return 'public_link_only';
  }

  if (requested === 'public_noindex') {
    return 'public_noindex';
  }

  if (!searchIndexingEnabled || redactMode || hasLinkOnlyContent || hasRevealGatedContent) {
    return 'public_noindex';
  }

  return 'public_indexable';
}

export function isAccessiblePublicPortfolioState(state: PublicPortfolioState): boolean {
  return state !== 'unavailable';
}

export function isIndexablePublicPortfolioState(state: PublicPortfolioState): boolean {
  return state === 'public_indexable';
}

export function buildPortfolioRobots(state: PublicPortfolioState): NonNullable<Metadata['robots']> {
  if (state === 'public_indexable') {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
      },
    };
  }

  return {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  };
}

export function shouldUseGenericSharePreview(state: PublicPortfolioState): boolean {
  return state !== 'public_indexable';
}
