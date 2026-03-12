import { beforeEach, describe, expect, it, vi } from 'vitest';
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
});
