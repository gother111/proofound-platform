import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const MOCK_USER_ID = '88888888-8888-4888-8888-888888888888';
const ORG_ID = '99999999-9999-4999-9999-999999999999';

// Determine if mock should return org_member persona for local visual/testing surfaces.
const getMockPersona = async () => {
  try {
    const cookieStore = await cookies();
    const personaCookie = cookieStore.get('proofound-mock-persona')?.value;
    if (personaCookie === 'org_member' || personaCookie === 'individual') {
      return personaCookie;
    }
  } catch {
    // Fall back to process.env outside request-bound mock server contexts.
  }
  return process.env.MOCK_ORG_MODE === 'true' ? 'org_member' : 'individual';
};
const isMockAdminTestContext = () =>
  process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT === 'true';
const visualFixturesEnabled = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE === 'true' &&
  process.env.PROOFOUND_VISUAL_FIXTURES === 'true' &&
  process.env.VERCEL_ENV !== 'production';
const getMockPlatformRole = (): 'platform_admin' | 'super_admin' | null => {
  if (!isMockAdminTestContext()) return null;

  const explicitRole = process.env.MOCK_PLATFORM_ROLE?.trim();
  if (explicitRole === 'platform_admin' || explicitRole === 'super_admin') {
    return explicitRole;
  }

  return process.env.MOCK_ADMIN_MODE === 'true' ? 'platform_admin' : null;
};

const mockVerificationFeedSkills = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    profile_id: MOCK_USER_ID,
    skill_code: '02.043.337.95036',
    custom_skill_name: null,
    level: 4,
    relevance: 'current',
    lastUsedAt: new Date().toISOString(),
    skills_taxonomy: {
      name_i18n: { en: 'Budget management' },
      skills_l3: {
        name_i18n: { en: 'Project Planning' },
        skills_subcategories: {
          name_i18n: { en: 'Management' },
          skills_categories: {
            name_i18n: { en: 'Functional Competencies' },
          },
        },
      },
    },
  },
  {
    id: 'skill-1',
    profile_id: MOCK_USER_ID,
    skill_code: 'react',
    custom_skill_name: null,
    level: 4,
    relevance: 'current',
    lastUsedAt: new Date().toISOString(),
    skills_taxonomy: {
      name_i18n: { en: 'React' },
      skills_l3: {
        name_i18n: { en: 'Frontend Frameworks' },
        skills_subcategories: {
          name_i18n: { en: 'Frontend Development' },
          skills_categories: {
            name_i18n: { en: 'Tools & Technologies' },
          },
        },
      },
    },
  },
  {
    id: 'skill-2',
    profile_id: MOCK_USER_ID,
    skill_code: 'typescript',
    custom_skill_name: null,
    level: 5,
    relevance: 'current',
    lastUsedAt: new Date().toISOString(),
    skills_taxonomy: {
      name_i18n: { en: 'TypeScript' },
      skills_l3: {
        name_i18n: { en: 'Frontend Frameworks' },
        skills_subcategories: {
          name_i18n: { en: 'Frontend Development' },
          skills_categories: {
            name_i18n: { en: 'Tools & Technologies' },
          },
        },
      },
    },
  },
];

const mockVerificationFeedProfiles = [
  {
    id: MOCK_USER_ID,
    display_name: 'Mock Individual',
    handle: 'mock-individual',
    avatar_url: null,
  },
];

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

      // Deterministic failures for E2E coverage.
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

      return {
        data: { user: { id: MOCK_USER_ID }, session: {} },
        error: null,
      };
    },
    signInWithOAuth: async (payload: {
      provider?: string;
      options?: { redirectTo?: string | undefined };
    }) => {
      const provider = (payload?.provider ?? '').trim();
      if (provider !== 'google' && provider !== 'linkedin_oidc') {
        return {
          data: { provider, url: null },
          error: { message: 'Unsupported OAuth provider', status: 400 },
        };
      }

      const redirectTo = payload?.options?.redirectTo || 'http://localhost/auth/callback';
      const authorizeUrl = new URL('/auth/v1/authorize', redirectTo);
      authorizeUrl.searchParams.set('provider', provider);
      authorizeUrl.searchParams.set('redirect_to', redirectTo);

      return {
        data: { provider, url: authorizeUrl.toString() },
        error: null,
      };
    },
    signOut: async () => ({ error: null }),
    signUp: async (payload: { email?: string; password?: string }) => {
      const email = (payload?.email ?? '').trim().toLowerCase();

      // Simulate "email already registered" by returning no identities (Supabase behavior).
      if (email.includes('existing@')) {
        return {
          data: {
            user: { id: MOCK_USER_ID, identities: [] },
            session: {},
          },
          error: null,
        };
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
      if (table === 'skills_categories') {
        const chain: any = {
          order: () => ({
            then: (resolve: any) => {
              resolve({
                data: [
                  {
                    cat_id: 1,
                    slug: 'universal',
                    name_i18n: { en: 'Universal Capabilities' },
                    display_order: 1,
                  },
                  {
                    cat_id: 2,
                    slug: 'functional',
                    name_i18n: { en: 'Functional Competencies' },
                    display_order: 2,
                  },
                  {
                    cat_id: 3,
                    slug: 'tools',
                    name_i18n: { en: 'Tools & Technologies' },
                    display_order: 3,
                  },
                ],
                error: null,
              });
            },
          }),
          select: () => chain,
        };
        return chain;
      }

      if (table === 'skills_subcategories') {
        const chain: any = {
          select: () => ({
            then: (resolve: any) => {
              resolve({
                data: [
                  { subcat_id: 10, cat_id: 3, name_i18n: { en: 'Frontend Development' } },
                  { subcat_id: 20, cat_id: 2, name_i18n: { en: 'Management' } },
                ],
                error: null,
              });
            },
          }),
        };
        return chain;
      }

      if (table === 'skills') {
        return {
          eq: (_col: string, _value: any) => ({
            then: (resolve: any) => {
              resolve({
                data: mockVerificationFeedSkills,
                error: null,
              });
            },
          }),
          in: (col: string, vals: any[]) => ({
            then: (resolve: any) => {
              resolve({
                data: mockVerificationFeedSkills.filter((skill) => {
                  if (col === 'id') {
                    return vals.includes(skill.id);
                  }
                  if (col === 'skill_code') {
                    return vals.includes(skill.skill_code);
                  }
                  return false;
                }),
                error: null,
              });
            },
          }),
        };
      }

      if (table === 'skills_taxonomy') {
        console.log('Mock Supabase: Hit skills_taxonomy table');
        const mockSkills = [
          {
            code: 'python',
            name_i18n: { en: 'Python' },
            description_i18n: {
              en: 'Interpreted, high-level and general-purpose programming language',
            },
            cat_id: 3,
            subcat_id: 10,
            l3_id: 100,
            slug: 'python',
            status: 'active',
            tags: ['language', 'backend', 'data-science'],
          },
          {
            code: 'react',
            name_i18n: { en: 'React' },
            description_i18n: { en: 'JavaScript library for building user interfaces' },
            cat_id: 3,
            subcat_id: 10,
            l3_id: 100,
            slug: 'react',
            status: 'active',
            tags: ['frontend', 'library', 'javascript'],
          },
          {
            code: 'typescript',
            name_i18n: { en: 'TypeScript' },
            description_i18n: { en: 'Typed superset of JavaScript' },
            cat_id: 3,
            subcat_id: 10,
            l3_id: 100,
            slug: 'typescript',
            status: 'active',
            tags: ['language', 'frontend', 'backend'],
          },
          {
            code: 'project-management',
            name_i18n: { en: 'Project Management' },
            description_i18n: {
              en: 'Planning, executing, monitoring, controlling, and closing projects',
            },
            cat_id: 2,
            subcat_id: 20,
            l3_id: 200,
            slug: 'project-management',
            status: 'active',
            tags: ['management', 'planning'],
          },
        ];

        const chain: any = {
          eq: () => chain,
          limit: () => ({
            then: (resolve: any) => resolve({ data: mockSkills, error: null }),
          }),
          in: (col: string, vals: any[]) => ({
            then: (resolve: any) =>
              resolve({
                data: mockSkills.filter((s) => vals.includes(s.code)),
                error: null,
              }),
          }),
        };

        console.log('Mock Supabase: select called for skills_taxonomy');
        return chain;
      }

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
                    role: 'org_manager',
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
                      role: 'org_manager',
                      status: 'active',
                      joinedAt: new Date().toISOString(),
                      org: {
                        id: ORG_ID,
                        slug: 'test-org',
                        displayName: 'Test Organization',
                      },
                    },
                  ],
                  error: null,
                });
              };
              return chain;
            };
          }
          if (table === 'skills' && col === 'user_id') {
            chain.then = (resolve: any) => {
              resolve({
                data: [
                  {
                    id: 'skill-1',
                    name: 'JavaScript',
                    category: 'Programming Languages',
                    level: 'Expert',
                    userId: MOCK_USER_ID,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                  {
                    id: 'skill-2',
                    name: 'React',
                    category: 'Frontend Frameworks',
                    level: 'Advanced',
                    userId: MOCK_USER_ID,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
                error: null,
              });
            };
          }
          // Mock L3 query by ID
          if (table === 'skills_l3' && col === 'l3_id') {
            chain.then = (resolve: any) => {
              resolve({
                data: [
                  {
                    l3_id: 100,
                    subcat_id: 10,
                    cat_id: 3,
                    slug: 'frontend-frameworks',
                    name_i18n: { en: 'Frontend Frameworks' },
                  },
                  {
                    l3_id: 200,
                    subcat_id: 20,
                    cat_id: 2,
                    slug: 'project-planning',
                    name_i18n: { en: 'Project Planning' },
                  },
                ],
                error: null,
              });
            };
          }
          return chain;
        },
        in: (col: string, vals: any[]) => {
          // Mock IN queries for context fetching
          if (table === 'profiles' && col === 'id') {
            return {
              then: (resolve: any) =>
                resolve({
                  data: mockVerificationFeedProfiles.filter((profile) => vals.includes(profile.id)),
                  error: null,
                }),
            };
          }
          if (table === 'impact_stories' && col === 'id') {
            return {
              then: (resolve: any) =>
                resolve({
                  data: [],
                  error: null,
                }),
            };
          }
          if (table === 'skills_categories' && col === 'cat_id') {
            return {
              then: (resolve: any) =>
                resolve({
                  data: [
                    { cat_id: 1, slug: 'universal', name_i18n: { en: 'Universal Capabilities' } },
                    { cat_id: 2, slug: 'functional', name_i18n: { en: 'Functional Competencies' } },
                    { cat_id: 3, slug: 'tools', name_i18n: { en: 'Tools & Technologies' } },
                  ],
                  error: null,
                }),
            };
          }
          if (table === 'skills_subcategories' && col === 'subcat_id') {
            return {
              then: (resolve: any) =>
                resolve({
                  data: [
                    {
                      subcat_id: 10,
                      cat_id: 3,
                      slug: 'frontend',
                      name_i18n: { en: 'Frontend Development' },
                    },
                    {
                      subcat_id: 20,
                      cat_id: 2,
                      slug: 'management',
                      name_i18n: { en: 'Management' },
                    },
                  ],
                  error: null,
                }),
            };
          }
          if (table === 'skills_l3' && col === 'l3_id') {
            return {
              then: (resolve: any) =>
                resolve({
                  data: [
                    {
                      l3_id: 100,
                      subcat_id: 10,
                      cat_id: 3,
                      slug: 'frontend-frameworks',
                      name_i18n: { en: 'Frontend Frameworks' },
                    },
                    {
                      l3_id: 200,
                      subcat_id: 20,
                      cat_id: 2,
                      slug: 'project-planning',
                      name_i18n: { en: 'Project Planning' },
                    },
                  ],
                  error: null,
                }),
            };
          }
          return chain;
        },
        or: () => chain,
        order: (col: string, opts?: any) => {
          return chain;
        },
        limit: () => chain,
        maybeSingle: async () => {
          if (table === 'profiles') {
            return {
              data: {
                id: MOCK_USER_ID,
                platform_role: getMockPlatformRole(),
                tour_completed: true,
                persona: await getMockPersona(),
              },
              error: null,
            };
          }
          if (table === 'organizations') {
            // For getActiveOrg
            const now = new Date().toISOString();
            const visualOrg = visualFixturesEnabled();

            return {
              data: {
                id: ORG_ID,
                slug: 'test-org',
                displayName: visualOrg ? 'Nordic Field Systems' : 'Test Organization',
                type: 'company',
                verified: visualOrg,
                tagline: visualOrg
                  ? 'Field crews can finish safer infrastructure work when planning tools match the real site conditions.'
                  : null,
                mission: visualOrg
                  ? 'Equip distributed infrastructure teams with proof-led planning, field handoff, and safety review workflows that reduce rework before the first site visit.'
                  : null,
                workingContext: visualOrg
                  ? 'Teams coordinate across municipal partners, subcontractors, and night-shift field crews. Candidates should understand calm stakeholder updates, practical risk logs, and decisions made from incomplete site data.'
                  : null,
                hiringProcessSummary: visualOrg
                  ? 'One written proof assignment, privacy-safe summary review, then a focused reveal conversation for shortlisted candidates.'
                  : null,
                trustStatus: visualOrg ? 'domain_verified' : null,
                websiteVerifiedAt: visualOrg ? now : null,
                website: visualOrg ? 'https://nordic-field.example/team/proofound' : null,
                createdAt: now,
                updatedAt: now,
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
        single: async () => {
          if (table === 'profiles') {
            return {
              data: {
                id: MOCK_USER_ID,
                platform_role: getMockPlatformRole(),
                tour_completed: true,
                persona: await getMockPersona(),
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
  // Return error for RPC to trigger fallback
  rpc: async () => ({ data: null, error: { message: 'Mock RPC unavailable in local mode' } }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: 'mock-url' } }),
    }),
  },
} as unknown as SupabaseClient;

export function createMockServerClient(): SupabaseClient {
  return mockSupabaseClient;
}
