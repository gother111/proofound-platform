import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
  },
}));

import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { GET, POST } from '@/app/api/portfolio/view/route';

describe('/api/portfolio/view', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (createClient as any).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'profile-1' } }),
          }),
        }),
      }),
    });
  });

  it('stores profile view analytics for handles with special characters', async () => {
    (db.execute as any).mockResolvedValue([]);

    const response = await POST(
      new Request('http://localhost/api/portfolio/view?handle=alice%22%7D%2C%22x%22%3A1')
    );

    expect(response.status).toBe(200);
    expect(db.execute).toHaveBeenCalledTimes(1);
  });

  it('returns gone for owner-facing public portfolio counts', async () => {
    const response = await GET(new Request('http://localhost/api/portfolio/view?handle=alice'));
    const body = await response.json();

    expect(response.status).toBe(410);
    expect(body.error).toContain('not available in MVP');
  });
});
