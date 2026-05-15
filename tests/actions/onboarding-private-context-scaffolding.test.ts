import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/verification/contradiction', () => ({
  reconcileVerifierContradictions: vi.fn(),
}));

vi.mock('@/lib/readiness/analytics', () => ({
  syncReadinessMilestones: vi.fn(),
}));

vi.mock('@/lib/readiness/individual-state', () => ({
  getIndividualReadinessState: vi.fn(),
}));

vi.mock('@/lib/analytics/events', () => ({
  emitIndividualOnboardingCompleted: vi.fn(),
}));

vi.mock('@/lib/uploads/lifecycle', () => ({
  attachUploadedFile: vi.fn(),
}));

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

import { completeIndividualOnboarding } from '@/actions/onboarding';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';

function buildFormData(contextType: 'experience' | 'education' | 'volunteering') {
  const formData = new FormData();
  formData.set('firstName', 'Jordan');
  formData.set('lastName', 'Proof');
  formData.set('displayName', 'Jordan Proof');
  formData.set('handle', `jordan-${contextType}`);
  formData.set('headline', 'Proof builder');
  formData.set('location', 'Stockholm');
  formData.set('timezone', 'Europe/Stockholm');
  formData.set('focusArea', 'Proof-first work');
  formData.set('workMode', 'remote');
  formData.set('engagementType', 'contract');
  formData.set('contextType', contextType);
  formData.set('contextTitle', 'Context title');
  formData.set('contextOrganizationName', 'Context org');
  formData.set('contextSummary', 'Context summary');
  formData.set('contextDuration', '2025 - Present');
  formData.set('contextOutcome', 'Context outcome');
  formData.set('proofUrl', 'https://example.com/proof');
  formData.set('proofTitle', 'Proof title');
  formData.set('proofSummary', 'Proof summary');
  formData.set('proofPackClaim', 'Proof claim');
  formData.set('proofPackOwnership', 'I owned this work.');
  formData.set('proofPackOutcome', 'Proof outcome');
  formData.set('proofPackSkills', 'Proof writing, artifact review, onboarding design');
  return formData;
}

function buildSupabase(contextType: 'experience' | 'education' | 'volunteering') {
  const profileEq = vi.fn().mockResolvedValue({ error: null });
  const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });
  const individualUpsert = vi.fn().mockResolvedValue({ error: null });
  const matchingProfileUpsert = vi.fn().mockResolvedValue({ error: null });
  const proofArtifactInsert = vi.fn().mockResolvedValue({ error: null });
  const proofPackInsert = vi.fn().mockResolvedValue({ error: null });
  const proofPackItemInsert = vi.fn().mockResolvedValue({ error: null });
  const experiencesInsert = vi.fn().mockResolvedValue({ error: null });
  const educationInsert = vi.fn().mockResolvedValue({ error: null });
  const volunteeringInsert = vi.fn().mockResolvedValue({ error: null });

  const supabase = {
    from: vi.fn((table: string) => {
      switch (table) {
        case 'profiles':
          return { update: profileUpdate };
        case 'individual_profiles':
          return { upsert: individualUpsert };
        case 'matching_profiles':
          return { upsert: matchingProfileUpsert };
        case 'proof_artifacts':
          return { insert: proofArtifactInsert };
        case 'proof_packs':
          return { insert: proofPackInsert };
        case 'proof_pack_items':
          return { insert: proofPackItemInsert };
        case 'experiences':
          return { insert: experiencesInsert };
        case 'education':
          return { insert: educationInsert };
        case 'volunteering':
          return { insert: volunteeringInsert };
        default:
          throw new Error(`Unexpected table: ${table}`);
      }
    }),
  };

  return {
    supabase,
    contextInsertByType: {
      experience: experiencesInsert,
      education: educationInsert,
      volunteering: volunteeringInsert,
    }[contextType],
    otherInserts:
      contextType === 'experience'
        ? [educationInsert, volunteeringInsert]
        : contextType === 'education'
          ? [experiencesInsert, volunteeringInsert]
          : [experiencesInsert, educationInsert],
  };
}

describe('individual onboarding private context scaffolding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
    (getIndividualReadinessState as any).mockResolvedValue({
      highestState: 'portfolio_ready',
      states: ['portfolio_ready'],
      flags: {
        portfolioReady: true,
        browseReady: false,
        qualifiedIntroReady: false,
      },
    });
  });

  it.each([['experience'], ['education'], ['volunteering']] as const)(
    'persists the %s onboarding context through the canonical proof-pack flow',
    async (contextType) => {
      const tables = buildSupabase(contextType);
      (createClient as any).mockResolvedValue(tables.supabase);

      const result = await completeIndividualOnboarding(buildFormData(contextType));

      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          handle: `jordan-${contextType}`,
          portfolioReady: true,
        })
      );
      expect(tables.contextInsertByType).toHaveBeenCalledTimes(1);
      expect(tables.otherInserts[0]).not.toHaveBeenCalled();
      expect(tables.otherInserts[1]).not.toHaveBeenCalled();
    }
  );
});
