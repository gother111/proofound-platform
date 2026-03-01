import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveGeminiAdaptiveMaxOutputTokens,
  resolveGeminiTaxonomyGuidedEnabled,
} from '@/lib/expertise/gemini/config';

describe('gemini config helpers', () => {
  const originalMax = process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS;
  const originalShort = process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS;
  const originalGuided = process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED;

  afterEach(() => {
    if (originalMax === undefined) {
      delete process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS;
    } else {
      process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS = originalMax;
    }

    if (originalShort === undefined) {
      delete process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS;
    } else {
      process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS = originalShort;
    }

    if (originalGuided === undefined) {
      delete process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED;
    } else {
      process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED = originalGuided;
    }
  });

  it('scales output tokens down for short inputs and respects hard cap', () => {
    process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS = '1400';
    process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS = '700';

    expect(resolveGeminiAdaptiveMaxOutputTokens(3000)).toBe(700);
    expect(resolveGeminiAdaptiveMaxOutputTokens(10000)).toBe(1190);
    expect(resolveGeminiAdaptiveMaxOutputTokens(25000)).toBe(1400);
  });

  it('enables taxonomy-guided extraction by default and parses explicit false', () => {
    delete process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED;
    expect(resolveGeminiTaxonomyGuidedEnabled()).toBe(true);

    process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED = 'false';
    expect(resolveGeminiTaxonomyGuidedEnabled()).toBe(false);
  });
});
