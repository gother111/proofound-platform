import { describe, it, expect, vi, beforeEach } from 'vitest';
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

function buildSelectChain(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

function mockMembership(
  role: 'owner' | 'admin' | 'member' | null,
  orgState?: {
    mission?: string | null;
    vision?: string | null;
    missionLinks?: unknown;
    visionLinks?: unknown;
    values?: unknown;
    causes?: unknown;
  }
) {
  (db.select as any)
    .mockImplementationOnce(() => buildSelectChain(role ? [{ role }] : []))
    .mockImplementationOnce(() =>
      buildSelectChain([
        {
          mission: orgState?.mission ?? null,
          vision: orgState?.vision ?? null,
          missionLinks: orgState?.missionLinks ?? { values: [], causes: [] },
          visionLinks: orgState?.visionLinks ?? { values: [], causes: [] },
          values: orgState?.values ?? [],
          causes: orgState?.causes ?? [],
        },
      ])
    );
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
    vi.resetAllMocks();
    (requireApiAuthContext as any).mockImplementation(async () => {
      const user = await (requireAuth as any)();
      return user ? { user, supabase: {} } : null;
    });
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

    mockMembership('owner');
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
        industry: 'Information and communication',
        industryKey: 'information_and_communication',
        industryLabel: 'Information and communication',
      })
    );
  });

  it('returns 400 when industry key and label mismatch', async () => {
    mockMembership('admin');

    const response = await PUT(
      buildPutRequest({
        industryKey: 'education',
        industryLabel: 'Financial and insurance activities',
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Industry key and label do not match');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 when values is not an array', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ values: 'integrity' as any }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Values must be an array of non-empty strings or null');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 when values includes empty or non-string values', async () => {
    mockMembership('owner');

    const response = await PUT(buildPutRequest({ values: ['Integrity', '', 123] as any }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Values must contain non-empty strings only');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('returns 400 when values exceeds max allowed', async () => {
    mockMembership('owner');

    const response = await PUT(
      buildPutRequest({
        values: ['Integrity', 'Transparency', 'Trust', 'Care', 'Impact', 'Inclusion'],
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Maximum of 5 values allowed');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects mission update when core values are missing', async () => {
    mockMembership('owner', {
      values: [],
      causes: ['Climate Justice'],
    });

    const response = await PUT(buildPutRequest({ mission: 'Build trust-led teams' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Add at least one core value before updating mission or vision.');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects vision update when causes are missing', async () => {
    mockMembership('owner', {
      values: ['Integrity'],
      causes: [],
    });

    const response = await PUT(buildPutRequest({ vision: 'A fair future of work' }), params);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Add at least one cause before updating mission or vision.');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('allows mission update when values and causes exist in resulting state', async () => {
    mockMembership('owner', {
      values: [],
      causes: [],
    });
    const { setMock } = mockUpdateReturningOrganization();

    const response = await PUT(
      buildPutRequest({
        mission: 'Build trust-led teams',
        values: ['Integrity'],
        causes: ['Climate Justice'],
        missionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
      }),
      params
    );

    expect(response.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mission: 'Build trust-led teams',
        values: ['Integrity'],
        causes: ['Climate Justice'],
        missionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
      })
    );
  });

  it('rejects mission update when missionLinks are missing', async () => {
    mockMembership('owner', {
      values: ['Integrity'],
      causes: ['Climate Justice'],
    });

    const response = await PUT(
      buildPutRequest({
        mission: 'Build trust-led teams',
        missionLinks: { values: [], causes: [] },
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      'Select at least one linked value and one linked cause before updating mission.'
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects vision update when visionLinks are missing', async () => {
    mockMembership('owner', {
      values: ['Integrity'],
      causes: ['Climate Justice'],
    });

    const response = await PUT(
      buildPutRequest({
        vision: 'A fair future',
        visionLinks: { values: ['Integrity'], causes: [] },
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe(
      'Select at least one linked value and one linked cause before updating vision.'
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it('rejects missionLinks payload with invalid shape', async () => {
    mockMembership('owner', {
      values: ['Integrity'],
      causes: ['Climate Justice'],
    });

    const response = await PUT(
      buildPutRequest({
        mission: 'Build trust-led teams',
        missionLinks: { values: 'Integrity', causes: ['Climate Justice'] } as any,
      }),
      params
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('missionLinks.values must be an array of non-empty strings');
    expect(db.update).not.toHaveBeenCalled();
  });

  it('auto-prunes mission and vision links when values are updated', async () => {
    mockMembership('owner', {
      mission: 'Build trust-led teams',
      vision: 'A fair future',
      values: ['Integrity', 'Transparency'],
      causes: ['Climate Justice'],
      missionLinks: { values: ['Integrity', 'Transparency'], causes: ['Climate Justice'] },
      visionLinks: { values: ['Transparency'], causes: ['Climate Justice'] },
    });
    const { setMock } = mockUpdateReturningOrganization();

    const response = await PUT(buildPutRequest({ values: ['Integrity'] }), params);

    expect(response.status).toBe(200);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        values: ['Integrity'],
        missionLinks: { values: ['Integrity'], causes: ['Climate Justice'] },
        visionLinks: { values: [], causes: ['Climate Justice'] },
      })
    );
  });
});
