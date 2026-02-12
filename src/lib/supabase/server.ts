import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

type CreateClientOptions = {
  allowCookieWrite?: boolean;
};

function shouldUseMockServerClient(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true';
}

async function loadMockServerClient(): Promise<SupabaseClient> {
  const { createMockServerClient } = await import('./mock-server-client');
  return createMockServerClient();
}

export async function createClient(options: CreateClientOptions = {}): Promise<SupabaseClient> {
  const { allowCookieWrite = false } = options;

  if (shouldUseMockServerClient()) {
    return loadMockServerClient();
  }

  const cookieStore = await cookies();

  // Strictly require Supabase credentials (no baked-in defaults)
  // Use non-strict env loading to avoid blocking auth flows on DATABASE_URL in production
  const { SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: supabaseKey } = getEnv(false);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('ENV_MISCONFIG: Missing Supabase URL or anon key');
  }

  return createSupabaseServerClient(supabaseUrl.trim(), supabaseKey.trim(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!allowCookieWrite) {
          return;
        }

        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if middleware handles session refresh.
        }
      },
    },
  });
}
