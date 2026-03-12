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
import {
  deleteCanonicalProofArtifactById,
  deleteCanonicalProofArtifactForSkillProof,
} from '@/lib/canonical/repository';

describe('expertise user-skill proof delete route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.query.proofArtifacts.findFirst as any).mockResolvedValue(null);
  });

  it('prefers canonical proof deletion when a canonical artifact exists', async () => {
    const legacyDeleteEqProfile = vi.fn().mockResolvedValue({ error: null });
    const legacyDeleteEqSkill = vi.fn().mockReturnValue({ eq: legacyDeleteEqProfile });
    const legacyDeleteEqId = vi.fn().mockReturnValue({ eq: legacyDeleteEqSkill });
    const legacyDelete = vi.fn().mockReturnValue({ eq: legacyDeleteEqId });
    const legacyFrom = vi.fn((table: string) => {
      if (table !== 'skill_proofs') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        delete: legacyDelete,
      };
    });

    vi.mocked(db.query.proofArtifacts.findFirst as any).mockResolvedValue({
      id: 'artifact-1',
      legacySourceId: 'proof-1',
      ownerType: 'individual_profile',
      ownerId: 'user-1',
      subjectType: 'skill',
      subjectId: 'skill-1',
      title: 'Canonical proof',
      artifactKind: 'link',
      storagePath: null,
    });

    vi.mocked(requireApiAuthContext).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: legacyFrom,
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
    expect(deleteCanonicalProofArtifactById).toHaveBeenCalledWith('artifact-1');
    expect(deleteCanonicalProofArtifactForSkillProof).not.toHaveBeenCalled();
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

  it('falls back to legacy deletion for historical skill_proofs rows without canonical artifacts', async () => {
    const proofLookup = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'proof-legacy',
          skill_id: 'skill-1',
          profile_id: 'user-1',
          title: 'Legacy proof',
          proof_type: 'reference',
          file_path: null,
        },
        error: null,
      }),
      delete: vi.fn().mockReturnThis(),
    };

    vi.mocked(db.query.proofArtifacts.findFirst as any).mockResolvedValue(null);

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
      new NextRequest('http://localhost/api/expertise/user-skills/skill-1/proofs/proof-legacy', {
        method: 'DELETE',
      }),
      { params: Promise.resolve({ id: 'skill-1', proofId: 'proof-legacy' }) }
    );

    expect(response.status).toBe(200);
    expect(deleteCanonicalProofArtifactById).not.toHaveBeenCalled();
    expect(deleteCanonicalProofArtifactForSkillProof).toHaveBeenCalledWith('proof-legacy');
  });
});
