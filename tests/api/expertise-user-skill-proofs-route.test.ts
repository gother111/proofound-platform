import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/user-skills/[id]/proofs/route';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { emitSkillProofAddedAsync } from '@/lib/analytics/events';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitSkillProofAddedAsync: vi.fn(),
}));

function createSupabaseMock() {
  let insertedProofPayload: Record<string, any> | null = null;

  const skillsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'skill-1', profile_id: 'user-1' },
      error: null,
    }),
  };

  const proofsQuery = {
    insert: vi.fn().mockImplementation((payload: Record<string, any>) => {
      insertedProofPayload = payload;
      return proofsQuery;
    }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => ({
      data: { id: 'proof-1', ...insertedProofPayload },
      error: null,
    })),
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      if (table === 'skill_proofs') return proofsQuery;
      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return { supabase, skillsQuery, proofsQuery };
}

describe('expertise user-skill proofs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('creates proof with deterministic title fallback when only URL is provided', async () => {
    const { supabase, proofsQuery } = createSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'link',
        url: 'https://example.com/project-alpha',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(proofsQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'project alpha',
        url: 'https://example.com/project-alpha',
      })
    );
    expect(payload.proof.title).toBe('project alpha');
    expect(emitSkillProofAddedAsync).toHaveBeenCalledWith(
      'user-1',
      'skill-1',
      'proof-1',
      expect.objectContaining({
        skill_name: 'project alpha',
        proof_type: 'link',
      })
    );
  });

  it('returns explicit validation message when title and URL are missing', async () => {
    const { supabase } = createSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'project',
        description: 'No title/url should fail',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Validation failed');
    expect(payload.message).toBe('Title or URL is required');
  });
});
