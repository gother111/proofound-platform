type EnvReader = Record<string, string | undefined>;

export type AiAssistFeature =
  | 'assignment_clarity'
  | 'privacy_preflight'
  | 'proof_pack_assistant'
  | 'verification_composer';

const FEATURE_ENV_KEYS: Record<AiAssistFeature, string> = {
  assignment_clarity: 'AI_KILL_SWITCH_ASSIGNMENT_CLARITY',
  privacy_preflight: 'AI_KILL_SWITCH_PRIVACY_PREFLIGHT',
  proof_pack_assistant: 'AI_KILL_SWITCH_PROOF_PACK_ASSISTANT',
  verification_composer: 'AI_KILL_SWITCH_VERIFICATION_COMPOSER',
};

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false;
  }
  return fallback;
}

export function isGlobalAiKillSwitchEnabled(env: EnvReader = process.env): boolean {
  return parseBoolean(env.AI_GLOBAL_KILL_SWITCH, false);
}

export function isAiAssistFeatureKillSwitchEnabled(
  feature: AiAssistFeature,
  env: EnvReader = process.env
): boolean {
  return parseBoolean(env[FEATURE_ENV_KEYS[feature]], false);
}

export function isAiAssistDisabledByKillSwitch(
  feature: AiAssistFeature,
  env: EnvReader = process.env
): boolean {
  return isGlobalAiKillSwitchEnabled(env) || isAiAssistFeatureKillSwitchEnabled(feature, env);
}

export function buildAiAssistKillSwitchResponse(
  feature: AiAssistFeature,
  env: EnvReader = process.env
) {
  const global = isGlobalAiKillSwitchEnabled(env);
  const featureLevel = isAiAssistFeatureKillSwitchEnabled(feature, env);

  return {
    error: 'AI assist is disabled',
    code: global ? 'ai_global_kill_switch' : 'ai_feature_kill_switch',
    feature,
    fallbackAvailable: true,
    disabled: global || featureLevel,
  };
}
