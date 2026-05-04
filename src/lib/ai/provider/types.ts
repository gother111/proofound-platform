import type { z } from 'zod';
import type { AiUsageContext } from '@/lib/ai/usage-ledger';

export type AiProviderName = 'gemini';

export type AiTokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type AiGenerateJsonParams<TSchema extends z.ZodTypeAny> = {
  requestId: string;
  promptVersion: string;
  feature: string;
  prompt: string;
  schema: TSchema;
  responseJsonSchema?: unknown;
  model?: string;
  maxOutputTokens: number;
  temperature?: number;
  keySlot?: string;
  usage?: AiUsageContext;
};

export type AiGenerateJsonResult<TSchema extends z.ZodTypeAny> = {
  data: z.output<TSchema>;
  requestId: string;
  promptVersion: string;
  feature: string;
  model: string;
  provider: AiProviderName;
  tokenUsage: AiTokenUsage;
  replayed?: boolean;
  suggestionId?: string | null;
};

export interface AiJsonProvider {
  generateJson<TSchema extends z.ZodTypeAny>(
    params: AiGenerateJsonParams<TSchema>
  ): Promise<AiGenerateJsonResult<TSchema>>;
}

export type AiProviderErrorCode =
  | 'assistants_disabled'
  | 'missing_api_key'
  | 'budget_cap_not_configured'
  | 'budget_exceeded'
  | 'rate_limited'
  | 'invalid_json'
  | 'validation_failed'
  | 'quota_exceeded'
  | 'model_error'
  | 'server_only_violation';

export type SafeAiProviderError = {
  code: AiProviderErrorCode;
  message: string;
  status: number;
  retryable: boolean;
};

export class AiProviderError extends Error {
  code: AiProviderErrorCode;
  status: number;
  retryable: boolean;

  constructor(message: string, code: AiProviderErrorCode, status = 500, retryable = false) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }

  toSafeError(): SafeAiProviderError {
    return {
      code: this.code,
      message: this.message,
      status: this.status,
      retryable: this.retryable,
    };
  }
}
