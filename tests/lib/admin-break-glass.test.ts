import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAdminUser: vi.fn(),
  values: vi.fn(),
}));

vi.mock('@/lib/auth/admin', () => ({
  getAdminUser: (...args: unknown[]) => mocks.getAdminUser(...args),
}));

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: (...args: unknown[]) => mocks.values(...args),
    })),
  },
}));

import { requireBreakGlassPlatformAdminJson } from '@/lib/authz/admin-break-glass';

describe('break-glass admin authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAdminUser.mockResolvedValue({
      userId: 'admin-1',
      adminLevel: 'platform_admin',
    });
    mocks.values.mockResolvedValue(undefined);
  });

  it('accepts break-glass reasons from headers', async () => {
    const request = new Request('http://localhost/api/admin/organizations/org-1/audit', {
      headers: {
        'x-break-glass-reason': 'Investigating confirmed privacy incident',
      },
    });

    const result = await requireBreakGlassPlatformAdminJson(request, {
      action: 'org_audit.read_break_glass',
      targetType: 'organization',
      targetId: 'org-1',
    });

    expect(result).toMatchObject({
      adminUser: { userId: 'admin-1' },
      reason: 'Investigating confirmed privacy incident',
    });
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Investigating confirmed privacy incident',
      })
    );
  });

  it('rejects break-glass reasons supplied through URL query strings', async () => {
    const request = new Request(
      'http://localhost/api/admin/organizations/org-1/audit?reason=Investigating%20confirmed%20privacy%20incident'
    );

    const result = await requireBreakGlassPlatformAdminJson(request, {
      action: 'org_audit.read_break_glass',
      targetType: 'organization',
      targetId: 'org-1',
    });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
    expect(mocks.values).not.toHaveBeenCalled();
  });
});
