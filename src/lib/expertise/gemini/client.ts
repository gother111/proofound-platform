import { log } from '@/lib/log';

export type GeminiUsageMetadata = {
  promptTokenCount: number;
  candidatesTokenCount: number;
  totalTokenCount: number;
};

export type GeminiCallResult = {
  json: unknown;
  usage: GeminiUsageMetadata;
  modelVersion: string;
  rawText: string;
};

export type GeminiClientErrorCode = 'quota_exceeded' | 'invalid_json' | 'model_error';

export class GeminiClientError extends Error {
  code: GeminiClientErrorCode;
  status: number;
  retryable: boolean;

  constructor(message: string, code: GeminiClientErrorCode, status = 500, retryable = false) {
    super(message);
    this.name = 'GeminiClientError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
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

function isQuotaError(status: number, message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    status === 429 ||
    normalized.includes('resource_exhausted') ||
    normalized.includes('quota') ||
    normalized.includes('rate limit')
  );
}

function parseJsonLenient(rawText: string): unknown | null {
  const direct = rawText.trim();
  if (!direct) {
    return null;
  }

  try {
    return JSON.parse(direct);
  } catch {
    // Continue with fallback strategies.
  }

  const fencedMatch = direct.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch && fencedMatch[1]) {
    try {
      return JSON.parse(fencedMatch[1].trim());
    } catch {
      // Continue with bracket extraction.
    }
  }

  const firstObjectStart = direct.indexOf('{');
  const lastObjectEnd = direct.lastIndexOf('}');
  if (firstObjectStart >= 0 && lastObjectEnd > firstObjectStart) {
    try {
      return JSON.parse(direct.slice(firstObjectStart, lastObjectEnd + 1));
    } catch {
      // Ignore and try array extraction.
    }
  }

  const firstArrayStart = direct.indexOf('[');
  const lastArrayEnd = direct.lastIndexOf(']');
  if (firstArrayStart >= 0 && lastArrayEnd > firstArrayStart) {
    try {
      return JSON.parse(direct.slice(firstArrayStart, lastArrayEnd + 1));
    } catch {
      // Ignore and return null.
    }
  }

  return null;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const fallback = `Gemini request failed with status ${response.status}`;
  try {
    const payload = (await response.json()) as {
      error?: { message?: string };
      message?: string;
    } | null;
    if (payload?.error?.message && payload.error.message.trim().length > 0) {
      return payload.error.message.trim();
    }
    if (payload?.message && payload.message.trim().length > 0) {
      return payload.message.trim();
    }
    return fallback;
  } catch {
    try {
      const text = (await response.text()).trim();
      return text.length > 0 ? text : fallback;
    } catch {
      return fallback;
    }
  }
}

export async function callGeminiStructuredJson(params: {
  apiKey: string;
  model: string;
  prompt: string;
  responseJsonSchema: unknown;
  maxOutputTokens: number;
  temperature: number;
  timeoutMs: number;
  requestId: string;
}): Promise<GeminiCallResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
  const startedAt = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          responseJsonSchema: params.responseJsonSchema,
          maxOutputTokens: params.maxOutputTokens,
          temperature: params.temperature,
        },
      }),
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response);
      throw new GeminiClientError(
        message,
        isQuotaError(response.status, message) ? 'quota_exceeded' : 'model_error',
        response.status,
        response.status >= 500 || response.status === 429
      );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const modelVersion =
      typeof payload.modelVersion === 'string' && payload.modelVersion.length > 0
        ? payload.modelVersion
        : params.model;
    const usage = normalizeUsageMetadata(payload.usageMetadata);

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
    const textPart = parts.find(
      (part) => typeof part.text === 'string' && part.text.trim().length > 0
    );
    const rawText = typeof textPart?.text === 'string' ? textPart.text.trim() : '';

    if (!rawText) {
      throw new GeminiClientError('Gemini returned no JSON content.', 'model_error', 502, false);
    }

    const parsed = parseJsonLenient(rawText);
    if (parsed === null) {
      throw new GeminiClientError('Gemini returned invalid JSON.', 'invalid_json', 502, false);
    }

    return {
      json: parsed,
      usage,
      modelVersion,
      rawText,
    };
  } catch (error) {
    if (error instanceof GeminiClientError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GeminiClientError('Gemini request timed out.', 'model_error', 504, true);
    }
    log.error('cv_import.gemini.call_failed', {
      requestId: params.requestId,
      model: params.model,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new GeminiClientError(
      error instanceof Error ? error.message : 'Gemini request failed.',
      'model_error',
      500,
      true
    );
  } finally {
    clearTimeout(timer);
  }
}

export function isGeminiQuotaExceededError(error: unknown): boolean {
  return error instanceof GeminiClientError && error.code === 'quota_exceeded';
}
