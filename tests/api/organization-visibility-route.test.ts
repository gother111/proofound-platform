import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT } from '@/app/api/organizations/[orgId]/visibility/route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

const params = { params: Promise.resolve({ orgId: 'org-1' }) };

function buildPutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/organizations/org-1/visibility', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function mockAuthUser() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
  };
}

function membershipQuery(role: 'owner' | 'admin' | 'member' = 'owner') {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
  };
}

describe('organization visibility route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns normalized camelCase visibility from snake_case row', async () => {
    const members = membershipQuery('owner');
    const visibility = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          display_name: 'public',
          mission: 'public',
          vision: 'public',
          causes: 'public',
          work_culture: 'post_conversation_start',
          structure: 'post_match',
          projects: 'post_match',
          partnerships: 'post_match',
          goals: 'post_match',
          impact: 'internal_only',
        },
        error: null,
      }),
    };

    const from = vi.fn().mockReturnValueOnce(members).mockReturnValueOnce(visibility);
    (createClient as any).mockResolvedValue({
      ...mockAuthUser(),
      from,
    });

    const response = await GET(
      new NextRequest('http://localhost/api/organizations/org-1/visibility'),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.visibility.displayName).toBe('public');
    expect(body.visibility.workCulture).toBe('post_conversation_start');
    expect(body.visibility.impact).toBe('internal_only');
    expect(body.visibility.display_name).toBeUndefined();
  });

  it('GET returns default visibility when no row exists', async () => {
    const members = membershipQuery('owner');
    const visibility = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      }),
    };

    const from = vi.fn().mockReturnValueOnce(members).mockReturnValueOnce(visibility);
    (createClient as any).mockResolvedValue({
      ...mockAuthUser(),
      from,
    });

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
      workCulture: 'post_match',
      structure: 'post_match',
      projects: 'post_match',
      partnerships: 'post_match',
      goals: 'post_match',
      impact: 'post_match',
    });
  });

  it('PUT rejects invalid visibility values', async () => {
    const members = membershipQuery('owner');
    const from = vi.fn().mockReturnValueOnce(members);
    (createClient as any).mockResolvedValue({
      ...mockAuthUser(),
      from,
    });

    const response = await PUT(buildPutRequest({ displayName: 'network_only' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid visibility level for displayName');
  });

  it('PUT stores snake_case fields and returns camelCase response', async () => {
    const members = membershipQuery('owner');
    const existingQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          display_name: 'public',
          mission: 'public',
          vision: 'public',
          causes: 'public',
          work_culture: 'post_match',
          structure: 'post_match',
          projects: 'post_match',
          partnerships: 'post_match',
          goals: 'post_match',
          impact: 'post_match',
        },
        error: null,
      }),
    };
    const updateQuery = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'vis-1' }, error: null }),
    };

    const from = vi
      .fn()
      .mockReturnValueOnce(members)
      .mockReturnValueOnce(existingQuery)
      .mockReturnValueOnce(updateQuery);

    (createClient as any).mockResolvedValue({
      ...mockAuthUser(),
      from,
    });

    const response = await PUT(
      buildPutRequest({
        displayName: 'internal_only',
        workCulture: 'post_conversation_start',
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'internal_only',
        work_culture: 'post_conversation_start',
      })
    );
    expect(body.visibility.displayName).toBe('internal_only');
    expect(body.visibility.workCulture).toBe('post_conversation_start');
    expect(body.visibility.display_name).toBeUndefined();
  });
});
