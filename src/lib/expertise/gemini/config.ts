export type GeminiKeySlot = 'primary' | 'secondary';
export type GeminiProvider = 'gemini';
export type CvImportEngineMode = 'auto' | 'typescript' | 'python' | 'gemini';

export const GEMINI_PROVIDER: GeminiProvider = 'gemini';
export const GEMINI_CURRENCY = 'SEK';

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_MAX_OUTPUT_TOKENS = 1400;
const DEFAULT_PRIMARY_BUDGET_SEK = 85;
const DEFAULT_SECONDARY_BUDGET_SEK = 85;
const DEFAULT_USD_TO_SEK_RATE = 10.5;
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_FALLBACK_MODEL = 'gemini-2.5-flash';

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function parseInteger(value: string | undefined, fallback: number): number {
  const parsed = parsePositiveNumber(value, fallback);
  return Math.max(1, Math.floor(parsed));
}

export function parseCvImportEngineMode(rawMode: string | undefined): CvImportEngineMode {
  const mode = rawMode?.trim().toLowerCase();
  if (mode === 'auto' || mode === 'typescript' || mode === 'python' || mode === 'gemini') {
    return mode;
  }
  return 'auto';
}

export function resolveGeminiModelDefault(): string {
  return process.env.CV_IMPORT_GEMINI_MODEL_DEFAULT?.trim() || DEFAULT_MODEL;
}

export function resolveGeminiModelFallback(): string {
  return process.env.CV_IMPORT_GEMINI_MODEL_FALLBACK?.trim() || DEFAULT_FALLBACK_MODEL;
}

export function resolveGeminiMaxOutputTokens(): number {
  return parseInteger(process.env.CV_IMPORT_GEMINI_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS);
}

export function resolveGeminiTemperature(): number {
  const parsed = Number(process.env.CV_IMPORT_GEMINI_TEMPERATURE);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TEMPERATURE;
  }
  return Math.min(1, Math.max(0, parsed));
}

export function resolveGeminiTimeoutMs(): number {
  return parseInteger(process.env.CV_IMPORT_GEMINI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
}

export function resolveUsdToSekRate(): number {
  return parsePositiveNumber(process.env.CV_IMPORT_GEMINI_USD_TO_SEK_RATE, DEFAULT_USD_TO_SEK_RATE);
}

export function resolveMonthlyBudgetSek(slot: GeminiKeySlot): number {
  return slot === 'primary'
    ? parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_PRIMARY_MONTHLY_BUDGET_SEK,
        DEFAULT_PRIMARY_BUDGET_SEK
      )
    : parsePositiveNumber(
        process.env.CV_IMPORT_GEMINI_SECONDARY_MONTHLY_BUDGET_SEK,
        DEFAULT_SECONDARY_BUDGET_SEK
      );
}

export function resolveMonthlyBudgetOre(slot: GeminiKeySlot): number {
  const sek = resolveMonthlyBudgetSek(slot);
  return Math.max(0, Math.round(sek * 100));
}

export function resolveGeminiApiKey(slot: GeminiKeySlot): string | null {
  const value =
    slot === 'primary'
      ? process.env.CV_IMPORT_GEMINI_PRIMARY_API_KEY
      : process.env.CV_IMPORT_GEMINI_SECONDARY_API_KEY;

  const key = value?.trim();
  return key && key.length > 0 ? key : null;
}

export function resolveConfiguredKeySlots(): GeminiKeySlot[] {
  const slots: GeminiKeySlot[] = [];
  if (resolveGeminiApiKey('primary')) {
    slots.push('primary');
  }
  if (resolveGeminiApiKey('secondary')) {
    slots.push('secondary');
  }
  return slots;
}
