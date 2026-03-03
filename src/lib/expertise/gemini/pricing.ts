import { resolveUsdToSekRate } from '@/lib/expertise/gemini/config';

type GeminiTokenPricingUsd = {
  inputPerMillion: number;
  outputPerMillion: number;
};

type GeminiPricingFamily = 'flash-lite' | 'flash';

const DEFAULT_FAMILY_PRICING_USD: Record<GeminiPricingFamily, GeminiTokenPricingUsd> = {
  'flash-lite': {
    inputPerMillion: 0.1,
    outputPerMillion: 0.4,
  },
  flash: {
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

function resolvePricingFamily(model: string): GeminiPricingFamily | null {
  const normalized = normalizeModel(model);
  if (normalized.includes('flash-lite')) {
    return 'flash-lite';
  }
  if (normalized.includes('flash')) {
    return 'flash';
  }
  return null;
}

function resolvePricingOverride(family: GeminiPricingFamily): GeminiTokenPricingUsd {
  if (family === 'flash-lite') {
    return {
      inputPerMillion: parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_FLASH_LITE_INPUT_USD_PER_MILLION,
        DEFAULT_FAMILY_PRICING_USD[family].inputPerMillion
      ),
      outputPerMillion: parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_FLASH_LITE_OUTPUT_USD_PER_MILLION,
        DEFAULT_FAMILY_PRICING_USD[family].outputPerMillion
      ),
    };
  }

  return {
    inputPerMillion: parsePositiveNumber(
      process.env.CV_IMPORT_GEMINI_FLASH_INPUT_USD_PER_MILLION,
      DEFAULT_FAMILY_PRICING_USD[family].inputPerMillion
    ),
    outputPerMillion: parsePositiveNumber(
      process.env.CV_IMPORT_GEMINI_FLASH_OUTPUT_USD_PER_MILLION,
      DEFAULT_FAMILY_PRICING_USD[family].outputPerMillion
    ),
  };
}

export function resolveModelPricingUsd(model: string): GeminiTokenPricingUsd {
  const family = resolvePricingFamily(model);
  if (family) {
    return resolvePricingOverride(family);
  }

  return DEFAULT_FAMILY_PRICING_USD.flash;
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
