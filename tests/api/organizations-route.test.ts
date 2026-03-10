import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { PUT } from '@/app/api/organizations/[orgId]/route';
import { db } from '@/db';
import { requireApiAuthContext, requireAuth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: { findFirst: vi.fn() },
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
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
  });

  it('returns 403 when user is not an active org member', async () => {
    (db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('returns 403 when user role is reviewer', async () => {
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({ role: 'org_reviewer' });

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('rejects non-MVP organization fields with explicit unsupported fields', async () => {
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({ role: 'org_owner' });

    const response = await PUT(buildPutRequest({ industry: 'Technology' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.details.unsupportedFields).toEqual(['industry']);
  });

  it('normalizes website input and updates lean trust profile fields', async () => {
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({ role: 'org_manager' });
    const { set } = mockUpdateReturningOrganization();

    const response = await PUT(
      buildPutRequest({
        displayName: 'Acme Org',
        tagline: 'Join a focused team',
        mission: 'Ship trust-first hiring',
        website: 'example.com',
        values: ['Clarity', 'Trust'],
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'Acme Org',
        tagline: 'Join a focused team',
        mission: 'Ship trust-first hiring',
        website: 'https://example.com/',
        values: ['Clarity', 'Trust'],
      })
    );
  });

  it('rejects invalid values payloads', async () => {
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({ role: 'org_owner' });

    const response = await PUT(buildPutRequest({ values: ['Clarity', '', 123] as any }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Values must contain non-empty strings only');
    expect(db.update).not.toHaveBeenCalled();
  });
});
