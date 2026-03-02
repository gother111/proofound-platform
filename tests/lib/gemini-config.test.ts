import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveGeminiAdaptiveMaxOutputTokens,
  resolveGeminiTaxonomyShortlistDocumentTimeoutMs,
  resolveGeminiTaxonomyShortlistQueryTimeoutMs,
  resolveGeminiTaxonomyShortlistSeedLimit,
  resolveGeminiTaxonomyGuidedEnabled,
} from '@/lib/expertise/gemini/config';

describe('gemini config helpers', () => {
  const originalMax = process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS;
  const originalShort = process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS;
  const originalGuided = process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED;
  const originalSeedLimit = process.env.CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT;
  const originalSeedTimeout = process.env.CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS;
  const originalDocumentTimeout = process.env.CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS;

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

    if (originalSeedLimit === undefined) {
      delete process.env.CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT;
    } else {
      process.env.CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT = originalSeedLimit;
    }

    if (originalSeedTimeout === undefined) {
      delete process.env.CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS;
    } else {
      process.env.CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS = originalSeedTimeout;
    }

    if (originalDocumentTimeout === undefined) {
      delete process.env.CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS;
    } else {
      process.env.CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS = originalDocumentTimeout;
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

  it('uses conservative shortlist defaults and parses explicit timeout/seed overrides', () => {
    delete process.env.CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT;
    delete process.env.CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS;
    delete process.env.CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS;

    expect(resolveGeminiTaxonomyShortlistSeedLimit()).toBe(8);
    expect(resolveGeminiTaxonomyShortlistQueryTimeoutMs()).toBe(1500);
    expect(resolveGeminiTaxonomyShortlistDocumentTimeoutMs()).toBe(8000);

    process.env.CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT = '12';
    process.env.CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS = '2000';
    process.env.CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS = '9000';

    expect(resolveGeminiTaxonomyShortlistSeedLimit()).toBe(12);
    expect(resolveGeminiTaxonomyShortlistQueryTimeoutMs()).toBe(2000);
    expect(resolveGeminiTaxonomyShortlistDocumentTimeoutMs()).toBe(9000);
  });
});
