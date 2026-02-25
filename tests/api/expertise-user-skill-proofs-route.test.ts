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
  let existingProofCount = 0;

  const skillsQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'skill-1', profile_id: 'user-1' },
      error: null,
    }),
  };

  const proofCountQuery = {
    eq: vi.fn().mockReturnThis(),
    data: [] as Array<{ id: string }>,
    error: null as null | { message: string },
  };

  const proofInsertQuery = {
    insert: vi.fn().mockImplementation((payload: Record<string, any>) => {
      insertedProofPayload = payload;
      return proofInsertQuery;
    }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(async () => ({
      data: { id: 'proof-1', ...insertedProofPayload },
      error: null,
    })),
  };

  const skillProofsTable = {
    select: vi.fn((columns: string) => {
      if (columns === 'id') {
        proofCountQuery.data = Array.from({ length: existingProofCount }, (_, index) => ({
          id: `proof-${index + 1}`,
        }));
        return proofCountQuery;
      }
      throw new Error(`Unexpected select columns: ${columns}`);
    }),
    insert: proofInsertQuery.insert,
  };

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'skills') return skillsQuery;
      if (table === 'skill_proofs') return skillProofsTable;
      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return {
    supabase,
    skillsQuery,
    proofInsertQuery,
    setExistingProofCount: (value: number) => {
      existingProofCount = value;
    },
  };
}

describe('expertise user-skill proofs route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({ id: 'user-1' } as any);
  });

  it('creates proof with deterministic title fallback when only URL is provided', async () => {
    const { supabase, proofInsertQuery } = createSupabaseMock();
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
    expect(proofInsertQuery.insert).toHaveBeenCalledWith(
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

  it('creates a document proof when uploaded file path is provided', async () => {
    const { supabase, proofInsertQuery } = createSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'document',
        filePath: 'proof/user-1/portfolio.pdf',
        url: '',
        title: '',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(proofInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        proof_type: 'document',
        file_path: 'proof/user-1/portfolio.pdf',
      })
    );
    expect(payload.proof.title).toBe('portfolio.pdf');
  });

  it('persists optional expiration date when provided', async () => {
    const { supabase, proofInsertQuery } = createSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'certification',
        title: 'AWS Certification',
        issuedDate: '2025-01-01',
        expiresDate: '2028-01-01',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(proofInsertQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        issued_date: '2025-01-01',
        expires_date: '2028-01-01',
      })
    );
    expect(payload.proof.expires_date).toBe('2028-01-01');
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
    expect(payload.message).toBe('Title, URL, or uploaded file is required');
  });

  it('returns validation error when expiration date is before issued date', async () => {
    const { supabase, proofInsertQuery } = createSupabaseMock();
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'certification',
        title: 'Expired Cert',
        issuedDate: '2026-01-01',
        expiresDate: '2025-01-01',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toBe('Expiration date must be on or after issued date');
    expect(proofInsertQuery.insert).not.toHaveBeenCalled();
  });

  it('rejects proof creation when skill already has the maximum number of proofs', async () => {
    const { supabase, proofInsertQuery, setExistingProofCount } = createSupabaseMock();
    setExistingProofCount(5);
    vi.mocked(createClient).mockResolvedValue(supabase as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'link',
        title: 'Proof at limit',
        url: 'https://example.com/limit',
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe('Proof limit reached');
    expect(payload.message).toContain('maximum of 5 proofs');
    expect(proofInsertQuery.insert).not.toHaveBeenCalled();
  });
});
