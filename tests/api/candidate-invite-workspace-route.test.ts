import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/lib/security/capability-tokens', () => ({
  CAPABILITY_TOKEN_CLASSES: {
    CANDIDATE_INVITE_CLAIM: 'candidate_invite_claim',
  },
  inspectCapabilityToken: vi.fn().mockResolvedValue({
    ok: true,
    token: { id: 'cap-token-1' },
  }),
}));

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
  },
}));

import { db } from '@/db';
import { GET } from '@/app/api/candidate-invites/[token]/workspace/route';
import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/log';

function mockAuthUser(user: { id: string; email: string } | null) {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
      }),
    },
  });
}

describe('GET /api/candidate-invites/[token]/workspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'candidate@example.com',
    });
  });

  it('logs unexpected workspace failures structurally while keeping the public response generic', async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error('workspace query unavailable');
    });

    const response = await GET(
      new NextRequest('http://localhost/api/candidate-invites/token/workspace'),
      {
        params: Promise.resolve({ token: 'token-value' }),
      }
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: 'Failed to fetch submission workspace' });
    expect(log.error).toHaveBeenCalledWith('candidate_invite.workspace.fetch_failed', {
      error: 'workspace query unavailable',
    });
  });
});
