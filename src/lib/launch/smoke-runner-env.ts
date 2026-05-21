const LIVE_FORBIDDEN_SCENARIO_ENV_KEYS = [
  'PROOFOUND_SKIP_TRANSACTIONAL_EMAIL_DELIVERY',
  'PROOFOUND_LOCAL_SMOKE_RATE_LIMIT_FALLBACK',
  'PROOFOUND_LOCAL_SMOKE_ALLOW_INSECURE_CSRF_COOKIE',
] as const;

export function buildLaunchSmokeScenarioEnv({
  executionMode,
  baseUrl,
  sharedEnv,
  scenarioEnv,
}: {
  executionMode: 'local' | 'live';
  baseUrl: string;
  sharedEnv: Record<string, string>;
  scenarioEnv?: Record<string, string | undefined>;
}) {
  const env: Record<string, string | undefined> = {
    ...sharedEnv,
    ...scenarioEnv,
  };

  if (executionMode === 'live') {
    for (const key of LIVE_FORBIDDEN_SCENARIO_ENV_KEYS) {
      delete env[key];
    }

    if (!env.BASE_URL?.trim()) {
      env.BASE_URL = baseUrl;
    }
  }

  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );
}
