import { log } from '@/lib/log';
import type { z } from 'zod';

import { resolveAiAssistantsEnabled } from '@/lib/ai/provider/config';
import {
  AiProviderError,
  type AiGenerateJsonParams,
  type AiGenerateJsonResult,
  type AiJsonProvider,
  type AiTokenUsage,
} from '@/lib/ai/provider/types';
import { containsForbiddenAiOutput, containsUnsafeAiRequestPayload } from '@/lib/ai/request-safety';
import { assertAiProductionHardCapConfigured } from '@/lib/ai/usage-ledger';

const PROVIDER = 'deepseek_v4_flash' as const;
const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-v4-flash';
const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_FEATURE_MAX_OUTPUT_TOKENS = 1600;
const FEATURE_MAX_OUTPUT_TOKEN_CAPS: Record<string, number> = {
  start_from_cv: 1800,
  cv_import: 3200,
};

type EnvReader = Record<string, string | undefined>;

type DeepSeekUsageMetadata = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

type DeepSeekChatPayload = {
  model?: string;
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
    total_tokens?: unknown;
  };
};

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

function normalizeServerOnlySecret(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || null;
  }

  return trimmed;
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

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
  }
  return 0;
}

function normalizeTokenUsage(usage: DeepSeekUsageMetadata): AiTokenUsage {
  const total =
    usage.totalTokens > 0 ? usage.totalTokens : usage.promptTokens + usage.completionTokens;
  return {
    inputTokens: usage.promptTokens,
    outputTokens: usage.completionTokens,
    totalTokens: total,
  };
}

function normalizeUsageMetadata(value: DeepSeekChatPayload['usage']): DeepSeekUsageMetadata {
  return {
    promptTokens: normalizeNumber(value?.prompt_tokens),
    completionTokens: normalizeNumber(value?.completion_tokens),
    totalTokens: normalizeNumber(value?.total_tokens),
  };
}

function isQuotaError(status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  return status === 429 || normalized.includes('quota') || normalized.includes('rate limit');
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
  return `DeepSeek request failed with status ${response.status}`;
}

function extractFirstMessageContent(payload: DeepSeekChatPayload): string {
  const content = payload.choices?.[0]?.message?.content;
  return typeof content === 'string' ? content.trim() : '';
}

function resolveDeepSeekFeatureMaxOutputTokens(
  feature: string,
  requestedMaxOutputTokens: number,
  env: EnvReader
): number {
  const normalizedFeature = feature.trim().toLowerCase();
  const envKey = `AI_${normalizedFeature.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_MAX_OUTPUT_TOKENS`;
  const defaultCap =
    FEATURE_MAX_OUTPUT_TOKEN_CAPS[normalizedFeature] || DEFAULT_FEATURE_MAX_OUTPUT_TOKENS;
  const providerCap =
    normalizedFeature === 'start_from_cv'
      ? parseInteger(env.START_FROM_CV_DEEPSEEK_MAX_OUTPUT_TOKENS, defaultCap)
      : defaultCap;
  const cap = parseInteger(env[envKey], providerCap);
  const requested = parseInteger(String(requestedMaxOutputTokens), cap);
  return Math.max(1, Math.min(requested, cap));
}

export function resolveDeepSeekProviderApiKey(params?: { env?: EnvReader }): string | null {
  const env = params?.env || process.env;
  const candidates = [
    env.START_FROM_CV_DEEPSEEK_API_KEY,
    env.DEEPSEEK_API_KEY,
    env.AI_DEEPSEEK_API_KEY,
  ];

  for (const candidate of candidates) {
    const key = normalizeServerOnlySecret(candidate);
    if (key) {
      return key;
    }
  }

  return null;
}

export function resolveDeepSeekProviderBaseUrl(env: EnvReader = process.env): string {
  const raw = env.START_FROM_CV_DEEPSEEK_BASE_URL || env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL;
  const normalized = raw.trim().replace(/\/+$/g, '') || DEFAULT_BASE_URL;
  try {
    const url = new URL(normalized);
    if (url.protocol !== 'https:') {
      return DEFAULT_BASE_URL;
    }
    return url.toString().replace(/\/+$/g, '');
  } catch {
    return DEFAULT_BASE_URL;
  }
}

export function resolveDeepSeekProviderModel(env: EnvReader = process.env): string {
  const raw = env.START_FROM_CV_DEEPSEEK_MODEL || env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const normalized = raw.trim().toLowerCase();
  return normalized === 'deepseek-v4-pro' ? 'deepseek-v4-pro' : DEFAULT_MODEL;
}

export class DeepSeekJsonProvider implements AiJsonProvider {
  constructor(private readonly env: EnvReader = process.env) {}

  async generateJson<TSchema extends z.ZodTypeAny>(
    params: AiGenerateJsonParams<TSchema>
  ): Promise<AiGenerateJsonResult<TSchema>> {
    assertServerOnly();
    const env = this.env;
    const startedAt = Date.now();

    if (!resolveAiAssistantsEnabled(env)) {
      throw new AiProviderError('AI assistants are disabled.', 'assistants_disabled', 503, false);
    }

    try {
      assertAiProductionHardCapConfigured(env);
    } catch {
      throw new AiProviderError(
        'AI monthly hard cap is not configured for production.',
        'budget_cap_not_configured',
        503,
        false
      );
    }

    const apiKey = resolveDeepSeekProviderApiKey({ env });
    if (!apiKey) {
      throw new AiProviderError(
        'DeepSeek API key is not configured.',
        'missing_api_key',
        503,
        false
      );
    }

    if (containsUnsafeAiRequestPayload(params.prompt)) {
      throw new AiProviderError(
        'AI request contains unsafe private links, secrets, or storage paths.',
        'unsafe_request_payload',
        400,
        false
      );
    }

    const baseUrl = resolveDeepSeekProviderBaseUrl(env);
    const endpoint = new URL('/chat/completions', `${baseUrl}/`).toString();
    const model = params.model?.trim() || resolveDeepSeekProviderModel(env);
    const maxTokens = resolveDeepSeekFeatureMaxOutputTokens(
      params.feature,
      params.maxOutputTokens,
      env
    );
    const temperature = parseTemperature(params.temperature);
    const controller = new AbortController();
    const timeoutMs = parseInteger(env.START_FROM_CV_DEEPSEEK_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'x-request-id': params.requestId,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'Return a single valid JSON object only. Do not include Markdown or explanatory text.',
            },
            { role: 'user', content: params.prompt },
          ],
          response_format: { type: 'json_object' },
          thinking: { type: 'disabled' },
          max_tokens: maxTokens,
          temperature,
          stream: false,
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

      const payload = (await response.json()) as DeepSeekChatPayload;
      const modelVersion =
        typeof payload.model === 'string' && payload.model.trim().length > 0
          ? payload.model.trim()
          : model;
      const rawText = extractFirstMessageContent(payload);
      const tokenUsage = normalizeTokenUsage(normalizeUsageMetadata(payload.usage));

      if (!rawText) {
        throw new AiProviderError('AI provider returned no JSON.', 'model_error', 502, false);
      }

      let json: unknown;
      try {
        json = JSON.parse(rawText);
      } catch {
        throw new AiProviderError('AI provider returned invalid JSON.', 'invalid_json', 502, false);
      }

      const validation = params.schema.safeParse(json);
      if (!validation.success) {
        throw new AiProviderError(
          'AI provider returned JSON that failed validation.',
          'validation_failed',
          502,
          false
        );
      }

      if (containsForbiddenAiOutput(validation.data)) {
        throw new AiProviderError(
          'AI provider returned prohibited decision language.',
          'validation_failed',
          502,
          false
        );
      }

      return {
        data: validation.data,
        requestId: params.requestId,
        promptVersion: params.promptVersion,
        feature: params.feature,
        model: modelVersion,
        provider: PROVIDER,
        tokenUsage,
        suggestionId: null,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AiProviderError('AI provider request timed out.', 'model_error', 504, true);
      }
      if (error instanceof AiProviderError) {
        throw error;
      }
      log.error('ai_provider.deepseek.generate_json_failed', {
        requestId: params.requestId,
        promptVersion: params.promptVersion,
        feature: params.feature,
        model,
        provider: PROVIDER,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AiProviderError('AI provider request failed.', 'model_error', 500, true);
    } finally {
      clearTimeout(timer);
    }
  }
}

export const deepSeekJsonProvider = new DeepSeekJsonProvider();

export function generateJsonWithDeepSeek<TSchema extends z.ZodTypeAny>(
  params: AiGenerateJsonParams<TSchema>,
  options?: { env?: EnvReader }
): Promise<AiGenerateJsonResult<TSchema>> {
  if (options?.env) {
    return new DeepSeekJsonProvider(options.env).generateJson(params);
  }
  return deepSeekJsonProvider.generateJson(params);
}
