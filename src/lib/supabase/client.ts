import { createBrowserClient } from '@supabase/ssr';
import { assertMockDatabaseAllowed, getEnv, isMockSupabaseEnabled } from '@/lib/env';

const MOCK_USER_ID = '88888888-8888-4888-8888-888888888888';
const ORG_ID = '99999999-9999-4999-9999-999999999999';
const getMockPersona = () => (process.env.MOCK_ORG_MODE === 'true' ? 'org_member' : 'individual');
const isMockAdminTestContext = () =>
  process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT === 'true';
const getMockPlatformRole = (): 'platform_admin' | 'super_admin' | null => {
  if (!isMockAdminTestContext()) return null;

  const explicitRole = process.env.MOCK_PLATFORM_ROLE?.trim();
  if (explicitRole === 'platform_admin' || explicitRole === 'super_admin') {
    return explicitRole;
  }

  return process.env.MOCK_ADMIN_MODE === 'true' ? 'platform_admin' : null;
};

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
    signInWithPassword: async (credentials: { email?: string; password?: string }) => {
      const email = (credentials?.email ?? '').trim().toLowerCase();
      const password = credentials?.password ?? '';

      const shouldFail =
        !email ||
        !password ||
        email.includes('nonexistent') ||
        password.startsWith('Wrong') ||
        password.includes('WrongPassword');

      if (shouldFail) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials', status: 400 },
        };
      }

      return { data: { user: { id: MOCK_USER_ID }, session: {} }, error: null };
    },
    signOut: async () => ({ error: null }),
    signUp: async (payload: { email?: string; password?: string }) => {
      const email = (payload?.email ?? '').trim().toLowerCase();

      if (email.includes('existing@')) {
        return { data: { user: { id: MOCK_USER_ID, identities: [] }, session: {} }, error: null };
      }

      return {
        data: {
          user: {
            id: MOCK_USER_ID,
            identities: [
              { id: 'mock-identity-id', provider: 'email', created_at: new Date().toISOString() },
            ],
          },
          session: {},
        },
        error: null,
      };
    },
    resetPasswordForEmail: async () => ({ data: {}, error: null }),
    verifyOtp: async (payload: { token_hash?: string }) => {
      const token = (payload?.token_hash ?? '').trim();
      const shouldFail = !token || token.includes('invalid') || token.length < 8;

      if (shouldFail) {
        return {
          data: { user: null, session: null },
          error: { message: 'Invalid or expired verification link', status: 400 },
        };
      }

      return { data: { user: { id: MOCK_USER_ID }, session: {} }, error: null };
    },
    exchangeCodeForSession: async (code: string) => {
      const normalized = (code || '').trim().toLowerCase();
      if (!normalized || normalized.includes('invalid')) {
        return {
          data: { session: null, user: null },
          error: { message: 'Invalid auth code', status: 400 },
        };
      }
      return { data: { session: {}, user: { id: MOCK_USER_ID } }, error: null };
    },
    resend: async () => ({ data: {}, error: null }),
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
        or: () => chain,
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => {
          if (table === 'profiles') {
            return {
              data: {
                id: MOCK_USER_ID,
                platform_role: getMockPlatformRole(),
                tour_completed: false,
                persona: getMockPersona(),
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
                    role: 'org_manager',
                    state: 'active',
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
                role: 'org_manager',
                state: 'active',
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
                role: 'org_manager',
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
  assertMockDatabaseAllowed('Supabase browser client');

  if (isMockSupabaseEnabled()) {
    return mockSupabaseClient;
  }
  // Client-side doesn't need DATABASE_URL, so use non-strict mode
  // but still validate Supabase URL and key (no baked-in defaults)
  const { SUPABASE_URL: supabaseUrl, SUPABASE_ANON_KEY: supabaseKey } = getEnv(false);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing required Supabase environment variables: ` +
        `${!supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL ' : ''}` +
        `${!supabaseKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''}`.trim()
    );
  }

  return createBrowserClient(supabaseUrl.trim(), supabaseKey.trim());
}
