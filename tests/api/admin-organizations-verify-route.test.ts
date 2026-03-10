import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/admin/organizations/[orgId]/verify/route';
import { requirePlatformAdmin } from '@/lib/auth/admin';
import { logAdminAction } from '@/lib/audit/admin-logger';
import { db } from '@/db';

vi.mock('@/lib/auth/admin', () => ({
  requirePlatformAdmin: vi.fn(),
}));

vi.mock('@/lib/audit/admin-logger', () => ({
  logAdminAction: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizations: { findFirst: vi.fn() },
    },
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('POST /api/admin/organizations/[orgId]/verify', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlatformAdmin).mockResolvedValue({
      userId: 'admin-1',
    } as any);
    (db.query.organizations.findFirst as any).mockResolvedValue({
      id: orgId,
      displayName: 'Acme Org',
      trustStatus: 'domain_verified',
      orgTrustTier: 'basic_trusted',
      verified: false,
    });
    const updateWhere = vi.fn().mockResolvedValue(undefined);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    (db.update as any).mockReturnValue({ set: updateSet });
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('records audited trust tier transitions', async () => {
    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        trustTier: 'restricted',
        reasonCode: 'safety_review_failed',
        note: 'Manual escalation.',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      success: true,
      trustTier: 'restricted',
    });
    expect(db.update as any).toHaveBeenCalled();
    expect(db.insert as any).toHaveBeenCalled();
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'set_org_trust_tier',
        targetId: orgId,
        changes: expect.objectContaining({
          previousTier: 'basic_trusted',
          newTier: 'restricted',
        }),
      })
    );
  });
});
