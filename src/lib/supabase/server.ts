import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const err = new Error(
      'Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    ) as Error & { code?: string };
    err.code = 'ENV_MISCONFIG';
    throw err;
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
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
