import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  logError: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: mocks.createClient,
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: mocks.logError,
  },
}));

import { GET } from '@/app/api/interviews/route';

describe('GET /api/interviews', () => {
  it('logs list failures with structured diagnostics', async () => {
    const listError = new Error('interview list unavailable');
    mocks.createClient.mockRejectedValue(listError);

    const response = await GET(new NextRequest('https://proofound.io/api/interviews'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch interviews' });
    expect(mocks.logError).toHaveBeenCalledWith('interviews.list.failed', {
      error: listError,
    });
  });
});
