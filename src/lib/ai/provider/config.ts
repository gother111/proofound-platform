type EnvReader = Record<string, string | undefined>;

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

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

export function resolveAiAssistantsEnabled(env: EnvReader = process.env): boolean {
  return parseBoolean(env.AI_ASSISTANTS_ENABLED, false);
}

export function resolveAiModelDefault(env: EnvReader = process.env): string {
  return env.AI_MODEL_DEFAULT?.trim() || DEFAULT_MODEL;
}

export function resolveAiModelFallback(env: EnvReader = process.env): string | null {
  return env.AI_MODEL_FALLBACK?.trim() || null;
}

export function resolveAiModelFallbackVerified(env: EnvReader = process.env): boolean {
  return (
    Boolean(resolveAiModelFallback(env)) && parseBoolean(env.AI_MODEL_FALLBACK_VERIFIED, false)
  );
}
