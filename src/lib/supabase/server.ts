import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const mockSupabaseClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Supabase not configured') }),
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: null, error: new Error('Supabase not configured') }),
    resetPasswordForEmail: async () => ({
      data: null,
      error: new Error('Supabase not configured'),
    }),
    verifyOtp: async () => ({ data: null, error: new Error('Supabase not configured') }),
  },
  from: () => ({
    insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
    update: () => ({
      eq: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
    select: () => ({ eq: async () => ({ data: [], error: new Error('Supabase not configured') }) }),
  }),
  rpc: async () => ({ data: null, error: new Error('Supabase not configured') }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error('Supabase not configured') }),
    }),
  },
  schema: () => ({}),
} as unknown as SupabaseClient;

export async function createClient(): Promise<SupabaseClient> {
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
    console.warn(
      '[supabase] URL or anon key missing; returning mock Supabase client for build-time safety.'
    );
    return mockSupabaseClient;
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
