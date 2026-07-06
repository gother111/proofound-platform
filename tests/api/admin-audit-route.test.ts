import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  adminListGuard: vi.fn(),
  orderBy: vi.fn(),
  countWhere: vi.fn(),
}));

vi.mock('@/app/api/admin/_utils', () => ({
  adminListGuard: mocks.adminListGuard,
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => ({
              offset: vi.fn(() => ({
                orderBy: mocks.orderBy,
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/db/schema', () => ({
  adminAuditLog: {
    id: 'audit_id',
    adminId: 'admin_id',
    action: 'action',
    targetType: 'target_type',
    targetId: 'target_id',
    reason: 'reason',
    createdAt: 'created_at',
  },
  profiles: {
    id: 'profile_id',
    displayName: 'display_name',
    handle: 'handle',
  },
}));

vi.mock('drizzle-orm', () => ({
  ilike: vi.fn((field: unknown, value: unknown) => ({ op: 'ilike', field, value })),
  or: vi.fn((...conditions: unknown[]) => ({ op: 'or', conditions })),
  desc: vi.fn((field: unknown) => ({ op: 'desc', field })),
  sql: vi.fn(() => 'count(*)'),
  eq: vi.fn((field: unknown, value: unknown) => ({ op: 'eq', field, value })),
  and: vi.fn((...conditions: unknown[]) => ({ op: 'and', conditions })),
  gte: vi.fn((field: unknown, value: unknown) => ({ op: 'gte', field, value })),
  lte: vi.fn((field: unknown, value: unknown) => ({ op: 'lte', field, value })),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { GET } from '@/app/api/admin/audit/route';
import { db } from '@/db';
import { log } from '@/lib/log';

describe('GET /api/admin/audit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.adminListGuard.mockResolvedValue({
      adminUser: { userId: 'admin-1' },
      params: { page: 1, limit: 20, search: '', sortField: 'createdAt', sortDir: 'desc' },
    });
    mocks.orderBy.mockResolvedValue([]);
    mocks.countWhere.mockResolvedValue([{ count: 0 }]);
    let selectCall = 0;
    vi.mocked(db.select as any).mockImplementation(() => {
      selectCall += 1;
      if (selectCall === 2) {
        return {
          from: vi.fn(() => ({
            leftJoin: vi.fn(() => ({
              where: mocks.countWhere,
            })),
          })),
        };
      }
      return {
        from: vi.fn(() => ({
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => ({
              limit: vi.fn(() => ({
                offset: vi.fn(() => ({
                  orderBy: mocks.orderBy,
                })),
              })),
            })),
          })),
        })),
      };
    });
  });

  it('logs audit-list failures with structured diagnostics and returns a safe error', async () => {
    const routeError = new Error('raw audit storage detail');
    mocks.orderBy.mockRejectedValueOnce(routeError);

    const response = await GET(new NextRequest('https://proofound.io/api/admin/audit'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch audit logs' });
    expect(log.error).toHaveBeenCalledWith('admin.audit.list_failed', {
      errorName: 'Error',
    });
    expect(JSON.stringify(body)).not.toContain('raw audit storage detail');
  });
});
