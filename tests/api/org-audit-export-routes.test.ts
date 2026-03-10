import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/authz', async () => {
  const actual = await vi.importActual<typeof import('@/lib/authz')>('@/lib/authz');
  return {
    ...actual,
    requireBreakGlassPlatformAdminJson: vi.fn(),
  };
});

vi.mock('@/db', () => ({
  db: {
    query: {
      organizationMembers: {
        findFirst: vi.fn(),
      },
      auditLogs: {
        findMany: vi.fn(),
      },
    },
  },
}));

import { GET as ownerAuditExportGET } from '@/app/api/organizations/[orgId]/audit/export/route';
import { GET as adminAuditReadGET } from '@/app/api/admin/organizations/[orgId]/audit/route';
import { requireApiAuthContext } from '@/lib/auth';
import { requireBreakGlassPlatformAdminJson } from '@/lib/authz';
import { db } from '@/db';

describe('org audit access routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows org owner audit export', async () => {
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({
      id: 'membership-1',
      role: 'org_owner',
      state: 'active',
    });
    (db.query.auditLogs.findMany as any).mockResolvedValue([
      { id: 1, action: 'assignment.created', orgId: 'org-1' },
    ]);

    const response = await ownerAuditExportGET(
      new Request('http://localhost/api/organizations/org-1/audit/export'),
      {
        params: Promise.resolve({ orgId: 'org-1' }),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-disposition')).toContain('proofound-org-audit-org-1.json');
  });

  it('denies reviewer org audit export', async () => {
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (db.query.organizationMembers.findFirst as any).mockResolvedValue({
      id: 'membership-2',
      role: 'org_reviewer',
      state: 'active',
    });

    const response = await ownerAuditExportGET(
      new Request('http://localhost/api/organizations/org-1/audit/export'),
      {
        params: Promise.resolve({ orgId: 'org-1' }),
      }
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
  });

  it('requires break-glass approval for admin org audit reads', async () => {
    (requireBreakGlassPlatformAdminJson as any).mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      reason: 'Investigating confirmed privacy incident',
    });
    (db.query.auditLogs.findMany as any).mockResolvedValue([
      { id: 2, action: 'member.invited', orgId: 'org-1' },
    ]);

    const response = await adminAuditReadGET(
      new Request(
        'http://localhost/api/admin/organizations/org-1/audit?reason=Investigating%20confirmed%20privacy%20incident'
      ),
      {
        params: Promise.resolve({ orgId: 'org-1' }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.breakGlassReason).toBe('Investigating confirmed privacy incident');
    expect(payload.principalType).toBe('trust_admin');
    expect(db.query.auditLogs.findMany).toHaveBeenCalledTimes(1);
  });
});
