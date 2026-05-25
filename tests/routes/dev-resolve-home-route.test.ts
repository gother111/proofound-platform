import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  resolveUserHomePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { GET } from '@/app/dev/resolve-home/route';
import { resolveUserHomePath } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

describe('GET /dev/resolve-home', () => {
  it('fails closed outside development before resolving auth state', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload).toEqual({ ok: false });
    expect(createClient).not.toHaveBeenCalled();
    expect(resolveUserHomePath).not.toHaveBeenCalled();
  });
});
