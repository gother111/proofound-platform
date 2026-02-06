import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../users/route';
import * as adminAuth from '@/lib/auth/admin';
import * as dbModule from '@/db';

// Helper to build a NextRequest with query params
function buildRequest(url: string) {
  return new NextRequest(url);
}

describe('admin users route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when admin guard fails', async () => {
    vi.spyOn(adminAuth, 'getAdminUser').mockResolvedValue(null as any);
    const req = buildRequest('https://example.com/api/admin/users');
    const res = (await GET(req)) as Response;
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('validates query params and returns 400 on invalid limit', async () => {
    vi.spyOn(adminAuth, 'getAdminUser').mockResolvedValue({
      adminLevel: 'super_admin',
      platformRole: 'super_admin',
      userId: 'admin-1',
      email: 'a@example.com',
    } as any);

    // DB is never called if query validation fails, but keep a safe stub.
    vi.spyOn(dbModule, 'db', 'get').mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => ({
              offset: () => ({
                orderBy: () => [],
              }),
            }),
          }),
        }),
      }),
    } as any);

    const req = buildRequest('https://example.com/api/admin/users?limit=5000');
    const res = (await GET(req)) as Response;
    expect(res.status).toBe(400);
  });

  it('returns users and pagination on success', async () => {
    vi.spyOn(adminAuth, 'getAdminUser').mockResolvedValue({
      adminLevel: 'super_admin',
      platformRole: 'super_admin',
      userId: 'admin-1',
      email: 'a@example.com',
    } as any);

    const mockUsers = [
      { id: 'u1', displayName: 'User One', createdAt: new Date() },
      { id: 'u2', displayName: 'User Two', createdAt: new Date() },
    ];

    vi.spyOn(dbModule, 'db', 'get').mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => ({
              offset: () => ({
                orderBy: () => mockUsers,
              }),
            }),
          }),
        }),
      }),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    } as any);

    vi.spyOn(dbModule, 'db', 'get')
      .mockReturnValueOnce({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: () => ({
                offset: () => ({
                  orderBy: () => mockUsers,
                }),
              }),
            }),
          }),
        }),
      } as any)
      .mockReturnValue({
        select: () => ({
          from: () => ({
            where: () => [{ count: 2 }],
          }),
        }),
      } as any);

    const req = buildRequest('https://example.com/api/admin/users?limit=2&page=1');
    const res = (await GET(req)) as Response;
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination.total).toBe(2);
    expect(body.users.length).toBe(2);
  });
});
