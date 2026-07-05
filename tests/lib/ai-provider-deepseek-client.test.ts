// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import {
  generateJsonWithDeepSeek,
  resolveDeepSeekProviderApiKey,
  resolveDeepSeekProviderBaseUrl,
  resolveDeepSeekProviderModel,
} from '@/lib/ai/provider/deepseek-client';

const ResponseSchema = z.object({
  answer: z.string(),
});

function deepSeekResponse(text: string) {
  return new Response(
    JSON.stringify({
      model: 'deepseek-v4-flash',
      choices: [
        {
          message: {
            content: text,
          },
        },
      ],
      usage: {
        prompt_tokens: 13,
        completion_tokens: 5,
        total_tokens: 18,
      },
    }),
    {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }
  );
}

describe('DeepSeek AI provider', () => {
  const originalEnv = {
    AI_ASSISTANTS_ENABLED: process.env.AI_ASSISTANTS_ENABLED,
    START_FROM_CV_DEEPSEEK_API_KEY: process.env.START_FROM_CV_DEEPSEEK_API_KEY,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    AI_DEEPSEEK_API_KEY: process.env.AI_DEEPSEEK_API_KEY,
    START_FROM_CV_DEEPSEEK_BASE_URL: process.env.START_FROM_CV_DEEPSEEK_BASE_URL,
    START_FROM_CV_DEEPSEEK_MODEL: process.env.START_FROM_CV_DEEPSEEK_MODEL,
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

  it('resolves only server-side DeepSeek keys and defaults to V4 Flash', () => {
    expect(
      resolveDeepSeekProviderApiKey({
        env: {
          START_FROM_CV_DEEPSEEK_API_KEY: '"start-cv-key"',
          DEEPSEEK_API_KEY: 'fallback-key',
          NEXT_PUBLIC_DEEPSEEK_API_KEY: 'browser-key',
        },
      })
    ).toBe('start-cv-key');
    expect(
      resolveDeepSeekProviderApiKey({
        env: {
          NEXT_PUBLIC_DEEPSEEK_API_KEY: 'browser-key',
        },
      })
    ).toBeNull();
    expect(resolveDeepSeekProviderBaseUrl({})).toBe('https://api.deepseek.com');
    expect(resolveDeepSeekProviderBaseUrl({ START_FROM_CV_DEEPSEEK_BASE_URL: 'http://bad' })).toBe(
      'https://api.deepseek.com'
    );
    expect(resolveDeepSeekProviderModel({ START_FROM_CV_DEEPSEEK_MODEL: 'deepseek-v4-pro' })).toBe(
      'deepseek-v4-pro'
    );
    expect(resolveDeepSeekProviderModel({ START_FROM_CV_DEEPSEEK_MODEL: 'legacy-chat' })).toBe(
      'deepseek-v4-flash'
    );
  });

  it('rejects disabled assistants and missing keys before contacting DeepSeek', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');

    await expect(
      generateJsonWithDeepSeek(
        {
          requestId: 'req-disabled',
          promptVersion: 'test-v1',
          feature: 'start_from_cv',
          prompt: 'Return JSON.',
          schema: ResponseSchema,
          maxOutputTokens: 100,
        },
        { env: { AI_ASSISTANTS_ENABLED: 'false', START_FROM_CV_DEEPSEEK_API_KEY: 'server-key' } }
      )
    ).rejects.toMatchObject({ code: 'assistants_disabled', status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();

    await expect(
      generateJsonWithDeepSeek(
        {
          requestId: 'req-missing-key',
          promptVersion: 'test-v1',
          feature: 'start_from_cv',
          prompt: 'Return JSON.',
          schema: ResponseSchema,
          maxOutputTokens: 100,
        },
        { env: { AI_ASSISTANTS_ENABLED: 'true' } }
      )
    ).rejects.toMatchObject({ code: 'missing_api_key', status: 503 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses DeepSeek JSON mode with thinking disabled and returns validated data', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(deepSeekResponse('{"answer":"ok"}'));

    const result = await generateJsonWithDeepSeek(
      {
        requestId: 'req-success',
        promptVersion: 'test-v1',
        feature: 'start_from_cv',
        prompt: 'Return JSON.',
        schema: ResponseSchema,
        maxOutputTokens: 100,
      },
      { env: { AI_ASSISTANTS_ENABLED: 'true', START_FROM_CV_DEEPSEEK_API_KEY: 'server-key' } }
    );

    expect(result).toEqual({
      data: { answer: 'ok' },
      requestId: 'req-success',
      promptVersion: 'test-v1',
      feature: 'start_from_cv',
      model: 'deepseek-v4-flash',
      provider: 'deepseek_v4_flash',
      suggestionId: null,
      tokenUsage: {
        inputTokens: 13,
        outputTokens: 5,
        totalTokens: 18,
      },
    });

    const [endpoint, init] = fetchMock.mock.calls[0] || [];
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(String(endpoint)).toBe('https://api.deepseek.com/chat/completions');
    expect(init?.headers).toMatchObject({
      Authorization: 'Bearer server-key',
      'Content-Type': 'application/json',
      'x-request-id': 'req-success',
    });
    expect(body).toMatchObject({
      model: 'deepseek-v4-flash',
      response_format: { type: 'json_object' },
      thinking: { type: 'disabled' },
      stream: false,
      max_tokens: 100,
      temperature: 0,
    });
    expect(JSON.stringify(result)).not.toContain('server-key');
    expect(JSON.stringify(result)).not.toContain('Return JSON.');
  });

  it('fails closed for invalid JSON, prohibited decision language, and unsafe prompts', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(deepSeekResponse('not-json'))
      .mockResolvedValueOnce(
        deepSeekResponse('{"answer":"Recommended to interview this candidate."}')
      );

    await expect(
      generateJsonWithDeepSeek(
        {
          requestId: 'req-invalid-json',
          promptVersion: 'test-v1',
          feature: 'start_from_cv',
          prompt: 'Return JSON.',
          schema: ResponseSchema,
          maxOutputTokens: 100,
        },
        { env: { AI_ASSISTANTS_ENABLED: 'true', START_FROM_CV_DEEPSEEK_API_KEY: 'server-key' } }
      )
    ).rejects.toMatchObject({ code: 'invalid_json', status: 502 });

    await expect(
      generateJsonWithDeepSeek(
        {
          requestId: 'req-forbidden-output',
          promptVersion: 'test-v1',
          feature: 'start_from_cv',
          prompt: 'Return JSON.',
          schema: ResponseSchema,
          maxOutputTokens: 100,
        },
        { env: { AI_ASSISTANTS_ENABLED: 'true', START_FROM_CV_DEEPSEEK_API_KEY: 'server-key' } }
      )
    ).rejects.toMatchObject({ code: 'validation_failed', status: 502 });

    await expect(
      generateJsonWithDeepSeek(
        {
          requestId: 'req-unsafe-prompt',
          promptVersion: 'test-v1',
          feature: 'start_from_cv',
          prompt: 'Private file https://example.test/file.pdf?token=secret',
          schema: ResponseSchema,
          maxOutputTokens: 100,
        },
        { env: { AI_ASSISTANTS_ENABLED: 'true', START_FROM_CV_DEEPSEEK_API_KEY: 'server-key' } }
      )
    ).rejects.toMatchObject({ code: 'unsafe_request_payload', status: 400 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
