import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/db', () => ({
  db: {
    query: {
      profiles: {
        findFirst: vi.fn(),
      },
      individualProfiles: {
        findFirst: vi.fn(),
      },
    },
    select: vi.fn(),
  },
}));

vi.mock('@/lib/skills/gap-service', () => ({
  computeSkillGaps: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  requireApiAuthContext: vi.fn(),
}));

vi.mock('@/lib/proofs/canonical-pack', () => ({
  listCanonicalProofPackAggregatesForOwner: vi.fn(async () => []),
  summarizeCanonicalProofOwnerAggregates: vi.fn(() => ({
    packCount: 0,
    publicProofSignalCount: 0,
    verifiedVerificationCount: 0,
    subjectSummaries: [],
  })),
}));

import { db } from '@/db';
import {
  experiences,
  individualProfiles,
  matches,
  profiles,
  proofArtifacts,
  proofPackItems,
  proofPacks,
  skillProofs,
  skills,
  verificationRecords,
} from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { GET as getProfileCompleteness } from '@/app/api/profile/completeness/route';
import { getIndividualProfileCompletionState } from '@/lib/profile/completion-flow.server';
import * as canonicalPack from '@/lib/proofs/canonical-pack';
import { getIndividualReadiness } from '@/lib/readiness/individual';
import { computeSkillGaps } from '@/lib/skills/gap-service';

function containsColumnName(
  value: unknown,
  targetColumnName: string,
  visited: Set<object> = new Set()
): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  if (visited.has(value)) {
    return false;
  }
  visited.add(value);

  if ('name' in value && (value as { name?: unknown }).name === targetColumnName) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsColumnName(item, targetColumnName, visited));
  }

  return Object.values(value as Record<string, unknown>).some((item) =>
    containsColumnName(item, targetColumnName, visited)
  );
}

describe('verification integrity alignment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(canonicalPack, 'listCanonicalProofPackAggregatesForOwner').mockResolvedValue([]);
  });

  it('uses integrity_status clear in readiness accepted verification counter', async () => {
    const selectSpy = db.select as any;
    const queryDb = db.query as any;

    queryDb.profiles.findFirst.mockResolvedValue({
      displayName: 'Jane Doe',
      avatarUrl: 'https://example.com/avatar.png',
    });
    queryDb.individualProfiles.findFirst.mockResolvedValue({
      headline: 'Engineer',
      mission: 'Build reliable systems',
    });
    (computeSkillGaps as any).mockResolvedValue({ gaps: [] });

    let verificationSelectShape: any = null;

    selectSpy.mockImplementation((shape: any) => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => {
          if (table === skills) {
            return Promise.resolve([{ count: 6 }]);
          }
          if (table === skillProofs) {
            return Promise.resolve([{ totalProofs: 2, verifiedProofs: 1 }]);
          }
          if (table === verificationRecords) {
            verificationSelectShape = shape;
            return Promise.resolve([{ pending: 1, accepted: 1 }]);
          }
          if (table === matches) {
            return Promise.resolve([{ totalMatches: 2, highQualityMatches: 1 }]);
          }
          if (table === proofPacks || table === proofPackItems || table === proofArtifacts) {
            return Promise.resolve([]);
          }
          throw new Error('Unexpected table in readiness select');
        }),
      })),
    }));

    await getIndividualReadiness('user-1');

    expect(verificationSelectShape).toBeTruthy();
    expect(containsColumnName(verificationSelectShape.accepted, 'integrity_status')).toBe(true);
  });

  it('uses integrity_status clear in completion-flow accepted verification counter', async () => {
    const selectSpy = db.select as any;
    vi.mocked(canonicalPack.summarizeCanonicalProofOwnerAggregates).mockReturnValue({
      packCount: 0,
      publicPackCount: 0,
      artifactCount: 0,
      publicArtifactCount: 0,
      publicProofSignalCount: 0,
      verificationReferenceCount: 2,
      activeVerificationCount: 2,
      verifiedVerificationCount: 1,
      subjectSummaries: [],
    });

    selectSpy.mockImplementation(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => {
          if (table === profiles) {
            return {
              limit: vi.fn().mockResolvedValue([{ displayName: 'Jane Doe' }]),
            };
          }
          if (table === individualProfiles) {
            return {
              limit: vi.fn().mockResolvedValue([{ values: ['impact'], causes: ['climate'] }]),
            };
          }
          if (table === skills) {
            return Promise.resolve([{ count: 5 }]);
          }
          if (table === skillProofs) {
            return Promise.resolve([{ count: 1 }]);
          }
          if (table === verificationRecords) {
            return Promise.resolve([
              {
                id: 'verification-clear',
                ownerType: 'individual_profile',
                ownerId: 'user-1',
                status: 'verified',
                integrityStatus: 'clear',
              },
              {
                id: 'verification-warning',
                ownerType: 'individual_profile',
                ownerId: 'user-1',
                status: 'verified',
                integrityStatus: 'warning',
              },
            ]);
          }
          throw new Error('Unexpected table in completion-flow select');
        }),
      })),
    }));

    const state = await getIndividualProfileCompletionState('user-1');

    expect(state.counts.acceptedVerifications).toBe(1);
  });

  it('uses integrity_status clear in profile completeness verification count', async () => {
    vi.mocked(canonicalPack.summarizeCanonicalProofOwnerAggregates).mockReturnValue({
      packCount: 0,
      publicPackCount: 0,
      artifactCount: 0,
      publicArtifactCount: 0,
      publicProofSignalCount: 0,
      verificationReferenceCount: 2,
      activeVerificationCount: 2,
      verifiedVerificationCount: 1,
      subjectSummaries: [],
    } as any);
    (requireApiAuthContext as any).mockResolvedValue({
      user: { id: 'user-1' },
      supabase: {
        from: vi.fn((table: string) => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data:
                  table === 'profiles'
                    ? { display_name: 'Jane Doe', avatar_url: 'https://example.com/a.png' }
                    : table === 'individual_profiles'
                      ? { headline: 'Engineer', bio: 'Bio', mission: 'Mission' }
                      : { location: 'Stockholm' },
                error: null,
              }),
            })),
          })),
        })),
      },
    });

    const selectSpy = db.select as any;

    selectSpy.mockImplementation(() => ({
      from: vi.fn((table: unknown) => ({
        where: vi.fn(() => {
          if (table === skills) {
            return Promise.resolve([{ count: 5 }]);
          }
          if (table === skillProofs) {
            return Promise.resolve([{ count: 2 }]);
          }
          if (table === experiences) {
            return Promise.resolve([{ count: 1 }]);
          }
          if (
            table === proofPacks ||
            table === proofPackItems ||
            table === proofArtifacts ||
            table === verificationRecords
          ) {
            return Promise.resolve([]);
          }
          throw new Error('Unexpected table in profile completeness select');
        }),
      })),
    }));

    (db.query as any).profiles.findFirst.mockResolvedValue({
      displayName: 'Jane Doe',
      avatarUrl: 'https://example.com/a.png',
    });
    (db.query as any).individualProfiles.findFirst.mockResolvedValue({
      headline: 'Engineer',
      mission: 'Mission',
    });
    (db.query as any).verificationRecords = {
      findMany: vi.fn(async () => [
        {
          id: 'verification-clear',
          ownerType: 'individual_profile',
          ownerId: 'user-1',
          status: 'verified',
          integrityStatus: 'clear',
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'verification-warning',
          ownerType: 'individual_profile',
          ownerId: 'user-1',
          status: 'verified',
          integrityStatus: 'warning',
          updatedAt: new Date().toISOString(),
        },
      ]),
    };

    const response = await getProfileCompleteness();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.proofCount).toBe(0);
  });
});
