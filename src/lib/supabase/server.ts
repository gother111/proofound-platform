import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';

type CreateClientOptions = {
  allowCookieWrite?: boolean;
};

const MOCK_USER_ID = '88888888-8888-4888-8888-888888888888';
const ORG_ID = '99999999-9999-4999-9999-999999999999';

const mockSupabaseClient = {
  auth: {
    getSession: async () => ({
      data: {
        session: {
          user: { id: MOCK_USER_ID, email: 'admin@test-org.com', role: 'authenticated' },
          access_token: 'mock-token',
        },
      },
      error: null,
    }),
    getUser: async () => ({
      data: {
        user: { id: MOCK_USER_ID, email: 'admin@test-org.com', role: 'authenticated' },
      },
      error: null,
    }),
    signInWithPassword: async () => ({
      data: { user: { id: MOCK_USER_ID }, session: {} },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: { user: { id: MOCK_USER_ID }, session: {} }, error: null }),
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    verifyOtp: async () => ({ data: { user: { id: MOCK_USER_ID }, session: {} }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: (query?: string) => {
      const chain: any = {
        eq: (col: string, val: any) => {
          // If querying organization_members list for the org
          if (table === 'organization_members' && col === 'org_id') {
            chain.then = (resolve: any) => {
              resolve({
                data: [
                  {
                    orgId: ORG_ID,
                    userId: MOCK_USER_ID,
                    role: 'admin',
                    status: 'active',
                    profiles: {
                      id: MOCK_USER_ID,
                      displayName: 'Org Admin',
                      handle: 'orgadmin',
                    },
                  },
                ],
                error: null,
              });
            };
          }
          // If querying getUserOrganizations
          if (table === 'organization_members' && col === 'user_id') {
            chain.eq = (col2: string, val2: any) => {
              chain.then = (resolve: any) => {
                resolve({
                  data: [
                    {
                      orgId: ORG_ID,
                      userId: MOCK_USER_ID,
                      role: 'admin',
                      status: 'active',
                      joinedAt: new Date().toISOString(),
                      org: {
                        id: ORG_ID,
                        slug: 'test-org',
                        displayName: 'Test Organization',
                        slug: 'test-org',
                      },
                    },
                  ],
                  error: null,
                });
              };
              return chain;
            };
          }
          return chain;
        },
        maybeSingle: async () => {
          if (table === 'profiles') {
            return {
              data: {
                id: MOCK_USER_ID,
                platform_role: null,
                tour_completed: false,
                persona: 'org_member',
              },
              error: null,
            };
          }
          if (table === 'organizations') {
            // For getActiveOrg
            return {
              data: {
                id: ORG_ID,
                slug: 'test-org',
                displayName: 'Test Organization',
                type: 'company',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                membership: [
                  {
                    orgId: ORG_ID,
                    userId: MOCK_USER_ID,
                    role: 'admin',
                    status: 'active',
                    joinedAt: new Date().toISOString(),
                  },
                ],
              },
              error: null,
            };
          }
          if (table === 'organization_members') {
            // For assertOrgRole
            return {
              data: {
                orgId: ORG_ID,
                userId: MOCK_USER_ID,
                role: 'admin',
                status: 'active',
                joinedAt: new Date().toISOString(),
              },
              error: null,
            };
          }
          return { data: null, error: null };
        },
        single: async () => {
          if (table === 'profiles') {
            return {
              data: {
                id: MOCK_USER_ID,
                platform_role: null,
                tour_completed: false,
                persona: 'org_member',
              },
              error: null,
            };
          }
          return { data: null, error: null };
        },
      };
      return chain;
    },
    insert: async () => ({ data: [], error: null }),
    update: async () => ({ data: [], error: null }),
  }),
  rpc: async () => ({ data: null, error: null }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } }),
    }),
  },
} as unknown as SupabaseClient;

export async function createClient(options: CreateClientOptions = {}): Promise<SupabaseClient> {
  const { allowCookieWrite = false } = options;

  // FORCE MOCK AUTH FOR TESTING
  if (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    return mockSupabaseClient;
  }

  const cookieStore = await cookies();
  const env = getEnv(false);

  // Use defaults if env vars aren't set (from aggregateEnv defaults)
  const supabaseUrl =
    env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://cjpfrgmsxwxhuomnvciq.supabase.co';
  const supabaseKey =
    env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcGZyZ21zeHd4aHVvbW52Y2lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxODM3NzEsImV4cCI6MjA3NTc1OTc3MX0.3QEig0RLF9rpf6pCURJ9WGTksGQLLC5gfKeKRn5TPQk';

  // Validate that we have both URL and key before creating client
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing required Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.`
    );
  }

  return createSupabaseServerClient({
    supabaseUrl: supabaseUrl.trim(),
    supabaseKey: supabaseKey.trim(),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (allowCookieWrite) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        }
      },
    },
  });
}
