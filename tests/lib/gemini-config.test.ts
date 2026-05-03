import { afterEach, describe, expect, it } from 'vitest';

import {
  resolveGeminiAdaptiveMaxOutputTokens,
  resolveConfiguredKeySlots,
  resolveGeminiApiKey,
  resolveGeminiModelDefault,
  resolveGeminiTaxonomyShortlistDocumentTimeoutMs,
  resolveGeminiTaxonomyShortlistQueryTimeoutMs,
  resolveGeminiTaxonomyShortlistSeedLimit,
  resolveGeminiTaxonomyGuidedEnabled,
} from '@/lib/expertise/gemini/config';

describe('gemini config helpers', () => {
  const originalMax = process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS;
  const originalShort = process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS;
  const originalGuided = process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED;
  const originalAiModelDefault = process.env.AI_MODEL_DEFAULT;
  const originalAiGeminiProd = process.env.AI_GEMINI_PROD_API_KEY;
  const originalAiGeminiStaging = process.env.AI_GEMINI_STAGING_API_KEY;
  const originalAiGemini = process.env.AI_GEMINI_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalNextPublicGemini = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const originalNextPublicGcpGemini = process.env.NEXT_PUBLIC_GCP_GEMINI_API_KEY;
  const originalNextPublicApiSecret = process.env.NEXT_PUBLIC_API_SECRET;
  const originalLegacyPrimary = process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY;
  const originalLegacySecondary = process.env.CV_IMPORT_GEMINI_SECONDARY_API_KEY;
  const originalDefaultModel = process.env.CV_IMPORT_GEMINI_MODEL_DEFAULT;
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

    if (originalAiModelDefault === undefined) {
      delete process.env.AI_MODEL_DEFAULT;
    } else {
      process.env.AI_MODEL_DEFAULT = originalAiModelDefault;
    }

    for (const [key, value] of Object.entries({
      AI_GEMINI_PROD_API_KEY: originalAiGeminiProd,
      AI_GEMINI_STAGING_API_KEY: originalAiGeminiStaging,
      AI_GEMINI_API_KEY: originalAiGemini,
      GEMINI_API_KEY: originalGemini,
      NEXT_PUBLIC_GEMINI_API_KEY: originalNextPublicGemini,
      NEXT_PUBLIC_GCP_GEMINI_API_KEY: originalNextPublicGcpGemini,
      NEXT_PUBLIC_API_SECRET: originalNextPublicApiSecret,
      CV_IMPORT_GEMINI_PRIMARY_API_KEY: originalLegacyPrimary,
      CV_IMPORT_GEMINI_SECONDARY_API_KEY: originalLegacySecondary,
    })) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }

    if (originalDefaultModel === undefined) {
      delete process.env.CV_IMPORT_GEMINI_MODEL_DEFAULT;
    } else {
      process.env.CV_IMPORT_GEMINI_MODEL_DEFAULT = originalDefaultModel;
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
    expect(resolveGeminiAdaptiveMaxOutputTokens(10000)).toBe(1260);
    expect(resolveGeminiAdaptiveMaxOutputTokens(25000)).toBe(1400);
  });

  it('enables taxonomy-guided extraction by default and parses explicit false', () => {
    delete process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED;
    expect(resolveGeminiTaxonomyGuidedEnabled()).toBe(true);

    process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED = 'false';
    expect(resolveGeminiTaxonomyGuidedEnabled()).toBe(false);
  });

  it('uses gemini-2.5-flash-lite as default model when env override is unset', () => {
    delete process.env.AI_MODEL_DEFAULT;
    delete process.env.CV_IMPORT_GEMINI_MODEL_DEFAULT;
    expect(resolveGeminiModelDefault()).toBe('gemini-2.5-flash-lite');
  });

  it('prefers AI-facing Gemini key names and keeps legacy CV import names as fallback', () => {
    delete process.env.AI_GEMINI_PROD_API_KEY;
    delete process.env.AI_GEMINI_STAGING_API_KEY;
    delete process.env.AI_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY;
    delete process.env.CV_IMPORT_GEMINI_SECONDARY_API_KEY;

    process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY = 'legacy-primary';
    process.env.CV_IMPORT_GEMINI_SECONDARY_API_KEY = 'legacy-secondary';
    expect(resolveGeminiApiKey('primary')).toBe('legacy-primary');
    expect(resolveGeminiApiKey('secondary')).toBe('legacy-secondary');

    process.env.AI_GEMINI_PROD_API_KEY = 'ai-prod';
    process.env.AI_GEMINI_STAGING_API_KEY = 'ai-staging';
    expect(resolveGeminiApiKey('primary')).toBe('ai-prod');
    expect(resolveGeminiApiKey('secondary')).toBe('ai-staging');
    expect(resolveConfiguredKeySlots()).toEqual(['primary', 'secondary']);
  });

  it('does not accept NEXT_PUBLIC Gemini or generic API secret env vars as provider keys', () => {
    delete process.env.AI_GEMINI_PROD_API_KEY;
    delete process.env.AI_GEMINI_STAGING_API_KEY;
    delete process.env.AI_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY;
    delete process.env.CV_IMPORT_GEMINI_SECONDARY_API_KEY;

    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'browser-gemini-key';
    process.env.NEXT_PUBLIC_GCP_GEMINI_API_KEY = 'browser-gcp-gemini-key';
    process.env.NEXT_PUBLIC_API_SECRET = 'browser-api-secret';

    expect(resolveGeminiApiKey('primary')).toBeNull();
    expect(resolveGeminiApiKey('secondary')).toBeNull();
    expect(resolveConfiguredKeySlots()).toEqual([]);
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
