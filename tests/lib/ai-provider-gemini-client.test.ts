// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  generateJson,
  resolveAiAssistantsEnabled,
  resolveAiFeatureMaxOutputTokens,
  resolveAiModelDefault,
  resolveAiModelFallback,
  resolveAiModelFallbackVerified,
  resolveGeminiProviderApiKey,
} from '@/lib/ai/provider/gemini-client';

const ResponseSchema = z.object({
  answer: z.string(),
});

function geminiResponse(text: string) {
  return new Response(
    JSON.stringify({
      modelVersion: 'gemini-3.1-flash-lite',
      usageMetadata: {
        promptTokenCount: 11,
        candidatesTokenCount: 7,
        totalTokenCount: 18,
      },
      candidates: [
        {
          content: {
            parts: [{ text }],
          },
        },
      ],
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }
  );
}

describe('Gemini AI provider', () => {
  const originalEnv = {
    AI_ASSISTANTS_ENABLED: process.env.AI_ASSISTANTS_ENABLED,
    AI_MODEL_DEFAULT: process.env.AI_MODEL_DEFAULT,
    AI_MODEL_FALLBACK: process.env.AI_MODEL_FALLBACK,
    AI_MODEL_FALLBACK_VERIFIED: process.env.AI_MODEL_FALLBACK_VERIFIED,
    CV_IMPORT_GEMINI_MODEL_FALLBACK: process.env.CV_IMPORT_GEMINI_MODEL_FALLBACK,
    AI_CV_IMPORT_MAX_OUTPUT_TOKENS: process.env.AI_CV_IMPORT_MAX_OUTPUT_TOKENS,
    AI_GEMINI_PROD_API_KEY: process.env.AI_GEMINI_PROD_API_KEY,
    AI_GEMINI_STAGING_API_KEY: process.env.AI_GEMINI_STAGING_API_KEY,
    AI_GEMINI_API_KEY: process.env.AI_GEMINI_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    CV_IMPORT_GEMINI_PRIMARY_API_KEY: process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_GCP_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GCP_GEMINI_API_KEY,
    NEXT_PUBLIC_API_SECRET: process.env.NEXT_PUBLIC_API_SECRET,
  };

  afterEach(() => {
    vi.restoreAllMocks();
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('parses provider defaults and feature token caps', () => {
    delete process.env.AI_ASSISTANTS_ENABLED;
    delete process.env.AI_MODEL_DEFAULT;
    delete process.env.AI_MODEL_FALLBACK;
    delete process.env.CV_IMPORT_GEMINI_MODEL_FALLBACK;
    delete process.env.AI_MODEL_FALLBACK_VERIFIED;
    delete process.env.AI_CV_IMPORT_MAX_OUTPUT_TOKENS;

    expect(resolveAiModelDefault()).toBe('gemini-3.1-flash-lite');
    expect(resolveAiModelFallback()).toBeNull();
    expect(resolveAiModelFallbackVerified()).toBe(false);
    expect(resolveAiAssistantsEnabled()).toBe(false);
    expect(resolveAiFeatureMaxOutputTokens('cv_import', 5000)).toBe(3200);

    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_MODEL_DEFAULT = 'gemini-custom';
    process.env.AI_MODEL_FALLBACK = 'gemini-fallback';
    process.env.AI_MODEL_FALLBACK_VERIFIED = 'true';
    process.env.AI_CV_IMPORT_MAX_OUTPUT_TOKENS = '900';

    expect(resolveAiAssistantsEnabled()).toBe(true);
    expect(resolveAiModelDefault()).toBe('gemini-custom');
    expect(resolveAiModelFallback()).toBe('gemini-fallback');
    expect(resolveAiModelFallbackVerified()).toBe(true);
    expect(resolveAiFeatureMaxOutputTokens('cv_import', 5000)).toBe(900);
  });

  it('does not inherit legacy CV import fallback as the active provider fallback', () => {
    delete process.env.AI_MODEL_FALLBACK;
    process.env.CV_IMPORT_GEMINI_MODEL_FALLBACK = 'gemini-legacy-cv-fallback';
    process.env.AI_MODEL_FALLBACK_VERIFIED = 'true';

    expect(resolveAiModelFallback()).toBeNull();
    expect(resolveAiModelFallbackVerified()).toBe(false);
  });

  it('rejects disabled assistant calls before contacting the provider', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'false';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(
      generateJson({
        requestId: 'req-disabled',
        promptVersion: 'test-v1',
        feature: 'cv_import',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      code: 'assistants_disabled',
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects invalid JSON provider output', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiResponse('not-json'));

    await expect(
      generateJson({
        requestId: 'req-invalid-json',
        promptVersion: 'test-v1',
        feature: 'cv_import',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      code: 'invalid_json',
      status: 502,
    });
  });

  it('does not use NEXT_PUBLIC keys for server provider calls', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    delete process.env.AI_GEMINI_PROD_API_KEY;
    delete process.env.AI_GEMINI_STAGING_API_KEY;
    delete process.env.AI_GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY;
    process.env.NEXT_PUBLIC_GEMINI_API_KEY = 'browser-key';
    process.env.NEXT_PUBLIC_GCP_GEMINI_API_KEY = 'browser-gcp-key';
    process.env.NEXT_PUBLIC_API_SECRET = 'browser-api-secret';
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    expect(
      resolveGeminiProviderApiKey({
        env: {
          NEXT_PUBLIC_GEMINI_API_KEY: 'browser-key',
          NEXT_PUBLIC_GCP_GEMINI_API_KEY: 'browser-gcp-key',
          NEXT_PUBLIC_API_SECRET: 'browser-api-secret',
        },
      })
    ).toBeNull();

    await expect(
      generateJson({
        requestId: 'req-no-public-key',
        promptVersion: 'test-v1',
        feature: 'cv_import',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      code: 'missing_api_key',
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the current two Gemini key slots before legacy names', () => {
    expect(
      resolveGeminiProviderApiKey({
        env: {
          AI_GEMINI_PROD_API_KEY: 'prod-key',
          AI_GEMINI_STAGING_API_KEY: 'staging-key',
          CV_IMPORT_GEMINI_PRIMARY_API_KEY: 'legacy-primary',
          CV_IMPORT_GEMINI_SECONDARY_API_KEY: 'legacy-secondary',
        },
      })
    ).toBe('prod-key');

    expect(
      resolveGeminiProviderApiKey({
        keySlot: 'staging',
        env: {
          AI_GEMINI_STAGING_API_KEY: 'staging-key',
          CV_IMPORT_GEMINI_SECONDARY_API_KEY: 'legacy-secondary',
        },
      })
    ).toBe('staging-key');
  });

  it('normalizes accidentally quoted server-only Gemini keys', () => {
    expect(
      resolveGeminiProviderApiKey({
        env: {
          AI_GEMINI_PROD_API_KEY: '"prod-key"',
          CV_IMPORT_GEMINI_PRIMARY_API_KEY: 'legacy-primary',
        },
      })
    ).toBe('prod-key');

    expect(
      resolveGeminiProviderApiKey({
        keySlot: 'staging',
        env: {
          AI_GEMINI_STAGING_API_KEY: "'staging-key'",
          CV_IMPORT_GEMINI_SECONDARY_API_KEY: 'legacy-secondary',
        },
      })
    ).toBe('staging-key');
  });

  it('fails closed when structured output validation fails', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiResponse('{"answer":12}'));

    await expect(
      generateJson({
        requestId: 'req-validation-failure',
        promptVersion: 'test-v1',
        feature: 'cv_import',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      name: 'AiProviderError',
      code: 'validation_failed',
      status: 502,
    });
  });

  it('fails closed when the provider returns prohibited decision language', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      geminiResponse('{"answer":"Recommended to interview this candidate."}')
    );

    await expect(
      generateJson({
        requestId: 'req-forbidden-output',
        promptVersion: 'test-v1',
        feature: 'proof_pack_assistant',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      name: 'AiProviderError',
      code: 'validation_failed',
      status: 502,
    });
  });

  it('returns validated data with safe provider metadata and no prompt or key', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(geminiResponse('{"answer":"ok"}'));

    const result = await generateJson({
      requestId: 'req-success',
      promptVersion: 'test-v1',
      feature: 'cv_import',
      prompt: 'Return JSON.',
      schema: ResponseSchema,
      responseJsonSchema: {
        type: 'object',
        properties: { answer: { type: 'string' } },
        required: ['answer'],
      },
      maxOutputTokens: 100,
    });

    expect(result).toEqual({
      data: { answer: 'ok' },
      requestId: 'req-success',
      promptVersion: 'test-v1',
      feature: 'cv_import',
      model: 'gemini-3.1-flash-lite',
      provider: 'gemini',
      suggestionId: null,
      tokenUsage: {
        inputTokens: 11,
        outputTokens: 7,
        totalTokens: 18,
      },
    });
    expect(JSON.stringify(result)).not.toContain('server-key');
    expect(JSON.stringify(result)).not.toContain('Return JSON.');

    const [, init] = fetchMock.mock.calls[0] || [];
    expect(JSON.stringify(init?.body)).not.toContain('google_search');
    expect(JSON.stringify(init?.body)).not.toContain('fileData');
  });

  it('does not attempt an unverified fallback model when the default model is rejected', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    process.env.AI_MODEL_DEFAULT = 'invalid-default-model';
    process.env.AI_MODEL_FALLBACK = 'gemini-3.1-flash-lite';
    delete process.env.AI_MODEL_FALLBACK_VERIFIED;
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'model not found' } }), { status: 404 })
      );

    await expect(
      generateJson({
        requestId: 'req-unverified-fallback',
        promptVersion: 'test-v1',
        feature: 'cv_import',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      code: 'model_error',
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses a verified fallback model only after the default model is rejected', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    process.env.AI_MODEL_DEFAULT = 'invalid-default-model';
    process.env.AI_MODEL_FALLBACK = 'gemini-3.1-flash-lite';
    process.env.AI_MODEL_FALLBACK_VERIFIED = 'true';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'model not found' } }), { status: 404 })
      )
      .mockResolvedValueOnce(geminiResponse('{"answer":"ok"}'));

    const result = await generateJson({
      requestId: 'req-verified-fallback',
      promptVersion: 'test-v1',
      feature: 'cv_import',
      prompt: 'Return JSON.',
      schema: ResponseSchema,
      maxOutputTokens: 100,
    });

    expect(result.data).toEqual({ answer: 'ok' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('invalid-default-model');
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('gemini-3.1-flash-lite');
  });

  it('surfaces a safe provider error when the verified fallback model is also invalid', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    process.env.AI_MODEL_DEFAULT = 'invalid-default-model';
    process.env.AI_MODEL_FALLBACK = 'invalid-fallback-model';
    process.env.AI_MODEL_FALLBACK_VERIFIED = 'true';
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'model not found' } }), { status: 404 })
      );

    await expect(
      generateJson({
        requestId: 'req-invalid-fallback',
        promptVersion: 'test-v1',
        feature: 'cv_import',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      })
    ).rejects.toMatchObject({
      code: 'model_error',
      status: 404,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
