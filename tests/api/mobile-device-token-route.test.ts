import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { DELETE, POST } from '@/app/api/mobile/v1/devices/token/route';
import { db } from '@/db';
import { requireMobileAuth } from '@/lib/api/mobile/auth';

vi.mock('@/lib/api/mobile/auth', () => ({
  requireMobileAuth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      mobileDeviceTokens: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe('mobile device token route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for invalid registration payload', async () => {
    (requireMobileAuth as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const request = new NextRequest('http://localhost/api/mobile/v1/devices/token', {
      method: 'POST',
      body: JSON.stringify({ token: 'short' }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('validation_error');
  });

  it('creates a token when none exists', async () => {
    (requireMobileAuth as any).mockResolvedValue({
      user: { id: 'user-1' },
    });
    (db.query.mobileDeviceTokens.findFirst as any).mockResolvedValue(null);

    const returningMock = vi.fn().mockResolvedValue([{ id: 'token-1', token: 'x'.repeat(32) }]);
    (db.insert as any).mockReturnValue({
      values: vi.fn().mockReturnValue({ returning: returningMock }),
    });

    const request = new NextRequest('http://localhost/api/mobile/v1/devices/token', {
      method: 'POST',
      body: JSON.stringify({
        token: 'x'.repeat(32),
        environment: 'sandbox',
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it('returns 404 when unregister target is missing', async () => {
    (requireMobileAuth as any).mockResolvedValue({
      user: { id: 'user-1' },
    });

    const returningMock = vi.fn().mockResolvedValue([]);
    (db.update as any).mockReturnValue({
      set: vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockReturnValue({ returning: returningMock }) }),
    });

    const request = new NextRequest('http://localhost/api/mobile/v1/devices/token', {
      method: 'DELETE',
      body: JSON.stringify({
        token: 'y'.repeat(32),
      }),
    });

    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('not_found');
  });
});
