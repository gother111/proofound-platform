type LaunchTrustedOriginsEnv =
  | NodeJS.ProcessEnv
  | {
      LAUNCH_TRUSTED_BASE_URLS?: string | undefined;
    };

export function trustedLaunchOrigins(env: LaunchTrustedOriginsEnv = process.env) {
  return (env.LAUNCH_TRUSTED_BASE_URLS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isTrustedLaunchSecretUrl(url: string, env: LaunchTrustedOriginsEnv = process.env) {
  try {
    const origin = new URL(url).origin;
    return (
      origin === 'https://proofound.io' ||
      origin === 'https://www.proofound.io' ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      trustedLaunchOrigins(env).includes(origin)
    );
  } catch {
    return false;
  }
}

export function shouldSendLaunchInternalAuth(params: {
  url: string;
  includeInternalAuth?: boolean;
  secret?: string | null;
  env?: LaunchTrustedOriginsEnv;
}) {
  const secret = params.secret?.trim();
  return Boolean(
    params.includeInternalAuth === true &&
      secret &&
      isTrustedLaunchSecretUrl(params.url, params.env)
  );
}
