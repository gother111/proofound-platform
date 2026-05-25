import { describe, expect, it } from 'vitest';

import { toAdminAuditListEntry } from '@/lib/audit/admin-audit-list';

describe('admin audit list projection', () => {
  it('keeps the default admin audit API payload limited to list-view fields', () => {
    const entry = toAdminAuditListEntry({
      log: {
        id: 42,
        adminId: 'admin-1',
        action: 'internal_ops_queue_upload_reviewed',
        targetType: 'internal_ops_queue_item',
        targetId: '33333333-3333-4333-8333-333333333333',
        reason: 'Reviewed upload safety before attachment.',
        createdAt: '2026-05-20T10:00:00.000Z',
        changes: {
          filename: 'Jane Doe Resume.pdf',
          privateBucket: 'user-uploads-private',
        },
        metadata: {
          storagePath: 'user-uploads-private/admin-1/Jane Doe Resume.pdf',
          verifierEmail: 'verifier@example.com',
        },
        ipAddress: '203.0.113.10',
        userAgent: 'Sensitive Admin Browser',
      } as any,
      admin: {
        id: 'admin-1',
        displayName: 'Launch Admin',
        handle: 'launch-admin',
      },
    });

    expect(entry).toEqual({
      id: 42,
      adminId: 'admin-1',
      action: 'internal_ops_queue_upload_reviewed',
      targetType: 'internal_ops_queue_item',
      targetId: '33333333-3333-4333-8333-333333333333',
      reason: 'Reviewed upload safety before attachment.',
      createdAt: '2026-05-20T10:00:00.000Z',
      admin: {
        id: 'admin-1',
        displayName: 'Launch Admin',
        handle: 'launch-admin',
      },
    });
    expect(entry).not.toHaveProperty('changes');
    expect(entry).not.toHaveProperty('metadata');
    expect(entry).not.toHaveProperty('ipAddress');
    expect(entry).not.toHaveProperty('userAgent');
    expect(JSON.stringify(entry)).not.toContain('Jane Doe Resume.pdf');
    expect(JSON.stringify(entry)).not.toContain('user-uploads-private');
    expect(JSON.stringify(entry)).not.toContain('verifier@example.com');
  });
});
