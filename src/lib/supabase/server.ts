import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseServerConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase server client is missing required NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_ANON_KEY) environment variables.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseServerConfig();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        const cookieStore = cookies();
        if (typeof cookieStore.set === 'function') {
          const cookieOptions: CookieOptions = {
            path: '/',
            ...options,
          };
          cookieStore.set({ name, value, ...cookieOptions });
        }
      },
      remove(name: string, options: CookieOptions) {
        const cookieStore = cookies();
        if (typeof cookieStore.set === 'function') {
          const cookieOptions: CookieOptions = {
            path: '/',
            maxAge: 0,
            expires: new Date(0),
            ...options,
          };
          cookieStore.set({ name, value: '', ...cookieOptions });
        }
      },
    },
  });
}
