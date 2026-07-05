export type AiProviderPolicyProvider =
  | 'disabled'
  | 'mock'
  | 'gemini'
  | 'deepseek_v4_flash'
  | 'nvidia_deepseek_v4_flash';

export type AiProviderPolicyFeature = 'start_from_cv' | 'assistive_ai';
export type AiProviderDataClassification = 'synthetic' | 'deidentified' | 'personal_data';

export type AiProviderPolicyDecision = {
  ok: boolean;
  provider: AiProviderPolicyProvider;
  feature: AiProviderPolicyFeature;
  dataClassification: AiProviderDataClassification;
  reason: string | null;
  warnings: string[];
};

type EnvReader = Record<string, string | undefined>;

type ProviderPolicy = {
  provider: AiProviderPolicyProvider;
  liveAdapterAvailable: boolean;
  productionAllowed: boolean;
  personalDataEnabledByDefault: boolean;
  allowedFeatures: ReadonlySet<AiProviderPolicyFeature>;
  allowedData: ReadonlySet<AiProviderDataClassification>;
  warnings: string[];
};

const PROVIDER_POLICIES: Record<AiProviderPolicyProvider, ProviderPolicy> = {
  disabled: {
    provider: 'disabled',
    liveAdapterAvailable: false,
    productionAllowed: false,
    personalDataEnabledByDefault: false,
    allowedFeatures: new Set(),
    allowedData: new Set(),
    warnings: ['AI provider is disabled; deterministic drafting must be used.'],
  },
  mock: {
    provider: 'mock',
    liveAdapterAvailable: false,
    productionAllowed: false,
    personalDataEnabledByDefault: false,
    allowedFeatures: new Set(['start_from_cv', 'assistive_ai']),
    allowedData: new Set(['synthetic', 'deidentified']),
    warnings: ['Mock provider may be used only for local or synthetic evaluation.'],
  },
  gemini: {
    provider: 'gemini',
    liveAdapterAvailable: true,
    productionAllowed: true,
    personalDataEnabledByDefault: true,
    allowedFeatures: new Set(['start_from_cv', 'assistive_ai']),
    allowedData: new Set(['synthetic', 'deidentified', 'personal_data']),
    warnings: ['Gemini uses the existing assistive AI controls and redacted input path.'],
  },
  deepseek_v4_flash: {
    provider: 'deepseek_v4_flash',
    liveAdapterAvailable: true,
    productionAllowed: false,
    personalDataEnabledByDefault: false,
    allowedFeatures: new Set(['start_from_cv']),
    allowedData: new Set(['synthetic', 'deidentified', 'personal_data']),
    warnings: [
      'DeepSeek V4 Flash uses the guarded Start from CV adapter and redacted input path.',
      'Personal CV data requires START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED=true.',
    ],
  },
  nvidia_deepseek_v4_flash: {
    provider: 'nvidia_deepseek_v4_flash',
    liveAdapterAvailable: false,
    productionAllowed: false,
    personalDataEnabledByDefault: false,
    allowedFeatures: new Set(['start_from_cv']),
    allowedData: new Set(['synthetic', 'deidentified']),
    warnings: ['NVIDIA-hosted DeepSeek trials must stay synthetic or deidentified until approved.'],
  },
};

export function resolveConfiguredAiProviderId(
  env: EnvReader = process.env
): AiProviderPolicyProvider {
  const raw = (env.START_FROM_CV_AI_PROVIDER || env.AI_PROVIDER || 'gemini')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '');

  switch (raw) {
    case '':
    case 'disabled':
    case 'none':
      return 'disabled';
    case 'mock':
    case 'fake':
      return 'mock';
    case 'gemini':
    case 'google':
    case 'google_gemini':
      return 'gemini';
    case 'deepseek':
    case 'deepseek-v4-flash':
    case 'deepseek_v4_flash':
      return 'deepseek_v4_flash';
    case 'nvidia':
    case 'nvidia-deepseek':
    case 'nvidia_deepseek':
    case 'nvidia-deepseek-v4-flash':
    case 'nvidia_deepseek_v4_flash':
      return 'nvidia_deepseek_v4_flash';
    default:
      return 'disabled';
  }
}

export function resolveAiProviderPolicyDecision(input: {
  feature: AiProviderPolicyFeature;
  dataClassification: AiProviderDataClassification;
  env?: EnvReader;
  requireLiveAdapter?: boolean;
}): AiProviderPolicyDecision {
  const provider = resolveConfiguredAiProviderId(input.env);
  const policy = PROVIDER_POLICIES[provider];
  const warnings = [...policy.warnings];

  if (provider === 'disabled') {
    return {
      ok: false,
      provider,
      feature: input.feature,
      dataClassification: input.dataClassification,
      reason: 'provider_disabled',
      warnings,
    };
  }

  if (!policy.allowedFeatures.has(input.feature)) {
    return {
      ok: false,
      provider,
      feature: input.feature,
      dataClassification: input.dataClassification,
      reason: 'feature_not_allowed',
      warnings,
    };
  }

  if (!policy.allowedData.has(input.dataClassification)) {
    return {
      ok: false,
      provider,
      feature: input.feature,
      dataClassification: input.dataClassification,
      reason: 'data_classification_not_allowed',
      warnings,
    };
  }

  if (
    input.dataClassification === 'personal_data' &&
    !policy.personalDataEnabledByDefault &&
    !isProviderPersonalDataEnabled(provider, input.env ?? process.env)
  ) {
    return {
      ok: false,
      provider,
      feature: input.feature,
      dataClassification: input.dataClassification,
      reason: 'personal_data_not_enabled',
      warnings,
    };
  }

  if (input.requireLiveAdapter && !policy.liveAdapterAvailable) {
    return {
      ok: false,
      provider,
      feature: input.feature,
      dataClassification: input.dataClassification,
      reason: 'live_adapter_unavailable',
      warnings,
    };
  }

  if (isProductionLikeEnv(input.env ?? process.env) && !policy.productionAllowed) {
    if (
      provider === 'deepseek_v4_flash' &&
      isTruthy((input.env ?? process.env).START_FROM_CV_DEEPSEEK_PRODUCTION_ENABLED)
    ) {
      return {
        ok: true,
        provider,
        feature: input.feature,
        dataClassification: input.dataClassification,
        reason: null,
        warnings,
      };
    }
    return {
      ok: false,
      provider,
      feature: input.feature,
      dataClassification: input.dataClassification,
      reason: 'production_not_allowed',
      warnings,
    };
  }

  return {
    ok: true,
    provider,
    feature: input.feature,
    dataClassification: input.dataClassification,
    reason: null,
    warnings,
  };
}

function isProviderPersonalDataEnabled(
  provider: AiProviderPolicyProvider,
  env: EnvReader
): boolean {
  if (provider === 'deepseek_v4_flash') {
    return isTruthy(env.START_FROM_CV_DEEPSEEK_PERSONAL_DATA_ENABLED);
  }
  return false;
}

function isTruthy(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
}

function isProductionLikeEnv(env: EnvReader): boolean {
  return (
    env.NODE_ENV?.trim().toLowerCase() === 'production' ||
    env.VERCEL_ENV?.trim().toLowerCase() === 'production' ||
    env.APP_ENV?.trim().toLowerCase() === 'production' ||
    env.NEXT_PUBLIC_APP_ENV?.trim().toLowerCase() === 'production'
  );
}
