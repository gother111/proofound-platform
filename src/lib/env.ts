/**
 * Centralized environment access + friendly validation.
 * Accepts Supabase vars from either NEXT_PUBLIC_* or server-side SUPABASE_*.
 * Throws an error with code 'ENV_MISCONFIG' in strict mode when required envs are missing.
 */

type EnvShape = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  SITE_URL?: string;
  DATABASE_URL?: string;
};

const DATABASE_URL_CANDIDATES = [
  'DATABASE_URL',
  'SUPABASE_DB_URL',
  'SUPABASE_DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL_NON_POOLING',
] as const;

const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);

type EnvSource = Pick<NodeJS.ProcessEnv, string>;

function isEnabledFlag(value: string | undefined): boolean {
  return TRUE_VALUES.has((value ?? '').trim().toLowerCase());
}

function pickDatabaseUrl(): string | undefined {
  for (const key of DATABASE_URL_CANDIDATES) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function normalizeSiteUrl(
  value: string | null | undefined,
  { allowPreviewHosts = false }: { allowPreviewHosts?: boolean } = {}
): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
  const withScheme = hasScheme ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    const previewHost = isPreviewHostname(url.hostname);
    if (
      !allowPreviewHosts &&
      previewHost &&
      !isLocalHostname(url.hostname) &&
      !isPreviewDeployment()
    ) {
      return null;
    }

    return url.origin;
  } catch {
    return null;
  }
}

export function stripTrailingSlash(value: string): string {
  if (!value) {
    return value;
  }

  const stripped = value.replace(/\/+$/, '');
  return stripped.length > 0 ? stripped : '/';
}

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function isPreviewHostname(hostname: string): boolean {
  return /\.vercel\.app$/i.test(hostname);
}

function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production';
}

function isProductionLikeRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production' ||
    process.env.VERCEL_ENV === 'preview'
  );
}

export function isProductionDeployRuntime(env: EnvSource = process.env): boolean {
  const nodeEnv = env.NODE_ENV?.trim().toLowerCase();
  const vercelEnv = env.VERCEL_ENV?.trim().toLowerCase();
  const appEnv = (env.NEXT_PUBLIC_APP_ENV || env.APP_ENV)?.trim().toLowerCase();

  return nodeEnv === 'production' || vercelEnv === 'production' || appEnv === 'production';
}

export function isMockSupabaseEnabled(env: EnvSource = process.env): boolean {
  if (typeof window !== 'undefined') {
    return isEnabledFlag(process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE);
  }
  return isEnabledFlag(env.NEXT_PUBLIC_USE_MOCK_SUPABASE);
}

export function getEnabledMockDatabaseModes(env: EnvSource = process.env): string[] {
  const enabled: string[] = [];

  if (isMockSupabaseEnabled(env)) {
    enabled.push('NEXT_PUBLIC_USE_MOCK_SUPABASE');
  }

  if (isEnabledFlag(env.MOCK_ADMIN_MODE)) {
    enabled.push('MOCK_ADMIN_MODE');
  }

  if (isEnabledFlag(env.MOBILE_MOCK_AUTH)) {
    enabled.push('MOBILE_MOCK_AUTH');
  }

  const mockPlatformRole = env.MOCK_PLATFORM_ROLE?.trim();
  if (mockPlatformRole === 'platform_admin' || mockPlatformRole === 'super_admin') {
    enabled.push('MOCK_PLATFORM_ROLE');
  }

  return enabled;
}

export function assertMockDatabaseAllowed(context: string, env: EnvSource = process.env): void {
  if (!isProductionDeployRuntime(env)) {
    return;
  }

  const enabledMockModes = getEnabledMockDatabaseModes(env);
  if (!enabledMockModes.length) {
    return;
  }

  const err = new Error(
    `ENV_MISCONFIG: ${context} refused to use mock database/admin/auth mode in production. ` +
      `Disable: ${enabledMockModes.join(', ')}.`
  ) as Error & { code?: string };
  err.code = 'ENV_MISCONFIG';
  throw err;
}

function resolveProtocol(host: string, forwardedProto?: string): string {
  if (forwardedProto) {
    return forwardedProto;
  }

  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return 'http';
  }

  return 'https';
}

function getHeaderValue(
  h: Headers | Record<string, string | string[] | undefined>,
  key: string
): string {
  if (h instanceof Headers) {
    return h.get(key) ?? '';
  }

  const value = (h as Record<string, string | string[] | undefined>)[key];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return (value as string) ?? '';
}

function aggregateEnv(): EnvShape {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)?.trim();
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  )?.trim();
  const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL, {
    allowPreviewHosts: true,
  });

  return {
    SUPABASE_URL: supabaseUrl || undefined,
    SUPABASE_ANON_KEY: supabaseAnonKey || undefined,
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey || undefined,
    SITE_URL: siteUrl ? stripTrailingSlash(siteUrl) : undefined,
    DATABASE_URL: pickDatabaseUrl(),
  };
}

export function getEnv(
  strict: boolean = process.env.NODE_ENV === 'production'
): Required<EnvShape> {
  assertMockDatabaseAllowed('Environment validation');

  const env = aggregateEnv();
  const missing: string[] = [];

  // Check if mocks are enabled - if so, we don't need DATABASE_URL
  const allowMocks = isMockSupabaseEnabled();

  // Required keys depend on whether we're using mocks
  const requiredKeys: (keyof EnvShape)[] = allowMocks
    ? ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SITE_URL'] // Mocks don't need DATABASE_URL
    : ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SITE_URL', 'DATABASE_URL']; // Real Supabase needs DATABASE_URL

  for (const k of requiredKeys) {
    if (!env[k]) missing.push(k);
  }

  if (strict && missing.length) {
    const msg =
      `Missing required environment variables (${missing.join(', ')}). The app will fail in production without them.\n\n` +
      `How to fix:\n` +
      `- Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY) in your hosting env.\n` +
      `- Set NEXT_PUBLIC_SITE_URL (or SITE_URL) to your deployed domain (e.g., https://your-domain.tld).\n` +
      (allowMocks
        ? ''
        : `- Set DATABASE_URL (or SUPABASE_DB_URL/POSTGRES_URL) to your Postgres connection string (prefer ?sslmode=require). Drizzle migrations can use DIRECT_URL; if not set, DATABASE_URL is used.\n`) +
      `- In Supabase → Auth → URL configuration, set Site URL to NEXT_PUBLIC_SITE_URL and add redirect paths: /auth/callback, /reset-password/confirm, /verify-email.` +
      (allowMocks
        ? `\n- Note: Mocks are enabled (NEXT_PUBLIC_USE_MOCK_SUPABASE=true), so DATABASE_URL is not required.`
        : '');

    const err = new Error(msg) as Error & { code?: string };
    err.code = 'ENV_MISCONFIG';
    throw err;
  }

  // Cast with defaults (empty strings only occur if strict=false)
  return {
    SUPABASE_URL: env.SUPABASE_URL || '',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY || '',
    SITE_URL: env.SITE_URL || '',
    DATABASE_URL: env.DATABASE_URL || '',
  };
}

/**
 * Derive a canonical site URL:
 * - Prefer NEXT_PUBLIC_SITE_URL when set.
 * - Otherwise infer from request headers (x-forwarded-proto, host).
 */
export function resolveSiteUrlFromHeaders(
  h: Headers | Record<string, string | string[] | undefined>
): string {
  const localOrigin = normalizeSiteUrl(getHeaderValue(h, 'origin'), { allowPreviewHosts: true });
  if (localOrigin && isLocalUrl(localOrigin)) {
    return stripTrailingSlash(localOrigin);
  }

  const localForwardedHost = getHeaderValue(h, 'x-forwarded-host');
  if (localForwardedHost) {
    const forwardedProto = getHeaderValue(h, 'x-forwarded-proto') || 'https';
    const forwardedUrl = normalizeSiteUrl(`${forwardedProto}://${localForwardedHost}`, {
      allowPreviewHosts: true,
    });
    if (forwardedUrl && isLocalUrl(forwardedUrl)) {
      return stripTrailingSlash(forwardedUrl);
    }
  }

  const localHost = getHeaderValue(h, 'host');
  if (localHost) {
    const proto = resolveProtocol(localHost, getHeaderValue(h, 'x-forwarded-proto'));
    const hostUrl = normalizeSiteUrl(`${proto}://${localHost}`, { allowPreviewHosts: true });
    if (hostUrl && isLocalUrl(hostUrl)) {
      return stripTrailingSlash(hostUrl);
    }
  }

  const { SITE_URL: configuredSiteUrl } = aggregateEnv();
  if (configuredSiteUrl) {
    return stripTrailingSlash(configuredSiteUrl);
  }

  const origin = normalizeSiteUrl(getHeaderValue(h, 'origin'), { allowPreviewHosts: true });
  if (origin) {
    return stripTrailingSlash(origin);
  }

  const forwardedHost = getHeaderValue(h, 'x-forwarded-host');
  if (forwardedHost) {
    const forwardedProto = getHeaderValue(h, 'x-forwarded-proto') || 'https';
    const forwardedUrl = normalizeSiteUrl(`${forwardedProto}://${forwardedHost}`, {
      allowPreviewHosts: true,
    });
    if (forwardedUrl) {
      return stripTrailingSlash(forwardedUrl);
    }
  }

  const host = getHeaderValue(h, 'host');
  if (host) {
    const proto = resolveProtocol(host, getHeaderValue(h, 'x-forwarded-proto'));
    const hostUrl = normalizeSiteUrl(`${proto}://${host}`, { allowPreviewHosts: true });
    if (hostUrl) {
      return stripTrailingSlash(hostUrl);
    }
  }

  const referer = getHeaderValue(h, 'referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const normalizedReferer = normalizeSiteUrl(refererUrl.origin, { allowPreviewHosts: true });
      if (normalizedReferer) {
        return stripTrailingSlash(normalizedReferer);
      }
    } catch {
      // Ignore malformed referer header values
    }
  }

  const vercelUrl = normalizeSiteUrl(process.env.VERCEL_URL, { allowPreviewHosts: true });
  if (vercelUrl) {
    return stripTrailingSlash(vercelUrl);
  }

  return '';
}

/**
 * Resolve the canonical public site URL for security-sensitive links.
 * Production-like runtimes require an explicit configured URL.
 * Local and test environments may fall back to localhost for developer ergonomics.
 */
export function resolveCanonicalSiteUrl(): string {
  const { SITE_URL: configuredSiteUrl } = aggregateEnv();
  if (configuredSiteUrl) {
    return stripTrailingSlash(configuredSiteUrl);
  }

  if (!isProductionLikeRuntime()) {
    return 'http://localhost:3000';
  }

  return '';
}

function isLocalUrl(value: string): boolean {
  try {
    return isLocalHostname(new URL(value).hostname);
  } catch {
    return false;
  }
}
