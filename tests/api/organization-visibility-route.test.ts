import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      portfolioPublicationStates: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/proof-trust/snapshots', () => ({
  computePortfolioPublicationState: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicOrganizationPortfolioById: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET, PUT } from '@/app/api/organizations/[orgId]/visibility/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { computePortfolioPublicationState } from '@/lib/proof-trust/snapshots';
import { revalidatePublicOrganizationPortfolioById } from '@/lib/portfolio/public-invalidation';
import { log } from '@/lib/log';

const params = { params: Promise.resolve({ orgId: 'org-1' }) };

function buildPutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/organizations/org-1/visibility', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function buildRawPutRequest(body: string) {
  return new NextRequest('http://localhost/api/organizations/org-1/visibility', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body,
  });
}

function buildSupabase({
  membershipRole = 'org_owner',
  visibilityRow = null,
  visibilityReadError = null,
  visibilityUpdateError = null,
  visibilityInsertError = null,
  organizationUpdateError = null,
  organizationRow = {
    public_portfolio_state: 'public_link_only',
    search_indexing_enabled_at: null,
  },
}: {
  membershipRole?: string;
  visibilityRow?: Record<string, unknown> | null;
  visibilityReadError?: { code?: string; message?: string } | Error | null;
  visibilityUpdateError?: { code?: string; message?: string } | Error | null;
  visibilityInsertError?: { code?: string; message?: string } | Error | null;
  organizationUpdateError?: { code?: string; message?: string } | Error | null;
  organizationRow?: Record<string, unknown> | null;
} = {}) {
  const members = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role: membershipRole }, error: null }),
  };

  const visibilityGet = {
    select: vi.fn(() => ({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: visibilityRow,
          error: visibilityReadError,
        }),
      }),
    })),
  };

  const visibilityWrite = {
    update: vi.fn(() => ({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: visibilityUpdateError ? null : { id: 'vis-1' },
            error: visibilityUpdateError,
          }),
        }),
      }),
    })),
    insert: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: visibilityInsertError ? null : { id: 'vis-1' },
          error: visibilityInsertError,
        }),
      }),
    })),
  };

  const organizations = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: organizationRow, error: null }),
    update: vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: organizationUpdateError }),
    })),
  };

  const from = vi.fn((table: string) => {
    if (table === 'organization_members') {
      return members;
    }
    if (table === 'organization_field_visibility') {
      return { ...visibilityGet, ...visibilityWrite };
    }
    if (table === 'organizations') {
      return organizations;
    }
    throw new Error(`Unexpected table ${table}`);
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from,
    __mocks: {
      visibilityWrite,
      organizations,
    },
  };
}

describe('organization visibility route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.portfolioPublicationStates.findFirst as any).mockResolvedValue(null);
    vi.mocked(computePortfolioPublicationState as any).mockResolvedValue({
      publicationState: 'public_link_only',
      indexingState: 'noindex',
      robotsState: 'noindex_nofollow',
      sitemapState: 'excluded',
    });
  });

  it('GET returns normalized visibility plus publication toggles', async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildSupabase({
        membershipRole: 'org_owner',
        visibilityRow: {
          display_name: 'public',
          mission: 'public',
          vision: 'public',
          causes: 'public',
        },
      }) as any
    );

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/visibility'),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.publicPageEnabled).toBe(true);
    expect(body.searchIndexingEnabled).toBe(false);
    expect(body.visibility.displayName).toBe('public');
    expect(body.visibility.mission).toBe('public');
    expect(body.visibility.causes).toBe('public');
    expect(body.visibility.display_name).toBeUndefined();
  });

  it('GET returns default visibility when no row exists', async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildSupabase({
        visibilityRow: null,
        visibilityReadError: { code: 'PGRST116' },
      }) as any
    );

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/visibility'),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.visibility).toEqual({
      displayName: 'public',
      mission: 'public',
      vision: 'public',
      causes: 'public',
    });
  });

  it('GET logs visibility read failures with structured diagnostics', async () => {
    const visibilityError = { code: 'PGRST500', message: 'visibility lookup failed' };
    vi.mocked(createClient).mockResolvedValue(
      buildSupabase({
        visibilityReadError: visibilityError,
      }) as any
    );

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/visibility'),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch visibility settings' });
    expect(log.error).toHaveBeenCalledWith('organization.visibility.get_failed', {
      orgId: 'org-1',
      error: visibilityError,
    });
  });

  it('PUT rejects invalid visibility values', async () => {
    vi.mocked(createClient).mockResolvedValue(buildSupabase() as any);

    const response = await PUT(buildPutRequest({ displayName: 'network_only' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid visibility level for displayName');
  });

  it('PUT rejects malformed JSON before visibility reads or writes', async () => {
    const supabase = buildSupabase();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await PUT(buildRawPutRequest('{"displayName":'), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'Invalid JSON body' });
    expect(supabase.__mocks.visibilityWrite.update).not.toHaveBeenCalled();
    expect(supabase.__mocks.visibilityWrite.insert).not.toHaveBeenCalled();
    expect(db.query.portfolioPublicationStates.findFirst).not.toHaveBeenCalled();
    expect(computePortfolioPublicationState).not.toHaveBeenCalled();
  });

  it('PUT rejects manager updates because publication controls are owner-only', async () => {
    vi.mocked(createClient).mockResolvedValue(
      buildSupabase({
        membershipRole: 'org_manager',
      }) as any
    );

    const response = await PUT(buildPutRequest({ displayName: 'internal_only' }), params);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });

  it('PUT logs visibility read failures instead of falling through to inserts', async () => {
    const visibilityError = { code: 'PGRST500', message: 'visibility lookup failed' };
    const supabase = buildSupabase({
      visibilityRow: null,
      visibilityReadError: visibilityError,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await PUT(buildPutRequest({ displayName: 'internal_only' }), params);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch visibility settings' });
    expect(supabase.__mocks.visibilityWrite.update).not.toHaveBeenCalled();
    expect(supabase.__mocks.visibilityWrite.insert).not.toHaveBeenCalled();
    expect(log.error).toHaveBeenCalledWith('organization.visibility.read_failed', {
      orgId: 'org-1',
      error: visibilityError,
    });
  });

  it('PUT stores publication controls, recomputes publication, and invalidates public paths', async () => {
    const supabase = buildSupabase({
      visibilityRow: {
        display_name: 'public',
        mission: 'public',
        vision: 'public',
        causes: 'public',
      },
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);
    vi.mocked(computePortfolioPublicationState as any).mockResolvedValue({
      publicationState: 'public_indexable',
      indexingState: 'indexable',
      robotsState: 'index_follow',
      sitemapState: 'included',
    });

    const response = await PUT(
      buildPutRequest({
        displayName: 'internal_only',
        mission: 'post_conversation_start',
        publicPageEnabled: true,
        searchIndexingEnabled: true,
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.__mocks.visibilityWrite.update).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'internal_only',
        mission: 'post_conversation_start',
      })
    );
    expect(supabase.__mocks.organizations.update).toHaveBeenCalledWith(
      expect.objectContaining({
        public_portfolio_state: 'public_indexable',
      })
    );
    expect(computePortfolioPublicationState).toHaveBeenCalledWith('organization', 'org-1');
    expect(revalidatePublicOrganizationPortfolioById).toHaveBeenCalledWith('org-1');
    expect(body.searchIndexingEnabled).toBe(true);
    expect(body.visibility.displayName).toBe('internal_only');
    expect(body.visibility.mission).toBe('post_conversation_start');
  });

  it('PUT logs organization publication update failures with structured diagnostics', async () => {
    const publicationUpdateError = { message: 'publication update failed' };
    const supabase = buildSupabase({
      visibilityRow: {
        display_name: 'public',
        mission: 'public',
        vision: 'public',
        causes: 'public',
      },
      organizationUpdateError: publicationUpdateError,
    });
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const response = await PUT(
      buildPutRequest({
        displayName: 'internal_only',
        publicPageEnabled: true,
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to update organization visibility settings' });
    expect(log.error).toHaveBeenCalledWith('organization.visibility.publication_update_failed', {
      orgId: 'org-1',
      error: publicationUpdateError,
    });
  });
});
