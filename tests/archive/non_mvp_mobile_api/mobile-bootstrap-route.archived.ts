import { describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

import { GET } from '@/archive/non_launch_api/app/api/mobile/v1/bootstrap/route';
import { requireMobileAuth } from '@/lib/api/mobile/auth';

vi.mock('@/lib/api/mobile/auth', () => ({
  requireMobileAuth: vi.fn(),
}));

describe('mobile bootstrap route', () => {
  it('returns auth response when bearer token is missing/invalid', async () => {
    const unauthorized = NextResponse.json(
      {
        success: false,
        error: { code: 'unauthorized', message: 'Missing bearer token' },
      },
      { status: 401 }
    );

    (requireMobileAuth as any).mockResolvedValue(unauthorized);

    const request = new NextRequest('http://localhost/api/mobile/v1/bootstrap', {
      method: 'GET',
    });

    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('unauthorized');
  });
});
