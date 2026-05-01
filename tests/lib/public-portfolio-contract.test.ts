import { describe, expect, it } from 'vitest';

import {
  buildPortfolioRobots,
  deriveEffectivePublicPortfolioState,
} from '@/lib/portfolio/public-contract';

describe('public portfolio publication contract', () => {
  it('keeps the default direct-link pilot state noindex', () => {
    const state = deriveEffectivePublicPortfolioState({
      requestedState: 'public_link_only',
      searchIndexingEnabled: false,
      minimumContentMet: true,
    });

    expect(state).toBe('public_link_only');
    expect(buildPortfolioRobots(state)).toMatchObject({
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    });
  });

  it('allows indexing only when explicitly requested and safely eligible', () => {
    expect(
      deriveEffectivePublicPortfolioState({
        requestedState: 'public_indexable',
        searchIndexingEnabled: true,
        minimumContentMet: true,
      })
    ).toBe('public_indexable');

    expect(
      deriveEffectivePublicPortfolioState({
        requestedState: 'public_indexable',
        searchIndexingEnabled: false,
        minimumContentMet: true,
      })
    ).toBe('public_noindex');

    expect(
      deriveEffectivePublicPortfolioState({
        requestedState: 'public_noindex',
        searchIndexingEnabled: true,
        minimumContentMet: true,
      })
    ).toBe('public_noindex');
  });

  it('downgrades search indexing when any selected proof content is not public-safe', () => {
    const base = {
      requestedState: 'public_indexable' as const,
      searchIndexingEnabled: true,
      minimumContentMet: true,
    };

    expect(deriveEffectivePublicPortfolioState({ ...base, hasLinkOnlyContent: true })).toBe(
      'public_noindex'
    );
    expect(deriveEffectivePublicPortfolioState({ ...base, hasRevealGatedContent: true })).toBe(
      'public_noindex'
    );
    expect(deriveEffectivePublicPortfolioState({ ...base, hasPrivateContent: true })).toBe(
      'public_noindex'
    );
  });
});
