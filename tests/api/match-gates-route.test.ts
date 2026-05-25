import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/match/gates/route';
import { requireApiAuthContext } from '@/lib/auth';
import { checkVerificationGates } from '@/lib/verification/gates';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/verification/gates', () => ({
  checkVerificationGates: vi.fn(),
}));

vi.mock('@/lib/log', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe('/api/match/gates route', () => {
  function request(body: unknown) {
    return new NextRequest('http://localhost/api/match/gates', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    });
  }

  function rawRequest(body: string) {
    return new NextRequest('http://localhost/api/match/gates', {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {},
    } as any);
    vi.mocked(checkVerificationGates).mockResolvedValue({
      passed: true,
      unmetGates: [],
      userVerifications: [],
      canIntroduce: true,
    } as any);
  });

  it('rejects malformed JSON before checking verification gates', async () => {
    const response = await POST(rawRequest('{"assignmentId":'));

    await expect(response.json()).resolves.toEqual({ error: 'Invalid JSON body' });
    expect(response.status).toBe(400);
    expect(checkVerificationGates).not.toHaveBeenCalled();
  });

  it('checks gates for a valid assignment request', async () => {
    const response = await POST(request({ assignmentId: 'assignment-1' }));

    await expect(response.json()).resolves.toEqual({
      passed: true,
      unmetGates: [],
      userVerifications: [],
      canIntroduce: true,
    });
    expect(response.status).toBe(200);
    expect(checkVerificationGates).toHaveBeenCalledWith('user-1', 'assignment-1');
  });
});
