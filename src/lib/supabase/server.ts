import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type CreateClientOptions = {
  /**
   * When `true`, allow Supabase helpers to mutate response cookies.
   * Keep this disabled (default) inside React Server Components to avoid
   * Next.js runtime errors: "Cookies can only be modified in a Server Action or Route Handler".
   */
  allowCookieWrite?: boolean;
};

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

export async function createClient(options: CreateClientOptions = {}): Promise<SupabaseClient> {
  const { allowCookieWrite = false } = options;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim() || '';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    '';

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      '[supabase] URL or anon key missing; returning mock Supabase client for build-time safety.'
    );
    return mockSupabaseClient;
  }

  const cookieStore = await cookies();

  const warnCookieWrite = (action: 'set' | 'remove', name: string) => {
    if (allowCookieWrite) {
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[supabase] Ignoring cookie ${action} for "${name}" because allowCookieWrite=false. ` +
          'Enable via createClient({ allowCookieWrite: true }) inside a Server Action or Route Handler.'
      );
    }
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        if (!allowCookieWrite) {
          warnCookieWrite('set', name);
          return;
        }

        cookieStore.set({
          name,
          value,
          ...(options ?? {}),
        });
      },
      remove(name: string, options?: CookieOptions) {
        if (!allowCookieWrite) {
          warnCookieWrite('remove', name);
          return;
        }

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
