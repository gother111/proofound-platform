import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/integrations/video/[provider]/auth/route';
import { createClient } from '@/lib/supabase/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('video integrations auth route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    } as any);
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const response = await GET(
      new NextRequest('http://localhost/api/integrations/video/zoom/auth'),
      {
        params: Promise.resolve({ provider: 'zoom' }),
      }
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid provider', async () => {
    const response = await GET(
      new NextRequest('http://localhost/api/integrations/video/invalid/auth'),
      { params: Promise.resolve({ provider: 'invalid' }) }
    );

    expect(response.status).toBe(400);
  });

  it('returns provider auth url with sanitized returnTo for google', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/integrations/video/google/auth?returnTo=%2Fapp%2Fo%2Facme%2Fsettings%2Fintegrations'
      ),
      {
        params: Promise.resolve({ provider: 'google' }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authUrl:
        '/api/integrations/google/connect?returnTo=%2Fapp%2Fo%2Facme%2Fsettings%2Fintegrations',
    });
  });

  it('returns coming soon for zoom provider', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/integrations/video/zoom/auth?returnTo=%2Fapp%2Fo%2Facme%2Fsettings%2Fintegrations'
      ),
      {
        params: Promise.resolve({ provider: 'zoom' }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'ZOOM_COMING_SOON',
    });
  });

  it('falls back to default settings return path when returnTo is unsafe', async () => {
    const response = await GET(
      new NextRequest(
        'http://localhost/api/integrations/video/google/auth?returnTo=https%3A%2F%2Fevil.example'
      ),
      {
        params: Promise.resolve({ provider: 'google' }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authUrl:
        '/api/integrations/google/connect?returnTo=%2Fapp%2Fi%2Fsettings%3Ftab%3Dintegrations',
    });
  });
});
