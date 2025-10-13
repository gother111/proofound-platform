import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type MutableCookieStore = Awaited<ReturnType<typeof cookies>> & {
  set?: (name: string, value: string, options?: CookieOptions) => void;
};

const DEFAULT_COOKIE_OPTIONS: Pick<CookieOptions, 'path' | 'sameSite'> = {
  path: '/',
  sameSite: 'lax',
};

function withDefaultOptions(options?: CookieOptions): CookieOptions {
  return { ...DEFAULT_COOKIE_OPTIONS, ...options };
}

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
