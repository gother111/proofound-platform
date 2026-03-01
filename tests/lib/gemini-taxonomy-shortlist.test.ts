import { describe, expect, it } from 'vitest';

import { buildTaxonomyShortlistCacheKey } from '@/lib/expertise/gemini/taxonomy-shortlist';

describe('taxonomy shortlist cache key', () => {
  it('is stable for identical inputs and changes with taxonomy version', () => {
    const input = {
      documentText: 'React TypeScript Next.js',
      suggestionsLimit: 8,
      taxonomyVersion: 'v1',
    };

    const keyA = buildTaxonomyShortlistCacheKey(input);
    const keyB = buildTaxonomyShortlistCacheKey(input);
    const keyC = buildTaxonomyShortlistCacheKey({
      ...input,
      taxonomyVersion: 'v2',
    });

    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });
});
