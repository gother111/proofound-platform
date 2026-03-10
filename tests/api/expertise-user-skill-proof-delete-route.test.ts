import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/db', () => ({
  db: {
    query: {
      proofArtifacts: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitSkillProofDeletedAsync: vi.fn(),
}));

vi.mock('@/lib/canonical/repository', () => ({
  CANONICAL_PROOFS_WRITE_ENABLED: false,
  deleteCanonicalProofArtifactById: vi.fn(),
  deleteCanonicalProofArtifactForSkillProof: vi.fn(),
}));

vi.mock('@/lib/portfolio/public-invalidation', () => ({
  revalidatePublicPortfolioByProfileId: vi.fn(),
}));

import { DELETE } from '@/app/api/expertise/user-skills/[id]/proofs/[proofId]/route';
import { requireApiAuthContext } from '@/lib/auth';
import { revalidatePublicPortfolioByProfileId } from '@/lib/portfolio/public-invalidation';
import { db } from '@/db';
import { deleteCanonicalProofArtifactById } from '@/lib/canonical/repository';

describe('expertise user-skill proof delete route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.proofArtifacts.findFirst as any).mockResolvedValue(null);
  });

  it('deletes proof and invalidates the public projection immediately', async () => {
    const proofLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'proof-1',
          skill_id: 'skill-1',
          profile_id: 'user-1',
          title: 'Public proof',
          proof_type: 'link',
          file_path: null,
        },
        error: null,
      }),
      delete: vi.fn().mockReturnThis(),
    };

    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => proofLookup),
        storage: {
          from: vi.fn(() => ({
            remove: vi.fn().mockResolvedValue({ error: null }),
          })),
        },
      },
    } as any);

    const response = await DELETE(
      new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs/proof-1', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'skill-1', proofId: 'proof-1' }) }
    );

    expect(response.status).toBe(200);
    expect(revalidatePublicPortfolioByProfileId).toHaveBeenCalledWith('user-1');
  });

  it('deletes canonical-only proof rows when no legacy skill_proofs row exists', async () => {
    const proofLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
      delete: vi.fn().mockReturnThis(),
    };

    vi.mocked(db.query.proofArtifacts.findFirst as any).mockResolvedValue({
      id: 'artifact-1',
      ownerType: 'individual_profile',
      ownerId: 'user-1',
      subjectType: 'skill',
      subjectId: 'skill-1',
      title: 'Canonical proof',
      artifactKind: 'link',
    });

    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn(() => proofLookup),
        storage: {
          from: vi.fn(() => ({
            remove: vi.fn().mockResolvedValue({ error: null }),
          })),
        },
      },
    } as any);

    const response = await DELETE(
      new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs/artifact-1', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'skill-1', proofId: 'artifact-1' }) }
    );

    expect(response.status).toBe(200);
    expect(deleteCanonicalProofArtifactById).toHaveBeenCalledWith('artifact-1');
  });
});
