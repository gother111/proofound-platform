import { log } from '@/lib/log';
import type { z } from 'zod';
import {
  AiProviderError,
  type AiGenerateJsonParams,
  type AiGenerateJsonResult,
  type AiJsonProvider,
  type AiTokenUsage,
} from '@/lib/ai/provider/types';
import {
  buildAiIdempotencyKey,
  buildAiSuggestionCacheKey,
  createAiUsageLog,
  enforceAiDailyRateLimits,
  finalizeAiBudgetReservation,
  findAiSuggestionReplay,
  hashAiContent,
  recordAiSuggestionEvent,
  releaseAiBudgetReservation,
  reserveAiBudget,
  updateAiUsageLog,
  upsertAiSuggestionCache,
  type AiUsageReservation,
  type AiUsageStatus,
} from '@/lib/ai/usage-ledger';
import { computeGeminiCostOre, estimateReservationCostOre } from '@/lib/expertise/gemini/pricing';

const PROVIDER = 'gemini' as const;
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_FEATURE_MAX_OUTPUT_TOKENS = 1600;
const FEATURE_MAX_OUTPUT_TOKEN_CAPS: Record<string, number> = {
  cv_import: 3200,
};

type GeminiUsageMetadata = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
};

type EnvReader = Record<string, string | undefined>;

function assertServerOnly(): void {
  if (typeof window !== 'undefined') {
    throw new AiProviderError(
      'AI provider calls are only available on the server.',
      'server_only_violation',
      500,
      false
    );
  }
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  return fallback;
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.max(1, Math.floor(parsed));
}

function parseTemperature(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_TEMPERATURE;
  }
  return Math.min(0.2, Math.max(0, value));
}

function normalizeUsageMetadata(value: unknown): GeminiUsageMetadata {
  if (!value || typeof value !== 'object') {
    return { promptTokenCount: 0, candidatesTokenCount: 0, totalTokenCount: 0 };
  }

  const payload = value as Record<string, unknown>;
  return {
    promptTokenCount:
      typeof payload.promptTokenCount === 'number' ? Math.max(0, payload.promptTokenCount) : 0,
    candidatesTokenCount:
      typeof payload.candidatesTokenCount === 'number'
        ? Math.max(0, payload.candidatesTokenCount)
        : 0,
    totalTokenCount:
      typeof payload.totalTokenCount === 'number' ? Math.max(0, payload.totalTokenCount) : 0,
  };
}

function normalizeTokenUsage(usage: GeminiUsageMetadata): AiTokenUsage {
  return {
    inputTokens: usage.promptTokenCount,
    outputTokens: usage.candidatesTokenCount,
    totalTokens: usage.totalTokenCount,
  };
}

function usageStatusForErrorCode(code: string): AiUsageStatus {
  if (code === 'invalid_json') {
    return 'invalid_json';
  }
  if (code === 'validation_failed') {
    return 'validation_failed';
  }
  if (code === 'budget_exceeded') {
    return 'budget_blocked';
  }
  if (code === 'rate_limited') {
    return 'rate_limited';
  }
  if (code === 'model_error' || code === 'quota_exceeded') {
    return 'model_error';
  }
  return 'failed';
}

function isQuotaError(status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    status === 429 ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit')
  );
}

async function parseProviderErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    } | null;
    const providerMessage = payload?.error?.message || payload?.message;
    if (providerMessage && providerMessage.trim().length > 0) {
      return providerMessage.trim();
    }
  } catch {
    // Fall through to the safe status-based message below.
  }
  return `Gemini request failed with status ${response.status}`;
}

function extractFirstCandidateText(payload: Record<string, unknown>): string {
  const candidates = Array.isArray(payload.candidates)
    ? (payload.candidates as Array<Record<string, unknown>>)
    : [];
  const firstCandidate = candidates[0];
  const parts =
    firstCandidate &&
    typeof firstCandidate === 'object' &&
    firstCandidate.content &&
    typeof firstCandidate.content === 'object' &&
    Array.isArray((firstCandidate.content as { parts?: unknown }).parts)
      ? ((firstCandidate.content as { parts: Array<Record<string, unknown>> }).parts ?? [])
      : [];
  const textPart = parts.find((part) => typeof part.text === 'string');
  return typeof textPart?.text === 'string' ? textPart.text.trim() : '';
}

export function resolveAiAssistantsEnabled(env: EnvReader = process.env): boolean {
  return parseBoolean(env.AI_ASSISTANTS_ENABLED, false);
}

export function resolveAiModelDefault(env: EnvReader = process.env): string {
  return env.AI_MODEL_DEFAULT?.trim() || DEFAULT_MODEL;
}

export function resolveAiFeatureMaxOutputTokens(
  feature: string,
  requestedMaxOutputTokens: number,
  env: EnvReader = process.env
): number {
  const normalizedFeature = feature.trim().toLowerCase();
  const envKey = `AI_${normalizedFeature.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_MAX_OUTPUT_TOKENS`;
  const defaultCap =
    FEATURE_MAX_OUTPUT_TOKEN_CAPS[normalizedFeature] || DEFAULT_FEATURE_MAX_OUTPUT_TOKENS;
  const cap = parseInteger(env[envKey], defaultCap);
  const requested = parseInteger(String(requestedMaxOutputTokens), cap);
  return Math.max(1, Math.min(requested, cap));
}

export function resolveGeminiProviderApiKey(params?: {
  keySlot?: string;
  env?: EnvReader;
}): string | null {
  const env = params?.env || process.env;
  const keySlot = params?.keySlot?.trim().toLowerCase();
  const candidates =
    keySlot === 'secondary' || keySlot === 'staging'
      ? [env.AI_GEMINI_STAGING_API_KEY, env.CV_IMPORT_GEMINI_SECONDARY_API_KEY]
      : keySlot === 'primary' || keySlot === 'prod' || keySlot === 'production'
        ? [
            env.AI_GEMINI_PROD_API_KEY,
            env.AI_GEMINI_API_KEY,
            env.GEMINI_API_KEY,
            env.CV_IMPORT_GEMINI_PRIMARY_API_KEY,
          ]
        : [
            env.AI_GEMINI_PROD_API_KEY,
            env.AI_GEMINI_API_KEY,
            env.GEMINI_API_KEY,
            env.AI_GEMINI_STAGING_API_KEY,
            env.CV_IMPORT_GEMINI_PRIMARY_API_KEY,
          ];

  for (const candidate of candidates) {
    const key = candidate?.trim();
    if (key) {
      return key;
    }
  }

  return null;
}

export class GeminiJsonProvider implements AiJsonProvider {
  async generateJson<TSchema extends z.ZodTypeAny>(
    params: AiGenerateJsonParams<TSchema>
  ): Promise<AiGenerateJsonResult<TSchema>> {
    assertServerOnly();
    const startedAt = Date.now();

    if (!resolveAiAssistantsEnabled()) {
      throw new AiProviderError('AI assistants are disabled.', 'assistants_disabled', 503, false);
    }

    const apiKey = resolveGeminiProviderApiKey({ keySlot: params.keySlot });
    if (!apiKey) {
      throw new AiProviderError(
        'AI provider key is not configured.',
        'missing_api_key',
        503,
        false
      );
    }

    const model = params.model?.trim() || resolveAiModelDefault();
    const maxOutputTokens = resolveAiFeatureMaxOutputTokens(params.feature, params.maxOutputTokens);
    const temperature = parseTemperature(params.temperature);
    const usageContext = params.usage;
    const usageEnabled = Boolean(usageContext?.userId);
    const inputHash = usageEnabled ? usageContext?.inputHash || hashAiContent(params.prompt) : null;
    const idempotencyKey =
      usageEnabled && inputHash
        ? buildAiIdempotencyKey({
            userId: usageContext!.userId,
            orgId: usageContext!.orgId,
            feature: params.feature,
            entityType: usageContext!.entityType,
            entityId: usageContext!.entityId,
            inputHash,
          })
        : null;
    const cacheKey =
      usageEnabled && inputHash
        ? buildAiSuggestionCacheKey({
            userId: usageContext!.userId,
            orgId: usageContext!.orgId,
            feature: params.feature,
            entityType: usageContext!.entityType,
            entityId: usageContext!.entityId,
            inputHash,
            promptVersion: params.promptVersion,
          })
        : null;

    if (usageEnabled && inputHash && cacheKey && !usageContext?.bypassCache) {
      const replay = await findAiSuggestionReplay({
        cacheKey,
        userId: usageContext!.userId,
        orgId: usageContext!.orgId,
      });
      if (replay) {
        const validation = params.schema.safeParse(replay.payload);
        if (validation.success) {
          await recordAiSuggestionEvent({
            cacheId: replay.cacheId,
            eventType: 'cache_hit',
            userId: usageContext!.userId,
            orgId: usageContext!.orgId,
            feature: params.feature,
            entityType: usageContext!.entityType,
            entityId: usageContext!.entityId,
            inputHash,
            safeMetadata: {
              prompt_version: params.promptVersion,
              model: replay.model,
            },
          });

          return {
            data: validation.data,
            requestId: params.requestId,
            promptVersion: params.promptVersion,
            feature: params.feature,
            model: replay.model,
            provider: PROVIDER,
            tokenUsage: replay.tokenUsage,
            replayed: true,
            suggestionId: replay.cacheId,
          };
        }
      }
    }

    let usageLogId: string | null = null;
    let reservation: AiUsageReservation | null = null;
    let reservationClosed = false;
    let savedSuggestionId: string | null = null;
    const estimatedCostOre = usageEnabled
      ? estimateReservationCostOre({
          model,
          aggregateTextChars: usageContext?.sanitizedInputChars || params.prompt.length,
          maxOutputTokens,
        })
      : 0;

    if (usageEnabled && inputHash && idempotencyKey) {
      const rateLimit = await enforceAiDailyRateLimits({
        userId: usageContext!.userId,
        orgId: usageContext!.orgId,
        feature: params.feature,
      });
      if (!rateLimit.ok) {
        usageLogId = await createAiUsageLog({
          requestId: params.requestId,
          idempotencyKey,
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          model,
          promptVersion: params.promptVersion,
          inputHash,
          status: 'rate_limited',
          estimatedCostOre,
          redactionSummary: usageContext!.redactionSummary,
          safeMetadata: {
            ...usageContext!.safeMetadata,
            rate_limit_scope: rateLimit.scope,
            rate_limit_count: rateLimit.count,
            rate_limit_limit: rateLimit.limit,
          },
        });
        await recordAiSuggestionEvent({
          usageLogId,
          eventType: 'rate_limited',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: {
            scope: rateLimit.scope,
            count: rateLimit.count,
            limit: rateLimit.limit,
          },
        });
        throw new AiProviderError('AI daily rate limit exceeded.', 'rate_limited', 429, false);
      }

      usageLogId = await createAiUsageLog({
        requestId: params.requestId,
        idempotencyKey,
        userId: usageContext!.userId,
        orgId: usageContext!.orgId,
        feature: params.feature,
        entityType: usageContext!.entityType,
        entityId: usageContext!.entityId,
        model,
        promptVersion: params.promptVersion,
        inputHash,
        estimatedCostOre,
        redactionSummary: usageContext!.redactionSummary,
        safeMetadata: usageContext!.safeMetadata,
      });

      await recordAiSuggestionEvent({
        usageLogId,
        eventType: 'cache_miss',
        userId: usageContext!.userId,
        orgId: usageContext!.orgId,
        feature: params.feature,
        entityType: usageContext!.entityType,
        entityId: usageContext!.entityId,
        inputHash,
        safeMetadata: { prompt_version: params.promptVersion },
      });

      const budgetDecision = await reserveAiBudget({ estimatedCostOre });
      if (!budgetDecision.ok) {
        await updateAiUsageLog(usageLogId, {
          status: 'budget_blocked',
          errorCode:
            budgetDecision.reason === 'disabled' ? 'ai_budget_disabled' : 'ai_budget_exceeded',
          latencyMs: Date.now() - startedAt,
          safeMetadata: {
            budget_scope_type: budgetDecision.scopeType,
            budget_scope_key: budgetDecision.scopeKey,
            budget_limit_ore: budgetDecision.limitOre,
            budget_spent_ore: budgetDecision.spentOre,
            budget_reserved_ore: budgetDecision.reservedOre,
          },
        });
        await recordAiSuggestionEvent({
          usageLogId,
          eventType: 'budget_blocked',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: {
            scope_type: budgetDecision.scopeType,
            scope_key: budgetDecision.scopeKey,
          },
        });
        throw new AiProviderError('AI budget exceeded.', 'budget_exceeded', 429, false);
      }

      reservation = budgetDecision.reservation;
      if (reservation) {
        await updateAiUsageLog(usageLogId, {
          reservedOre: reservation.estimatedCostOre,
        });
        await recordAiSuggestionEvent({
          usageLogId,
          eventType: 'reservation_created',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: {
            estimated_cost_ore: reservation.estimatedCostOre,
            budget_count: reservation.budgetIds.length,
          },
        });
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
          'x-request-id': params.requestId,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: params.prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: params.responseJsonSchema,
            maxOutputTokens,
            temperature,
          },
        }),
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) {
        const providerMessage = await parseProviderErrorMessage(response);
        throw new AiProviderError(
          isQuotaError(response.status, providerMessage)
            ? 'AI provider quota is exhausted.'
            : 'AI provider request failed.',
          isQuotaError(response.status, providerMessage) ? 'quota_exceeded' : 'model_error',
          response.status,
          response.status >= 500 || response.status === 429
        );
      }

      const payload = (await response.json()) as Record<string, unknown>;
      const modelVersion =
        typeof payload.modelVersion === 'string' && payload.modelVersion.trim().length > 0
          ? payload.modelVersion.trim()
          : model;
      const tokenUsage = normalizeTokenUsage(normalizeUsageMetadata(payload.usageMetadata));
      const rawText = extractFirstCandidateText(payload);

      async function finalizeFailedUsage(
        code: 'model_error' | 'invalid_json' | 'validation_failed'
      ) {
        if (!usageEnabled || !usageLogId || !inputHash || reservationClosed) {
          return;
        }
        const actualCostOre = computeGeminiCostOre({
          model: modelVersion,
          promptTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
        });
        await finalizeAiBudgetReservation({
          reservation,
          actualCostOre,
        });
        reservationClosed = true;
        await updateAiUsageLog(usageLogId, {
          status: usageStatusForErrorCode(code),
          model: modelVersion,
          promptTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costOre: actualCostOre,
          reservedOre: 0,
          errorCode: code,
          latencyMs: Date.now() - startedAt,
        });
        await recordAiSuggestionEvent({
          usageLogId,
          eventType: 'provider_failed',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: { code, model: modelVersion },
        });
      }

      if (!rawText) {
        await finalizeFailedUsage('model_error');
        throw new AiProviderError('AI provider returned no JSON.', 'model_error', 502, false);
      }

      let json: unknown;
      try {
        json = JSON.parse(rawText);
      } catch {
        await finalizeFailedUsage('invalid_json');
        throw new AiProviderError('AI provider returned invalid JSON.', 'invalid_json', 502, false);
      }

      const validation = params.schema.safeParse(json);
      if (!validation.success) {
        await finalizeFailedUsage('validation_failed');
        throw new AiProviderError(
          'AI provider returned JSON that failed validation.',
          'validation_failed',
          502,
          false
        );
      }

      if (usageEnabled && usageLogId && inputHash && cacheKey) {
        const actualCostOre = computeGeminiCostOre({
          model: modelVersion,
          promptTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
        });
        const outputHash = hashAiContent(validation.data);

        await finalizeAiBudgetReservation({
          reservation,
          actualCostOre,
        });
        reservationClosed = true;

        await updateAiUsageLog(usageLogId, {
          status: 'success',
          model: modelVersion,
          outputHash,
          promptTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          totalTokens: tokenUsage.totalTokens,
          costOre: actualCostOre,
          reservedOre: 0,
          latencyMs: Date.now() - startedAt,
        });

        const cacheId = await upsertAiSuggestionCache({
          cacheKey,
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          model: modelVersion,
          promptVersion: params.promptVersion,
          inputHash,
          outputHash,
          responsePayload: validation.data,
          tokenUsage,
          costOre: actualCostOre,
          redactionSummary: usageContext!.redactionSummary,
          cacheTtlSeconds: usageContext!.cacheTtlSeconds,
        });
        savedSuggestionId = cacheId;

        await recordAiSuggestionEvent({
          usageLogId,
          cacheId,
          eventType: 'finalized',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: {
            model: modelVersion,
            cost_ore: actualCostOre,
          },
        });

        await recordAiSuggestionEvent({
          usageLogId,
          cacheId,
          eventType: 'generated',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: {
            model: modelVersion,
            prompt_version: params.promptVersion,
          },
        });
      }

      return {
        data: validation.data,
        requestId: params.requestId,
        promptVersion: params.promptVersion,
        feature: params.feature,
        model: modelVersion,
        provider: PROVIDER,
        tokenUsage,
        suggestionId: savedSuggestionId,
      };
    } catch (error) {
      if (error instanceof AiProviderError) {
        if (usageEnabled && usageLogId && inputHash && !reservationClosed) {
          await releaseAiBudgetReservation(reservation);
          reservationClosed = true;
          await updateAiUsageLog(usageLogId, {
            status: usageStatusForErrorCode(error.code),
            reservedOre: 0,
            errorCode: error.code,
            latencyMs: Date.now() - startedAt,
          });
          await recordAiSuggestionEvent({
            usageLogId,
            eventType:
              error.code === 'budget_exceeded'
                ? 'budget_blocked'
                : error.code === 'rate_limited'
                  ? 'rate_limited'
                  : 'provider_failed',
            userId: usageContext!.userId,
            orgId: usageContext!.orgId,
            feature: params.feature,
            entityType: usageContext!.entityType,
            entityId: usageContext!.entityId,
            inputHash,
            safeMetadata: { code: error.code },
          });
        }
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (usageEnabled && usageLogId && inputHash && !reservationClosed) {
          await releaseAiBudgetReservation(reservation);
          reservationClosed = true;
          await updateAiUsageLog(usageLogId, {
            status: 'model_error',
            reservedOre: 0,
            errorCode: 'model_error',
            latencyMs: Date.now() - startedAt,
          });
          await recordAiSuggestionEvent({
            usageLogId,
            eventType: 'provider_failed',
            userId: usageContext!.userId,
            orgId: usageContext!.orgId,
            feature: params.feature,
            entityType: usageContext!.entityType,
            entityId: usageContext!.entityId,
            inputHash,
            safeMetadata: { code: 'timeout' },
          });
        }
        throw new AiProviderError('AI provider request timed out.', 'model_error', 504, true);
      }

      log.error('ai_provider.gemini.generate_json_failed', {
        requestId: params.requestId,
        promptVersion: params.promptVersion,
        feature: params.feature,
        model,
        provider: PROVIDER,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      if (usageEnabled && usageLogId && inputHash && !reservationClosed) {
        await releaseAiBudgetReservation(reservation);
        reservationClosed = true;
        await updateAiUsageLog(usageLogId, {
          status: 'model_error',
          reservedOre: 0,
          errorCode: 'model_error',
          latencyMs: Date.now() - startedAt,
        });
        await recordAiSuggestionEvent({
          usageLogId,
          eventType: 'provider_failed',
          userId: usageContext!.userId,
          orgId: usageContext!.orgId,
          feature: params.feature,
          entityType: usageContext!.entityType,
          entityId: usageContext!.entityId,
          inputHash,
          safeMetadata: { code: 'model_error' },
        });
      }
      throw new AiProviderError('AI provider request failed.', 'model_error', 500, true);
    } finally {
      clearTimeout(timer);
    }
  }
}

export const geminiJsonProvider = new GeminiJsonProvider();

export function generateJson<TSchema extends z.ZodTypeAny>(
  params: AiGenerateJsonParams<TSchema>
): Promise<AiGenerateJsonResult<TSchema>> {
  return geminiJsonProvider.generateJson(params);
}
