import { createBrowserClient } from '@supabase/ssr';

import { getEnv } from '@/lib/env';

export function createClient() {
  const { SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: supabaseAnonKey } = getEnv(false);

  if (!supabaseUrl || !supabaseAnonKey) {
    const err = new Error(
      'Supabase Auth is not configured (missing SUPABASE_URL/ANON_KEY).'
    ) as Error & { code?: string };
    err.code = 'ENV_MISCONFIG';
    throw err;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
