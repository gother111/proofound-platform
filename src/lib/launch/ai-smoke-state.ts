export type AiLaunchSmokeState = {
  assistantsEnabled: boolean;
  rawPromptLoggingEnabled: boolean;
  modelCallRequired: false;
  state:
    | 'disabled_fallback_verified'
    | 'enabled_without_smoke_model_call'
    | 'disabled_local_fallback_verified';
};

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
}

export function buildAiLaunchSmokeState(params: {
  executionMode: 'local' | 'live';
  env?: Record<string, string | undefined>;
}): AiLaunchSmokeState {
  const env = params.env ?? process.env;
  const assistantsEnabled = parseBoolean(env.AI_ASSISTANTS_ENABLED, false);
  const rawPromptLoggingEnabled = parseBoolean(env.AI_RAW_PROMPT_LOGGING_ENABLED, false);
  const productionPilot =
    params.executionMode === 'live' ||
    env.VERCEL_ENV === 'production' ||
    env.NEXT_PUBLIC_APP_ENV === 'production';

  return {
    assistantsEnabled,
    rawPromptLoggingEnabled,
    modelCallRequired: false,
    state:
      !assistantsEnabled && productionPilot
        ? 'disabled_fallback_verified'
        : assistantsEnabled
          ? 'enabled_without_smoke_model_call'
          : 'disabled_local_fallback_verified',
  };
}
