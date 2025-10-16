import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

export async function createClient() {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getEnv(false);

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    const err = new Error(
      'Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_URL/SUPABASE_ANON_KEY.'
    ) as Error & { code?: string };
    err.code = 'ENV_MISCONFIG';
    throw err;
  }

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        cookieStore.set({
          name,
          value,
          ...(options ?? {}),
        });
      },
      remove(name: string, options?: CookieOptions) {
        cookieStore.set({
          name,
          value: '',
          ...(options ?? {}),
          maxAge: 0,
        });
      },
    },
  });
}
