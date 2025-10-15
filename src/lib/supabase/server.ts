import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

export async function createClient() {
  const cookieJar = cookies();
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
        return cookieJar.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieJar.set({ name, value, ...options });
        } catch (error) {
          // Handle cookie setting errors in Server Components
        }

        console.warn(
          'Supabase attempted to set an auth cookie in a read-only context. Ensure createClient() is only used inside server actions or route handlers.'
        );
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieJar.set({ name, value: '', ...options });
        } catch (error) {
          // Handle cookie removal errors in Server Components
        }

        console.warn(
          'Supabase attempted to remove an auth cookie in a read-only context. Ensure createClient() is only used inside server actions or route handlers.'
        );
      },
    },
  });
}
