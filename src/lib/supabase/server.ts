import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();
  const { SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: supabaseAnonKey } = getEnv(false);

  if (!supabaseUrl || !supabaseAnonKey) {
    const err = new Error(
      'Supabase Auth is not configured (missing SUPABASE_URL/ANON_KEY).'
    ) as Error & { code?: string };
    err.code = 'ENV_MISCONFIG';
    throw err;
  }

  const cookieStore = (await cookies()) as MutableCookieStore;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        if (typeof cookieStore.set === 'function') {
          cookieStore.set(name, value, withDefaultOptions(options));
          return;
        }

        console.warn(
          'Supabase attempted to set an auth cookie in a read-only context. Ensure createClient() is only used inside server actions or route handlers.'
        );
      },
      remove(name: string, options: CookieOptions) {
        if (typeof cookieStore.set === 'function') {
          const removalOptions = withDefaultOptions({
            maxAge: 0,
            expires: new Date(0),
            ...options,
          });

          cookieStore.set(name, '', removalOptions);
          return;
        }

        console.warn(
          'Supabase attempted to remove an auth cookie in a read-only context. Ensure createClient() is only used inside server actions or route handlers.'
        );
      },
    },
  });
}
