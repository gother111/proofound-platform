import { resolveUsdToSekRate } from '@/lib/expertise/gemini/config';

type GeminiTokenPricingUsd = {
  inputPerMillion: number;
  outputPerMillion: number;
};

const DEFAULT_MODEL_PRICING_USD: Record<string, GeminiTokenPricingUsd> = {
  'gemini-2.5-flash-lite': {
    inputPerMillion: 0.1,
    outputPerMillion: 0.4,
  },
  'gemini-2.5-flash': {
    inputPerMillion: 0.3,
    outputPerMillion: 2.5,
  },
};

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalizeModel(model: string): string {
  return model.trim().toLowerCase();
}

function resolvePricingOverride(model: string): GeminiTokenPricingUsd | null {
  const normalized = normalizeModel(model);
  if (normalized === 'gemini-2.5-flash-lite') {
    return {
      inputPerMillion: parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION,
        DEFAULT_MODEL_PRICING_USD[normalized].inputPerMillion
      ),
      outputPerMillion: parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION,
        DEFAULT_MODEL_PRICING_USD[normalized].outputPerMillion
      ),
    };
  }

  if (normalized === 'gemini-2.5-flash') {
    return {
      inputPerMillion: parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION,
        DEFAULT_MODEL_PRICING_USD[normalized].inputPerMillion
      ),
      outputPerMillion: parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION,
        DEFAULT_MODEL_PRICING_USD[normalized].outputPerMillion
      ),
    };
  }

  return null;
}

export function resolveModelPricingUsd(model: string): GeminiTokenPricingUsd {
  const normalized = normalizeModel(model);
  const override = resolvePricingOverride(normalized);
  if (override) {
    return override;
  }

  return DEFAULT_MODEL_PRICING_USD[normalized] || DEFAULT_MODEL_PRICING_USD['gemini-2.5-flash'];
}

export function computeGeminiCostOre(params: {
  model: string;
  promptTokens: number;
  outputTokens: number;
  usdToSekRate?: number;
}): number {
  const pricing = resolveModelPricingUsd(params.model);
  const usdToSekRate = params.usdToSekRate ?? resolveUsdToSekRate();
  const inputCostUsd = (Math.max(0, params.promptTokens) / 1_000_000) * pricing.inputPerMillion;
  const outputCostUsd = (Math.max(0, params.outputTokens) / 1_000_000) * pricing.outputPerMillion;
  const totalSek = (inputCostUsd + outputCostUsd) * usdToSekRate;
  return Math.max(0, Math.round(totalSek * 100));
}

export function estimateReservationCostOre(params: {
  model: string;
  aggregateTextChars: number;
  maxOutputTokens: number;
  usdToSekRate?: number;
}): number {
  const approxInputTokens = Math.ceil(Math.max(1, params.aggregateTextChars) / 4);
  return computeGeminiCostOre({
    model: params.model,
    promptTokens: approxInputTokens,
    outputTokens: Math.max(1, params.maxOutputTokens),
    usdToSekRate: params.usdToSekRate,
  });
}
