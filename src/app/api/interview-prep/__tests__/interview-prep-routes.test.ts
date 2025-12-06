import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {},
}));

import { GET as sessionsGET, POST as sessionsPOST } from '../sessions/route';
import { GET as tipsGET } from '../tips/route';
import { POST as questionsPOST } from '../questions/route';
import { POST as reflectionsPOST } from '../reflections/route';
import { createClient } from '@/lib/supabase/server';

const mockSupabaseUser = (userId: string | null) => {
  (createClient as any).mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: userId ? { id: userId } : null },
        error: userId ? null : new Error('no user'),
      }),
    },
  });
};

describe('Interview Prep API validation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 when sessions GET has no user', async () => {
    mockSupabaseUser(null);
    const res = (await sessionsGET()) as Response;
    expect(res.status).toBe(401);
  });

  it('returns 400 when tips missing assignmentId', async () => {
    mockSupabaseUser('user-1');
    const req = new NextRequest('https://example.com/api/interview-prep/tips');
    const res = (await tipsGET(req)) as Response;
    expect(res.status).toBe(400);
  });

  it('returns 400 when questions POST missing sessionId', async () => {
    mockSupabaseUser('user-1');
    const req = new NextRequest('https://example.com/api/interview-prep/questions', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = (await questionsPOST(req)) as Response;
    expect(res.status).toBe(400);
  });

  it('returns 400 when reflections POST missing sessionId', async () => {
    mockSupabaseUser('user-1');
    const req = new NextRequest('https://example.com/api/interview-prep/reflections', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = (await reflectionsPOST(req)) as Response;
    expect(res.status).toBe(400);
  });

  it('returns 400 when sessions POST missing interviewId', async () => {
    mockSupabaseUser('user-1');
    const req = new NextRequest('https://example.com/api/interview-prep/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = (await sessionsPOST(req)) as Response;
    expect(res.status).toBe(400);
  });
});
