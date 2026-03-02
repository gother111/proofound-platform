export type GeminiKeySlot = 'primary' | 'secondary';
export type GeminiProvider = 'gemini';
export type CvImportEngineMode = 'auto' | 'typescript' | 'python' | 'gemini';

export const GEMINI_PROVIDER: GeminiProvider = 'gemini';
export const GEMINI_CURRENCY = 'SEK';

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_TEMPERATURE = 0;
const DEFAULT_MAX_OUTPUT_TOKENS = 1600;
const DEFAULT_SHORT_TEXT_MAX_OUTPUT_TOKENS = 1000;
const DEFAULT_PRIMARY_BUDGET_SEK = 85;
const DEFAULT_SECONDARY_BUDGET_SEK = 85;
const DEFAULT_USD_TO_SEK_RATE = 10.5;
const DEFAULT_MODEL = 'gemini-2.5-flash-lite';
const DEFAULT_FALLBACK_MODEL = 'gemini-2.5-flash';
const DEFAULT_TAXONOMY_SHORTLIST_MAX_ENTRIES = 120;
const DEFAULT_TAXONOMY_SHORTLIST_MAX_TOKENS = 1200;
const DEFAULT_TAXONOMY_SHORTLIST_SEED_LIMIT = 8;
const DEFAULT_TAXONOMY_SHORTLIST_CONCURRENCY = 4;
const DEFAULT_TAXONOMY_SHORTLIST_QUERY_TIMEOUT_MS = 1500;
const DEFAULT_TAXONOMY_SHORTLIST_DOCUMENT_TIMEOUT_MS = 8000;
const DEFAULT_TAXONOMY_SHORTLIST_CACHE_TTL_MS = 10 * 60 * 1000;
const DEFAULT_TAXONOMY_VERSION = 'v1';

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

export function resolveGeminiShortTextMaxOutputTokens(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORT_TEXT_MAX_OUTPUT_TOKENS,
    DEFAULT_SHORT_TEXT_MAX_OUTPUT_TOKENS
  );
}

export function resolveGeminiAdaptiveMaxOutputTokens(aggregateChars: number): number {
  const hardCap = resolveGeminiMaxOutputTokens();
  const shortTextCap = Math.min(resolveGeminiShortTextMaxOutputTokens(), hardCap);

  if (!Number.isFinite(aggregateChars) || aggregateChars <= 0) {
    return shortTextCap;
  }

  if (aggregateChars <= 7000) {
    return shortTextCap;
  }

  if (aggregateChars <= 14000) {
    return Math.min(hardCap, Math.max(shortTextCap, Math.round(hardCap * 0.9)));
  }

  return hardCap;
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

export function resolveGeminiTaxonomyGuidedEnabled(): boolean {
  return parseBoolean(process.env.CV_IMPORT_GEMINI_TAXONOMY_GUIDED, true);
}

export function resolveGeminiTaxonomyShortlistMaxEntries(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_MAX_ENTRIES,
    DEFAULT_TAXONOMY_SHORTLIST_MAX_ENTRIES
  );
}

export function resolveGeminiTaxonomyShortlistMaxTokens(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_MAX_TOKENS,
    DEFAULT_TAXONOMY_SHORTLIST_MAX_TOKENS
  );
}

export function resolveGeminiTaxonomyShortlistSeedLimit(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_SEED_LIMIT,
    DEFAULT_TAXONOMY_SHORTLIST_SEED_LIMIT
  );
}

export function resolveGeminiTaxonomyShortlistConcurrency(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_CONCURRENCY,
    DEFAULT_TAXONOMY_SHORTLIST_CONCURRENCY
  );
}

export function resolveGeminiTaxonomyShortlistQueryTimeoutMs(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_QUERY_TIMEOUT_MS,
    DEFAULT_TAXONOMY_SHORTLIST_QUERY_TIMEOUT_MS
  );
}

export function resolveGeminiTaxonomyShortlistDocumentTimeoutMs(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_DOCUMENT_TIMEOUT_MS,
    DEFAULT_TAXONOMY_SHORTLIST_DOCUMENT_TIMEOUT_MS
  );
}

export function resolveGeminiTaxonomyShortlistCacheTtlMs(): number {
  return parseInteger(
    process.env.CV_IMPORT_GEMINI_SHORTLIST_CACHE_TTL_MS,
    DEFAULT_TAXONOMY_SHORTLIST_CACHE_TTL_MS
  );
}

export function resolveGeminiTaxonomyVersion(): string {
  const value = process.env.CV_IMPORT_GEMINI_TAXONOMY_VERSION?.trim();
  if (!value) {
    return DEFAULT_TAXONOMY_VERSION;
  }
  return value.slice(0, 40);
}
