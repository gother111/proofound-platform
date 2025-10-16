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
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const supabaseAnonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  ).trim();
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

export function getEnv(strict: boolean = process.env.NODE_ENV === 'production'): Required<EnvShape> {
  const env = aggregateEnv();
  const missing: string[] = [];

  const requiredKeys: (keyof EnvShape)[] = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SITE_URL', 'DATABASE_URL'];
  for (const k of requiredKeys) {
    if (!env[k]) missing.push(k);
  }

  if (strict && missing.length) {
    const msg =
      `Missing required environment variables: ${missing.join(', ')}.\n\n` +
      `How to fix:\n` +
      `- Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY) in your hosting env.\n` +
      `- Set NEXT_PUBLIC_SITE_URL (or SITE_URL) to your deployed domain (e.g., https://your-domain.tld).\n` +
      `- Set DATABASE_URL (or SUPABASE_DB_URL/POSTGRES_URL) to your Postgres connection string (e.g., from Supabase; Prefer ?sslmode=require).\n` +
      `- In Supabase → Auth → URL configuration, set Site URL to NEXT_PUBLIC_SITE_URL and add redirect paths: /auth/callback, /reset-password/confirm, /verify-email.`;

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
