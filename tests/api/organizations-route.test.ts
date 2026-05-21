import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { PUT } from '@/app/api/organizations/[orgId]/route';
import { db } from '@/db';
import { requireApiAuthContext } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: { findFirst: vi.fn() },
      organizations: { findFirst: vi.fn() },
    },
    update: vi.fn(),
  },
}));

const ORG_ID = '11111111-1111-4111-8111-111111111111';
const params = { params: Promise.resolve({ orgId: ORG_ID }) };

function buildPutRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/organizations/${ORG_ID}`, {
    method: 'PUT',
    body: JSON.stringify({
      principalContext: {
        principalType: 'organization',
        orgId: ORG_ID,
      },
      ...body,
    }),
  });
}

function buildRawPutRequest(body: string) {
  return new NextRequest(`http://localhost/api/organizations/${ORG_ID}`, {
    method: 'PUT',
    body,
  });
}

function mockUpdateReturningOrganization() {
  const returning = vi.fn().mockResolvedValue([{ id: ORG_ID }]);
  const where = vi.fn().mockReturnValue({ returning });
  const set = vi.fn().mockReturnValue({ where });
  (db.update as any).mockReturnValue({ set });
  return { set };
}

describe('organizations [orgId] route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: ORG_ID,
      displayName: 'Acme Org',
      mission: 'Ship proof-first assignment review',
      tagline: 'Join a focused team',
      workingContext: 'Remote-first collaboration',
      website: 'https://example.com/',
      trustStatus: 'platform_reviewed',
      websiteVerifiedAt: '2026-03-01T00:00:00.000Z',
      verified: true,
    });
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: 'org_owner', state: 'active', status: null },
                  error: null,
                }),
              })),
            })),
          })),
        })),
      },
    });
  });

  it('returns 403 when user is not an active org member', async () => {
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      },
    });

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('returns 403 when user role is reviewer', async () => {
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: 'org_reviewer', state: 'active', status: null },
                  error: null,
                }),
              })),
            })),
          })),
        })),
      },
    });

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('rejects non-MVP organization fields with explicit unsupported fields', async () => {
    const response = await PUT(buildPutRequest({ industry: 'Technology' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.unsupportedFields).toEqual(['industry']);
  });

  it('returns 400 for malformed JSON before principal or membership checks', async () => {
    const authContext = {
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(),
      },
    };
    (requireApiAuthContext as any).mockResolvedValue(authContext);

    const response = await PUT(buildRawPutRequest('{'), params);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(authContext.supabase.from).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 403 when user role is manager', async () => {
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { role: 'org_manager', state: 'active', status: null },
                  error: null,
                }),
              })),
            })),
          })),
        })),
      },
    });

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('normalizes website input and updates lean organization trust page fields for an owner', async () => {
    const { set } = mockUpdateReturningOrganization();

    const response = await PUT(
      buildPutRequest({
        displayName: 'Acme Org',
        whyWorkMatters: 'Join a focused team',
        mission: 'Ship proof-first assignment review',
        website: 'example.com',
        operatingContext: 'Remote-first collaboration',
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Acme Org',
        tagline: 'Join a focused team',
        mission: 'Ship proof-first assignment review',
        workingContext: 'Remote-first collaboration',
        orgReadiness: 'org_ready',
        website: 'https://example.com/',
      })
    );
  });

  it('rejects unsupported non-MVP organization fields', async () => {
    const response = await PUT(buildPutRequest({ values: ['Clarity', '', 123] as any }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Only launch organization trust page fields can be updated');
    expect(body.details.unsupportedFields).toEqual(['values']);
    expect(db.update).not.toHaveBeenCalled();
  });
});
