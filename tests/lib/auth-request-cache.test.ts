import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();
const redirectMock = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

vi.mock('next/navigation', () => ({
  redirect: (path: string) => redirectMock(path),
}));

type QueryResult<T> = {
  data: T;
  error: null;
};

function createAwaitableBuilder<T>(result: QueryResult<T>) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (
      onfulfilled?: (value: QueryResult<T>) => unknown,
      onrejected?: (reason: unknown) => unknown
    ) => Promise.resolve(result).then(onfulfilled, onrejected),
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
    role: 'owner' | 'admin' | 'member' | 'viewer';
    status: 'active' | 'pending' | 'inactive';
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
        role: 'owner',
        status: 'active',
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

  it('dedupes repeated current-user lookups within a request path', async () => {
    const { supabase, builders } = createSupabaseStub();
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    const [first, second] = await Promise.all([auth.getCurrentUser(), auth.getCurrentUser()]);

    expect(first?.id).toBe('user-1');
    expect(second?.id).toBe('user-1');
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(supabase.auth.getUser).toHaveBeenCalledTimes(1);
    expect(builders.profileBuilder.maybeSingle).toHaveBeenCalledTimes(1);
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
  });

  it('keeps persona redirect behavior unchanged', async () => {
    const { supabase } = createSupabaseStub({ profilePersona: 'individual' });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.requirePersona('org_member')).rejects.toThrow('REDIRECT:/app/i/home');
    expect(redirectMock).toHaveBeenCalledWith('/app/i/home');
  });

  it('routes incomplete individual users to onboarding', async () => {
    const { supabase } = createSupabaseStub({
      profilePersona: 'individual',
      profileHandle: null,
    });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.resolveUserHomePath()).resolves.toBe('/onboarding');
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
          role: 'owner',
          status: 'active',
          joinedAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ],
    });
    createClientMock.mockResolvedValue(supabase);
    const auth = await loadAuthModule();

    await expect(auth.resolveUserHomePath()).resolves.toBe('/app/o/acme/home');
  });
});
