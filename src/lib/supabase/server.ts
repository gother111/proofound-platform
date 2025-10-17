import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '';

  const defaultCookieOptions: CookieOptions = {
    path: '/',
    sameSite: 'lax',
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    const err = new Error(
      'Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_ANON_KEY.'
    ) as Error & { code?: string };
    err.code = 'ENV_MISCONFIG';
    throw err;
  }

  const cookieStore = await cookies();

  const applyCookieMutation = (name: string, value: string, overrides?: CookieOptions) => {
    const mergedOptions: CookieOptions = {
      ...defaultCookieOptions,
      ...(overrides ?? {}),
    };

    const setFn = (cookieStore as { set?: unknown }).set;

    if (typeof setFn === 'function') {
      try {
        (setFn as (name: string, value: string, options: CookieOptions) => void)(
          name,
          value,
          mergedOptions
        );
      } catch (error) {
        (setFn as (options: CookieOptions & { name: string; value: string }) => void)({
          name,
          value,
          ...mergedOptions,
        });
      }

      return;
    }

    console.warn('Supabase cookie store is read-only. Unable to modify cookie.', { name });
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        applyCookieMutation(name, value, options);
      },
      remove(name: string, options?: CookieOptions) {
        const expiresOption = options?.expires;
        const expires =
          expiresOption instanceof Date
            ? expiresOption
            : expiresOption
              ? new Date(expiresOption)
              : new Date(0);

        applyCookieMutation(name, '', {
          ...(options ?? {}),
          maxAge: 0,
          expires,
        });
      },
    },
  });
}
