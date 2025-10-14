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

function aggregateEnv(): EnvShape {
  return {
    SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SITE_URL: (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, ''),
    DATABASE_URL: process.env.DATABASE_URL,
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
      `- Set NEXT_PUBLIC_SITE_URL to your deployed domain (e.g., https://your-domain.tld).\n` +
      `- Set DATABASE_URL to your Postgres connection string (e.g., from Supabase; Prefer ?sslmode=require).\n` +
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
export function resolveSiteUrlFromHeaders(h: Headers | Record<string, string | string[] | undefined>): string {
  const fromEnv = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  if (fromEnv) return fromEnv;

  const get = (key: string) => {
    if (h instanceof Headers) return h.get(key) || '';
    const v = (h as any)[key];
    if (Array.isArray(v)) return v[0] || '';
    return (v as string) || '';
  };

  const proto = get('x-forwarded-proto') || 'https';
  const host = get('x-forwarded-host') || get('host');
  if (!host) return '';
  return `${proto}://${host}`;
}
