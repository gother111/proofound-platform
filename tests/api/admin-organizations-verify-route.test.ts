import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/admin/organizations/[orgId]/verify/route';
import { logAdminActionInTransaction } from '@/lib/audit/admin-logger';
import { requireBreakGlassPlatformAdminJson } from '@/lib/authz';
import { db } from '@/db';

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz');
  return {
    ...actual,
    requireBreakGlassPlatformAdminJson: vi.fn(),
  };
});

vi.mock('@/lib/audit/admin-logger', () => ({
  logAdminActionInTransaction: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      organizations: { findFirst: vi.fn() },
    },
    update: vi.fn(),
    insert: vi.fn(),
    transaction: vi.fn(),
  },
}));

describe('POST /api/admin/organizations/[orgId]/verify', () => {
  const orgId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireBreakGlassPlatformAdminJson).mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      reason: 'Investigating material trust issue',
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
    (db.transaction as any).mockImplementation(async (callback: any) => callback(db));
  });

  it('records audited trust tier transitions', async () => {
    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        trustTier: 'restricted',
        reasonCode: 'safety_review_failed',
        note: 'Manual escalation.',
      }),
      headers: {
        'x-break-glass-reason': 'Investigating material trust issue',
      },
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
    expect(db.transaction as any).toHaveBeenCalled();
    expect(requireBreakGlassPlatformAdminJson).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        action: 'org_trust_tier.break_glass_update',
        targetId: orgId,
      })
    );
    expect(logAdminActionInTransaction).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        action: 'set_org_trust_tier',
        targetId: orgId,
        changes: expect.objectContaining({
          previousTier: 'basic_trusted',
          newTier: 'restricted',
        }),
        metadata: expect.objectContaining({
          breakGlassReason: 'Investigating material trust issue',
        }),
      })
    );
  });

  it('keeps the trust-tier update inside the same transaction as the admin audit insert', async () => {
    const transactionOrder: string[] = [];
    const tx = {
      update: vi.fn(() => {
        transactionOrder.push('update');
        return {
          set: vi.fn(() => ({
            where: vi.fn().mockResolvedValue(undefined),
          })),
        };
      }),
      insert: vi.fn(() => {
        transactionOrder.push('transition_insert');
        return {
          values: vi.fn().mockResolvedValue(undefined),
        };
      }),
    };
    (db.transaction as any).mockImplementation(async (callback: any) => callback(tx));
    vi.mocked(logAdminActionInTransaction).mockImplementationOnce(async (writer) => {
      expect(writer).toBe(tx);
      transactionOrder.push('audit_insert');
    });

    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        trustTier: 'reviewed',
        reasonCode: 'manual_review_passed',
      }),
      headers: {
        'x-break-glass-reason': 'Investigating material trust issue',
      },
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });

    expect(response.status).toBe(200);
    expect(transactionOrder).toEqual(['update', 'transition_insert', 'audit_insert']);
    expect(logAdminActionInTransaction).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'set_org_trust_tier',
        targetId: orgId,
      })
    );
  });

  it('returns 400 for invalid trust-tier request bodies', async () => {
    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        trustTier: 'not_a_tier',
        reasonCode: 'safety_review_failed',
      }),
      headers: {
        'x-break-glass-reason': 'Investigating material trust issue',
      },
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid request body');
    expect(db.transaction as any).not.toHaveBeenCalled();
  });

  it('returns 400 when no trust-tier transition is requested', async () => {
    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        reasonCode: 'manual_review_passed',
      }),
      headers: {
        'x-break-glass-reason': 'Investigating material trust issue',
      },
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('trustTier or verified is required');
    expect(db.transaction as any).not.toHaveBeenCalled();
  });

  it('returns 400 for overlong trust-tier reason codes', async () => {
    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        trustTier: 'reviewed',
        reasonCode: 'x'.repeat(121),
      }),
      headers: {
        'x-break-glass-reason': 'Investigating material trust issue',
      },
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid request body');
    expect(payload.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'reasonCode',
        }),
      ])
    );
    expect(db.transaction as any).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON request bodies', async () => {
    const request = new NextRequest(`http://localhost/api/admin/organizations/${orgId}/verify`, {
      method: 'POST',
      body: '{',
      headers: {
        'content-type': 'application/json',
        'x-break-glass-reason': 'Investigating material trust issue',
      },
    });

    const response = await POST(request, { params: Promise.resolve({ orgId }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Invalid JSON request body');
    expect(db.transaction as any).not.toHaveBeenCalled();
  });
});
