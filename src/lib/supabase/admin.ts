import { createClient } from '@supabase/supabase-js';

import { assertMockDatabaseAllowed, isMockSupabaseEnabled } from '@/lib/env';

export function createAdminClient() {
  assertMockDatabaseAllowed('Supabase admin client');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (isMockSupabaseEnabled()) {
    console.log('Using Mock Admin Client');
    return {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
            single: async () => ({ data: null, error: null }),
          }),
        }),
        insert: async () => ({ data: null, error: null }),
        update: () => ({ eq: async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: async () => ({ data: null, error: null }) }),
      }),
      auth: {
        admin: {
          createUser: async () => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
          deleteUser: async () => ({ data: {}, error: null }),
        },
      },
    } as any;
  }

  if (!url || !serviceRole) {
    throw new Error('Missing SUPABASE env for admin client');
  }

  return createClient(url, serviceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
