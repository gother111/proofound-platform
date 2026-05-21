import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const logErrorMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock('@/lib/log', () => ({
  log: {
    error: logErrorMock,
  },
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

function createAwaitableBuilder<T>(result: QueryResult<T>) {
  let currentResult = result;
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => currentResult),
    single: vi.fn(async () => currentResult),
    setResult: (nextResult: QueryResult<T>) => {
      currentResult = nextResult;
    },
    then: (
      onfulfilled?: (value: QueryResult<T>) => unknown,
      onrejected?: (reason: unknown) => unknown
    ) => Promise.resolve(currentResult).then(onfulfilled, onrejected),
  };

  return builder;
}

function createSupabaseStub(options?: {
  profilePersona?: 'individual' | 'org_member' | 'unknown';
  profileHandle?: string | null;
  organizationMemberships?: Array<{
    org: {
      id: string;
      slug: string;
      displayName?: string | null;
    } | null;
    orgId: string;
    userId: string;
    role: 'org_owner' | 'org_manager' | 'org_reviewer';
    state: 'active' | 'invited_pending' | 'inactive';
    joinedAt: Date;
  }>;
}) {
  const profileBuilder = createAwaitableBuilder({
    data: {
      id: 'user-1',
      handle: options && 'profileHandle' in options ? options.profileHandle : 'user-handle',
      displayName: 'User Name',
      avatarUrl: null,
      locale: 'en',
      persona: options?.profilePersona ?? 'individual',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    },
    error: null,
  });

  const organizationBuilder = createAwaitableBuilder({
    data: {
      id: 'org-1',
      slug: 'acme',
      type: 'company',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      displayName: 'ACME',
      legalName: 'ACME LLC',
      verified: true,
      logoUrl: null,
      coverImageUrl: null,
      tagline: null,
      mission: null,
      vision: null,
      missionLinks: null,
      visionLinks: null,
      industry: null,
      organizationSize: null,
      impactArea: null,
      legalForm: null,
      foundedDate: null,
      website: null,
      values: null,
      causes: null,
      workCulture: null,
      registrationCountry: null,
      registrationRegion: null,
      organizationNumber: null,
      locations: null,
      createdBy: null,
      membership: {
        orgId: 'org-1',
        userId: 'user-1',
        role: 'org_owner',
        state: 'active',
        joinedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    },
    error: null,
  });

  const organizationMembersBuilder = createAwaitableBuilder({
    data: options?.organizationMemberships ?? [],
    error: null,
  });

  const from = vi.fn((table: string) => {
    if (table === 'profiles') return profileBuilder;
    if (table === 'organizations') return organizationBuilder;
    if (table === 'organization_members') return organizationMembersBuilder;
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn(async () => ({
          data: {
            user: {
              id: 'user-1',
            },
          },
        })),
      },
      from,
    },
    builders: {
      profileBuilder,
      organizationBuilder,
      organizationMembersBuilder,
    },
  };
}

async function loadAuthModule() {
  vi.resetModules();
  return import('@/lib/auth');
}

describe('auth request-scoped caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not share current-user lookups through process-global fallback cache', async () => {
    const { supabase, builders } = createSupabaseStub();
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    const [first, second] = await Promise.all([auth.getCurrentUser(), auth.getCurrentUser()]);

    expect(first?.id).toBe('user-1');
    expect(second?.id).toBe('user-1');
    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(2);
    expect(builders.profileBuilder.maybeSingle).toHaveBeenCalledTimes(2);
  });

  it('dedupes repeated active-org lookups with the same slug and user', async () => {
    const { supabase, builders } = createSupabaseStub({ profilePersona: 'org_member' });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    const [first, second] = await Promise.all([
      auth.getActiveOrg('acme', 'user-1'),
      auth.getActiveOrg('acme', 'user-1'),
    ]);

    expect(first?.org.slug).toBe('acme');
    expect(second?.org.slug).toBe('acme');
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(builders.organizationBuilder.maybeSingle).toHaveBeenCalledTimes(1);
    expect(builders.organizationBuilder.eq).toHaveBeenCalledWith('membership.user_id', 'user-1');
    expect(builders.organizationBuilder.eq).toHaveBeenCalledWith('membership.state', 'active');
  });

  it('keeps persona redirect behavior unchanged', async () => {
    const { supabase } = createSupabaseStub({ profilePersona: 'individual' });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.requirePersona('org_member')).rejects.toThrow('REDIRECT:/app/i/home');
    expect(redirectMock).toHaveBeenCalledWith('/app/i/home');
  });

  it('routes legacy individual users without handles to the individual home', async () => {
    const { supabase } = createSupabaseStub({
      profilePersona: 'individual',
      profileHandle: null,
    });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.resolveUserHomePath()).resolves.toBe('/app/i/home');
  });

  it('routes completed individual users to the individual home', async () => {
    const { supabase } = createSupabaseStub({
      profilePersona: 'individual',
      profileHandle: 'user-handle',
    });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.resolveUserHomePath()).resolves.toBe('/app/i/home');
  });

  it('keeps org-member routing unchanged when an active org exists', async () => {
    const { supabase } = createSupabaseStub({
      profilePersona: 'org_member',
      organizationMemberships: [
        {
          org: {
            id: 'org-1',
            slug: 'acme',
            displayName: 'ACME',
          },
          orgId: 'org-1',
          userId: 'user-1',
          role: 'org_owner',
          state: 'active',
          joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.resolveUserHomePath()).resolves.toBe('/app/o/acme/home');
  });

  it('encodes org slugs as one path segment when resolving org home', async () => {
    const { supabase } = createSupabaseStub({
      profilePersona: 'org_member',
      organizationMemberships: [
        {
          org: {
            id: 'org-1',
            slug: 'acme/team',
            displayName: 'ACME',
          },
          orgId: 'org-1',
          userId: 'user-1',
          role: 'org_owner',
          state: 'active',
          joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.resolveUserHomePath()).resolves.toBe('/app/o/acme%2Fteam/home');
  });

  it('logs current-user profile lookup failures with structured diagnostics', async () => {
    const { supabase, builders } = createSupabaseStub();
    const profileError = new Error('profile lookup failed');
    builders.profileBuilder.setResult({ data: null, error: profileError });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.getCurrentUser()).resolves.toBeNull();
    expect(logErrorMock).toHaveBeenCalledWith('auth.current_user.profile_load_failed', {
      error: profileError,
    });
  });

  it('logs user-organization lookup failures with structured diagnostics', async () => {
    const { supabase, builders } = createSupabaseStub();
    const orgError = new Error('organization lookup failed');
    builders.organizationMembersBuilder.setResult({ data: null, error: orgError });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.getUserOrganizations('user-1')).resolves.toEqual([]);
    expect(logErrorMock).toHaveBeenCalledWith('auth.user_organizations.load_failed', {
      error: orgError,
      userId: 'user-1',
    });
  });

  it('logs active organization lookup failures with structured diagnostics', async () => {
    const { supabase, builders } = createSupabaseStub();
    const activeOrgError = new Error('active organization failed');
    builders.organizationBuilder.setResult({ data: null, error: activeOrgError });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.getActiveOrg('acme', 'user-1')).resolves.toBeNull();
    expect(logErrorMock).toHaveBeenCalledWith('auth.active_organization.load_failed', {
      error: activeOrgError,
      slug: 'acme',
      userId: 'user-1',
    });
  });

  it('logs organization role verification failures with structured diagnostics', async () => {
    const { supabase, builders } = createSupabaseStub();
    const roleError = new Error('role lookup failed');
    builders.organizationMembersBuilder.setResult({ data: null, error: roleError });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.assertOrgRole('org-1', 'user-1', ['org_owner'])).rejects.toThrow(
      'Unable to verify permissions'
    );
    expect(logErrorMock).toHaveBeenCalledWith('auth.organization_role.verify_failed', {
      error: roleError,
      orgId: 'org-1',
      userId: 'user-1',
    });
  });
});
