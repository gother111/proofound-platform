import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/expertise/user-skills/[id]/proofs/route';
import { requireApiAuthContext } from '@/lib/auth';
import { emitSkillProofAddedAsync } from '@/lib/analytics/events';
import { upsertCanonicalSkillProof } from '@/lib/canonical/repository';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { attachUploadedFile } from '@/lib/uploads/lifecycle';
import { listCanonicalSkillProofRowsForOwnerSkill } from '@/lib/proofs/canonical-pack';

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitSkillProofAddedAsync: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  attachUploadedFile: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicPortfolioByProfileId: vi.fn(),
}));

vi.mock('@/lib/canonical/repository', () => ({
  upsertCanonicalSkillProof: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalSkillProofRowsForOwnerSkill: vi.fn(),
}));

function createSupabaseMock({ anchorExists = true }: { anchorExists?: boolean } = {}) {
  const skillQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'skill-1', profile_id: 'user-1' },
      error: null,
    }),
  };

  const anchorQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: anchorExists ? { id: 'experience-1', user_id: 'user-1' } : null,
      error: anchorExists ? null : { message: 'missing' },
    }),
  };

  return {
    from: vi.fn((table: string) => {
      if (table === 'skills') {
        return skillQuery;
      }
      if (table === 'experiences' || table === 'education' || table === 'volunteering') {
        return anchorQuery;
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
  };
}

describe('expertise user-skill proofs route', () => {
  const authContext: { user: { id: string }; supabase: unknown } = {
    user: { id: 'user-1' },
    supabase: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
    authContext.supabase = createSupabaseMock();
    vi.mocked(requireApiAuthContext).mockResolvedValue(authContext as any);
    vi.mocked(attachUploadedFile).mockResolvedValue(null as any);
    vi.mocked(listCanonicalSkillProofRowsForOwnerSkill).mockResolvedValue([]);
    vi.mocked(upsertCanonicalSkillProof).mockResolvedValue({
      artifact: { id: 'artifact-1' },
      pack: { id: 'pack-1', title: 'Anchored proof pack' },
      legacyProof: {
        id: 'proof-1',
        title: 'project alpha',
        proof_type: 'link',
      },
    } as any);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE;
  });

  it('blocks new proof creation without a primary anchor context', async () => {
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

    expect(response.status).toBe(400);
    expect(payload.error).toBe('Validation failed');
    expect(vi.mocked(upsertCanonicalSkillProof)).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON before skill params, anchor checks, or proof creation', async () => {
    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"proofType":',
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: 'Invalid JSON body' });
    expect((authContext.supabase as any).from).not.toHaveBeenCalled();
    expect(vi.mocked(upsertCanonicalSkillProof)).not.toHaveBeenCalled();
  });

  it('blocks proof creation when the primary anchor does not belong to the user', async () => {
    authContext.supabase = createSupabaseMock({ anchorExists: false });

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'link',
        url: 'https://example.com/project-alpha',
        primaryAnchor: {
          type: 'experience',
          id: '11111111-1111-4111-8111-111111111111',
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toBe('A valid primary anchor context is required for every new proof.');
    expect(vi.mocked(upsertCanonicalSkillProof)).not.toHaveBeenCalled();
  });

  it('creates a proof when an owned primary anchor context is provided', async () => {
    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'link',
        url: 'https://example.com/project-alpha',
        primaryAnchor: {
          type: 'experience',
          id: '11111111-1111-4111-8111-111111111111',
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(vi.mocked(upsertCanonicalSkillProof)).toHaveBeenCalledWith(
      expect.objectContaining({
        skillId: 'skill-1',
        profileId: 'user-1',
        primaryAnchor: {
          type: 'experience',
          id: '11111111-1111-4111-8111-111111111111',
        },
      })
    );
    expect(payload.proof.canonicalPackId).toBe('pack-1');
    expect(revalidatePublicPortfolioByProfileId).toHaveBeenCalledWith('user-1');
    expect(emitSkillProofAddedAsync).toHaveBeenCalledWith(
      'user-1',
      'skill-1',
      'artifact-1',
      expect.objectContaining({
        proof_type: 'link',
      })
    );
  });

  it('does not let caller metadata override server-controlled proof visibility', async () => {
    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'link',
        url: 'https://example.com/project-alpha',
        primaryAnchor: {
          type: 'experience',
          id: '11111111-1111-4111-8111-111111111111',
        },
        metadata: {
          visibility: 'public',
          uploadedFileId: 'attacker-controlled',
          importedFrom: 'attacker-controlled',
          primaryAnchorId: 'attacker-controlled',
          harmlessNote: 'kept',
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });

    expect(response.status).toBe(201);
    expect(vi.mocked(upsertCanonicalSkillProof)).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          visibility: 'match-only',
          uploadedFileId: null,
          primaryAnchorId: '11111111-1111-4111-8111-111111111111',
          harmlessNote: 'kept',
        }),
      })
    );
    const payload = vi.mocked(upsertCanonicalSkillProof).mock.calls[0]?.[0];
    expect(payload?.metadata).not.toHaveProperty('importedFrom');
  });

  it('returns a mock proof in local mock Supabase mode without touching canonical storage', async () => {
    process.env.NEXT_PUBLIC_USE_MOCK_SUPABASE = 'true';
    authContext.supabase = createSupabaseMock({ anchorExists: false });

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'link',
        title: 'Mock proof',
        url: 'https://example.com/project-alpha',
        primaryAnchor: {
          type: 'experience',
          id: '11111111-1111-4111-8111-111111111111',
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.proof.canonicalPackId).toBe('mock-pack-skill-1');
    expect(payload.proof.title).toBe('Mock proof');
    expect(vi.mocked(upsertCanonicalSkillProof)).not.toHaveBeenCalled();
    expect(revalidatePublicPortfolioByProfileId).not.toHaveBeenCalled();
  });

  it('uses a neutral fallback title for uploaded files and surfaces privacy-review holds', async () => {
    vi.mocked(attachUploadedFile).mockResolvedValueOnce({
      quarantine_path: 'individual_profile/user-1/proof/123-jane_doe_resume.pdf',
      durable_path: null,
      public_path: null,
    } as any);

    const request = new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proofType: 'document',
        uploadedFileId: '44444444-4444-4444-8444-444444444444',
        primaryAnchor: {
          type: 'experience',
          id: '11111111-1111-4111-8111-111111111111',
        },
      }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'skill-1' }) });

    expect(response.status).toBe(201);
    expect(vi.mocked(upsertCanonicalSkillProof)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Uploaded document',
      })
    );

    vi.mocked(attachUploadedFile).mockResolvedValueOnce(null as any);

    const heldRequest = new NextRequest(
      'http://localhost/api/expertise/user-skills/skill-1/proofs',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofType: 'document',
          uploadedFileId: '44444444-4444-4444-8444-444444444444',
          primaryAnchor: {
            type: 'experience',
            id: '11111111-1111-4111-8111-111111111111',
          },
        }),
      }
    );

    const heldResponse = await POST(heldRequest, { params: Promise.resolve({ id: 'skill-1' }) });
    const heldPayload = await heldResponse.json();

    expect(heldResponse.status).toBe(409);
    expect(heldPayload.message).toContain('privacy review');
  });
});
