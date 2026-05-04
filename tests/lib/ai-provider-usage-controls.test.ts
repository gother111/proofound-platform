// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const ResponseSchema = z.object({
  answer: z.string(),
});

const ledger = {
  assertAiProductionHardCapConfigured: vi.fn(() => undefined),
  buildAiIdempotencyKey: vi.fn(() => 'idem-1'),
  buildAiSuggestionCacheKey: vi.fn(() => 'cache-1'),
  createAiUsageLog: vi.fn(async () => 'usage-1'),
  enforceAiDailyRateLimits: vi.fn(async () => ({ ok: true })),
  finalizeAiBudgetReservation: vi.fn(async () => undefined),
  findAiSuggestionReplay: vi.fn(async () => null),
  hashAiContent: vi.fn((value: unknown) => `hash:${JSON.stringify(value)}`),
  recordAiSuggestionEvent: vi.fn(async () => undefined),
  releaseAiBudgetReservation: vi.fn(async () => undefined),
  reserveAiBudget: vi.fn(async () => ({
    ok: true,
    reservation: {
      budgetIds: ['budget-1'],
      estimatedCostOre: 3,
      monthStart: '2026-05-01',
    },
  })),
  updateAiUsageLog: vi.fn(async () => undefined),
  upsertAiSuggestionCache: vi.fn(async () => 'cache-row-1'),
};

function geminiResponse(text: string) {
  return new Response(
    JSON.stringify({
      modelVersion: 'gemini-3.1-flash-lite-preview',
      usageMetadata: {
        promptTokenCount: 1000,
        candidatesTokenCount: 2000,
        totalTokenCount: 3000,
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

async function importProvider() {
  vi.doMock('@/lib/ai/usage-ledger', () => ledger);
  return import('@/lib/ai/provider/gemini-client');
}

function requestParams(prompt = 'Sensitive candidate prompt text') {
  return {
    requestId: 'req-usage',
    promptVersion: 'test-v1',
    feature: 'cv_import',
    prompt,
    schema: ResponseSchema,
    maxOutputTokens: 100,
    usage: {
      userId: '00000000-0000-0000-0000-000000000001',
      orgId: '00000000-0000-0000-0000-000000000002',
      entityType: 'cv_import_batch',
      entityId: 'entity-1',
      inputHash: 'input-hash-1',
      sanitizedInputChars: prompt.length,
      redactionSummary: {
        raw_prompt_stored: false,
      },
    },
  };
}

describe('Gemini AI provider usage controls', () => {
  const originalEnv = {
    AI_ASSISTANTS_ENABLED: process.env.AI_ASSISTANTS_ENABLED,
    AI_GEMINI_API_KEY: process.env.AI_GEMINI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    APP_ENV: process.env.APP_ENV,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.AI_ASSISTANTS_ENABLED = 'true';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    process.env.NODE_ENV = 'test';
    delete process.env.VERCEL_ENV;
    delete process.env.APP_ENV;
    delete process.env.NEXT_PUBLIC_APP_ENV;
    ledger.assertAiProductionHardCapConfigured.mockImplementation(() => undefined);
    ledger.buildAiIdempotencyKey.mockReturnValue('idem-1');
    ledger.buildAiSuggestionCacheKey.mockReturnValue('cache-1');
    ledger.createAiUsageLog.mockResolvedValue('usage-1');
    ledger.enforceAiDailyRateLimits.mockResolvedValue({ ok: true });
    ledger.finalizeAiBudgetReservation.mockResolvedValue(undefined);
    ledger.findAiSuggestionReplay.mockResolvedValue(null);
    ledger.hashAiContent.mockImplementation((value: unknown) => `hash:${JSON.stringify(value)}`);
    ledger.recordAiSuggestionEvent.mockResolvedValue(undefined);
    ledger.releaseAiBudgetReservation.mockResolvedValue(undefined);
    ledger.reserveAiBudget.mockResolvedValue({
      ok: true,
      reservation: {
        budgetIds: ['budget-1'],
        estimatedCostOre: 3,
        monthStart: '2026-05-01',
      },
    });
    ledger.updateAiUsageLog.mockResolvedValue(undefined);
    ledger.upsertAiSuggestionCache.mockResolvedValue('cache-row-1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock('@/lib/ai/usage-ledger');
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  it('blocks before provider calls when the monthly budget cap is exceeded', async () => {
    ledger.reserveAiBudget.mockResolvedValueOnce({
      ok: false,
      reason: 'budget_exceeded',
      scopeType: 'production',
      scopeKey: 'all',
      limitOre: 0,
      spentOre: 0,
      reservedOre: 0,
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { generateJson } = await importProvider();

    await expect(generateJson(requestParams())).rejects.toMatchObject({
      code: 'budget_exceeded',
      status: 429,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(ledger.updateAiUsageLog).toHaveBeenCalledWith(
      'usage-1',
      expect.objectContaining({ status: 'budget_blocked' })
    );
  });

  it('blocks disabled assistant calls before usage controls or model calls', async () => {
    process.env.AI_ASSISTANTS_ENABLED = 'false';
    process.env.AI_GEMINI_API_KEY = 'server-key';
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { generateJson } = await importProvider();

    await expect(generateJson(requestParams())).rejects.toMatchObject({
      code: 'assistants_disabled',
      status: 503,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(ledger.findAiSuggestionReplay).not.toHaveBeenCalled();
    expect(ledger.createAiUsageLog).not.toHaveBeenCalled();
    expect(ledger.enforceAiDailyRateLimits).not.toHaveBeenCalled();
    expect(ledger.reserveAiBudget).not.toHaveBeenCalled();
  });

  it('blocks production assistant calls before provider calls when no monthly hard cap is configured', async () => {
    ledger.assertAiProductionHardCapConfigured.mockImplementationOnce(() => {
      throw new Error('missing hard cap');
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { generateJson } = await importProvider();

    await expect(generateJson(requestParams())).rejects.toMatchObject({
      code: 'budget_cap_not_configured',
      status: 503,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(ledger.createAiUsageLog).not.toHaveBeenCalled();
    expect(ledger.enforceAiDailyRateLimits).not.toHaveBeenCalled();
    expect(ledger.reserveAiBudget).not.toHaveBeenCalled();
  });

  it('releases the reservation when the provider fails before usage metadata is available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'provider down' } }), { status: 500 })
    );
    const { generateJson } = await importProvider();

    await expect(generateJson(requestParams())).rejects.toMatchObject({
      code: 'model_error',
    });

    expect(ledger.releaseAiBudgetReservation).toHaveBeenCalledWith(
      expect.objectContaining({ budgetIds: ['budget-1'] })
    );
    expect(ledger.updateAiUsageLog).toHaveBeenCalledWith(
      'usage-1',
      expect.objectContaining({
        status: 'model_error',
        providerStatus: 'deterministic_fallback',
        reservedOre: 0,
      })
    );
  });

  it('finalizes actual spend, clears the reservation, and caches successful output', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiResponse('{"answer":"ok"}'));
    const { generateJson } = await importProvider();

    const result = await generateJson(requestParams());

    expect(result.data).toEqual({ answer: 'ok' });
    expect(ledger.finalizeAiBudgetReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        reservation: expect.objectContaining({ budgetIds: ['budget-1'] }),
        actualCostOre: expect.any(Number),
      })
    );
    expect(ledger.updateAiUsageLog).toHaveBeenCalledWith(
      'usage-1',
      expect.objectContaining({
        status: 'success',
        providerStatus: 'provider_success',
        reservedOre: 0,
        costOre: expect.any(Number),
      })
    );
    expect(ledger.upsertAiSuggestionCache).toHaveBeenCalledWith(
      expect.objectContaining({
        responsePayload: { answer: 'ok' },
        outputHash: 'hash:{"answer":"ok"}',
      })
    );
  });

  it('returns cached replay for identical sanitized input without spending again', async () => {
    ledger.findAiSuggestionReplay.mockResolvedValueOnce({
      cacheId: 'cache-row-1',
      payload: { answer: 'cached' },
      outputHash: 'output-hash',
      model: 'gemini-3.1-flash-lite-preview',
      costOre: 12,
      tokenUsage: {
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
      },
    });
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const { generateJson } = await importProvider();

    const result = await generateJson(requestParams());

    expect(result).toEqual(
      expect.objectContaining({
        data: { answer: 'cached' },
        replayed: true,
      })
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ledger.createAiUsageLog).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cache_hit',
        cacheStatus: 'hit',
        providerStatus: 'cache_replay',
        estimatedCostOre: 0,
        costOre: 0,
      })
    );
    expect(ledger.reserveAiBudget).not.toHaveBeenCalled();
    expect(ledger.finalizeAiBudgetReservation).not.toHaveBeenCalled();
  });

  it('blocks per-user, per-org, per-feature, and global daily rate limits before reservation', async () => {
    for (const scope of ['user', 'organization', 'feature', 'global'] as const) {
      vi.resetModules();
      vi.clearAllMocks();
      process.env.AI_ASSISTANTS_ENABLED = 'true';
      process.env.AI_GEMINI_API_KEY = 'server-key';
      ledger.findAiSuggestionReplay.mockResolvedValue(null);
      ledger.createAiUsageLog.mockResolvedValue('usage-1');
      ledger.enforceAiDailyRateLimits.mockResolvedValueOnce({
        ok: false,
        scope,
        limit: 1,
        count: 1,
      });
      const fetchMock = vi.spyOn(globalThis, 'fetch');
      const { generateJson } = await importProvider();

      await expect(generateJson(requestParams())).rejects.toMatchObject({
        code: 'rate_limited',
        status: 429,
      });

      expect(fetchMock).not.toHaveBeenCalled();
      expect(ledger.reserveAiBudget).not.toHaveBeenCalled();
      expect(ledger.createAiUsageLog).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rate_limited',
          providerStatus: 'rate_limited',
        })
      );
      expect(ledger.updateAiUsageLog).not.toHaveBeenCalledWith(
        'usage-1',
        expect.objectContaining({ status: 'success' })
      );
      vi.restoreAllMocks();
    }
  });

  it('does not pass raw prompt text into ai_usage_logs writes', async () => {
    const rawPrompt = 'RAW PROMPT THAT MUST NOT BE LOGGED';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(geminiResponse('{"answer":"ok"}'));
    const { generateJson } = await importProvider();

    await generateJson(requestParams(rawPrompt));

    const logWrites = [
      ...ledger.createAiUsageLog.mock.calls,
      ...ledger.updateAiUsageLog.mock.calls,
    ];
    expect(JSON.stringify(logWrites)).not.toContain(rawPrompt);
    expect(JSON.stringify(logWrites)).toContain('input-hash-1');
  });
});
