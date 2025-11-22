import { createBrowserClient } from '@supabase/ssr';
import { getEnv } from '@/lib/env';

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
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },
  from: (table: string) => ({
    select: (query?: string) => {
      const chain: any = {
        eq: (col: string, val: any) => {
          // Store filters if needed, for now just return chain
          if (table === 'organization_members' && col === 'user_id' && val === MOCK_USER_ID) {
            // Filter for this user
          }
          return chain;
        },
        in: () => chain,
        single: async () => ({ data: null, error: null }),
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
        order: () => chain,
        limit: () => chain,
      };

      chain.then = (resolve: any) => {
        if (table === 'user_skills') {
          const skills = Array(10)
            .fill(0)
            .map((_, i) => ({ id: `skill-${i}`, skill_id: `s-${i}`, level: 'L4' }));
          resolve({ data: skills, error: null });
          return;
        }
        if (table === 'organization_members') {
          // For getUserOrganizations
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
                  // ... other fields as needed
                },
              },
            ],
            error: null,
          });
          return;
        }
        resolve({ data: [], error: null });
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
} as any;

export function createClient() {
  console.log('createClient called, env:', process.env.NODE_ENV);
  if (process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true') {
    console.log('Returning mock Supabase client (ORG MODE)');
    return mockSupabaseClient;
  }
  const env = getEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
