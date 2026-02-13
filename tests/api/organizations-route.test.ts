import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT } from '@/app/api/organizations/[orgId]/route';
import { db } from '@/db';
import { requireAuth } from '@/lib/auth';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

const params = { params: Promise.resolve({ orgId: 'org-1' }) };

function buildPutRequest(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/organizations/org-1', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

function mockMembership(role: 'owner' | 'admin' | 'member' | null) {
  (db.select as any).mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(role ? [{ role }] : []),
      }),
    }),
  });
}

function mockUpdateReturningOrganization() {
  const whereMock = vi.fn().mockReturnValue({
    returning: vi.fn().mockResolvedValue([{ id: 'org-1' }]),
  });
  const setMock = vi.fn().mockReturnValue({ where: whereMock });
  (db.update as any).mockReturnValue({ set: setMock });
  return { setMock };
}

describe('organizations [orgId] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
  });

  it('returns 403 when user is not an active org member', async () => {
    mockMembership(null);

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('returns 403 when user role is not owner/admin', async () => {
    mockMembership('member');

    const response = await PUT(buildPutRequest({ displayName: 'Acme' }), params);

    expect(response.status).toBe(403);
  });

  it('returns 400 for empty displayName', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ displayName: '   ' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Organization name cannot be empty');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('normalizes website input and keeps patch semantics', async () => {
    mockMembership('owner');
    const { setMock } = mockUpdateReturningOrganization();

    const response = await PUT(buildPutRequest({ website: 'example.com' }), params);

    expect(response.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ website: 'https://example.com/' })
    );

    const updatePayload = setMock.mock.calls[0][0];
    expect(Object.prototype.hasOwnProperty.call(updatePayload, 'legalName')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(updatePayload, 'mission')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(updatePayload, 'vision')).toBe(false);
  });

  it('returns 400 for invalid website values', async () => {
    mockMembership('admin');

    const response = await PUT(buildPutRequest({ website: 'https://' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Website must be a valid URL (for example: https://example.com).');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 when causes is not an array', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ causes: 'education' as any }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Causes must be an array of non-empty strings or null');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 when causes includes empty or non-string values', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ causes: ['education', '', 123] as any }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Causes must contain non-empty strings only');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 for foundedDate with invalid format', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ foundedDate: '01-01-2024' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Founded date must be a valid YYYY-MM-DD date');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 for impossible foundedDate values', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ foundedDate: '2024-02-30' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Founded date must be a valid YYYY-MM-DD date');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('accepts null and valid foundedDate values', async () => {
    mockMembership('owner');
    const { setMock } = mockUpdateReturningOrganization();

    let response = await PUT(buildPutRequest({ foundedDate: null }), params);
    expect(response.status).toBe(200);

    response = await PUT(buildPutRequest({ foundedDate: '2024-02-29' }), params);
    expect(response.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ foundedDate: '2024-02-29' }));
  });

  it('returns 400 for invalid organizationSize values', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ organizationSize: '2-3' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Organization size must be one of the supported values');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid legalForm values', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ legalForm: 'charity' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Legal form must be one of the supported values');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('accepts valid organizationSize and legalForm values', async () => {
    mockMembership('admin');
    const { setMock } = mockUpdateReturningOrganization();

    const response = await PUT(
      buildPutRequest({ organizationSize: '11-50', legalForm: 'llc', industry: ' Tech ' }),
      params
    );

    expect(response.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationSize: '11-50',
        legalForm: 'llc',
        industry: 'Tech',
      })
    );
  });
});
