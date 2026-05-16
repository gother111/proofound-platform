import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { createClientMock, revalidatePathMock, signOutMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('next/cache', () => ({
  revalidatePath: revalidatePathMock,
}));

import { GET, POST } from '@/app/auth/logout/route';

describe('auth logout route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signOutMock.mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: {
        signOut: signOutMock,
      },
    });
  });

  it('signs out and redirects home for navigation requests', async () => {
    const req = new NextRequest('http://localhost/auth/logout');
    const res = await GET(req);

    expect(createClientMock).toHaveBeenCalledWith({ allowCookieWrite: true });
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith('/', 'layout');
    expect(res.headers.get('location')).toBe('http://localhost/');
  });

  it('also supports form POST requests', async () => {
    const req = new NextRequest('http://localhost/auth/logout', { method: 'POST' });
    const res = await POST(req);

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(res.headers.get('location')).toBe('http://localhost/');
  });
});
