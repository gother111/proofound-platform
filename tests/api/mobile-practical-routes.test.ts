import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST as postAssignmentMatches } from '@/archive/non_launch_api/app/api/mobile/v1/matching/assignment/route';
import { GET as getShortlist } from '@/archive/non_launch_api/app/api/mobile/v1/shortlist/route';
import { POST as postPersonaSwitch } from '@/archive/non_launch_api/app/api/mobile/v1/persona/switch/route';
import { PATCH as patchNotificationRead } from '@/archive/non_launch_api/app/api/mobile/v1/notifications/[id]/read/route';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { db } from '@/db';

vi.mock('@/lib/api/mobile/auth', () => ({
  requireMobileAuth: vi.fn(),
  isActiveOrgMember: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: {
        findFirst: vi.fn(),
      },
    },
  },
}));

describe('mobile practical routes', () => {
  it('POST /matching/assignment returns 400 for invalid payload', async () => {
    (requireMobileAuth as any).mockResolvedValue({ user: { id: 'user-1' } });

    const request = new NextRequest('http://localhost/api/mobile/v1/matching/assignment', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await postAssignmentMatches(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });

  it('GET /shortlist returns 400 when orgId is missing', async () => {
    (requireMobileAuth as any).mockResolvedValue({ user: { id: 'user-1' } });

    const request = new NextRequest('http://localhost/api/mobile/v1/shortlist', {
      method: 'GET',
    });

    const response = await getShortlist(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });

  it('POST /persona/switch blocks org_member without memberships', async () => {
    (requireMobileAuth as any).mockResolvedValue({ user: { id: 'user-1' } });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/mobile/v1/persona/switch', {
      method: 'POST',
      body: JSON.stringify({ persona: 'org_member' }),
    });

    const response = await postPersonaSwitch(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });

  it('PATCH /notifications/:id/read returns 400 for invalid uuid', async () => {
    (requireMobileAuth as any).mockResolvedValue({ user: { id: 'user-1' } });

    const request = new NextRequest(
      'http://localhost/api/mobile/v1/notifications/not-a-uuid/read',
      {
        method: 'PATCH',
      }
    );

    const response = await patchNotificationRead(request, {
      params: Promise.resolve({ id: 'not-a-uuid' }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });
});
