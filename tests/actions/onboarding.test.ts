import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeIndividualOnboarding, completeOrganizationOnboarding } from '@/actions/onboarding';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';
import { syncReadinessMilestones } from '@/lib/readiness/analytics';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { emitIndividualOnboardingCompleted } from '@/lib/analytics/events';

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

vi.mock('@/lib/launch/trace', () => ({
  startLaunchTrace: vi.fn(() => ({
    objectRefs: {},
    startedAtMs: 0,
  })),
  emitLaunchTrace: vi.fn(),
}));

describe('onboarding actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://proofound.io';
    (requireAuth as any).mockResolvedValue({ id: 'user-1' });
    (syncReadinessMilestones as any).mockResolvedValue(undefined);
    (emitIndividualOnboardingCompleted as any).mockResolvedValue(undefined);
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

  function createSupabaseFromMap(entries: Record<string, Record<string, any>>) {
    return {
      from: vi.fn((table: string) => {
        const entry = entries[table];
        if (!entry) {
          throw new Error(`Unexpected table: ${table}`);
        }

        return entry;
      }),
    };
  }

  it('returns individual public portfolio URL and applies day-1 privacy defaults', async () => {
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });
    const individualUpsert = vi.fn().mockResolvedValue({ error: null });
    const matchingProfileUpsert = vi.fn().mockResolvedValue({ error: null });
    const experienceInsert = vi.fn().mockResolvedValue({ error: null });
    const proofArtifactInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackItemInsert = vi.fn().mockResolvedValue({ error: null });

    (createClient as any).mockResolvedValue(
      createSupabaseFromMap({
        profiles: { update: profileUpdate },
        individual_profiles: { upsert: individualUpsert },
        matching_profiles: { upsert: matchingProfileUpsert },
        experiences: { insert: experienceInsert },
        proof_artifacts: { insert: proofArtifactInsert },
        proof_packs: { insert: proofPackInsert },
        proof_pack_items: { insert: proofPackItemInsert },
      })
    );

    const formData = new FormData();
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'Jane_Founder');
    formData.set('headline', 'Builder');
    formData.set('location', 'Stockholm, Sweden');
    formData.set('timezone', 'Europe/Stockholm');
    formData.set('focusArea', 'Proof-first onboarding');
    formData.set('workMode', 'remote');
    formData.set('engagementType', 'contract');
    formData.set('contextType', 'experience');
    formData.set('contextTitle', 'Onboarding lead');
    formData.set('contextOrganizationName', 'Proofound');
    formData.set('contextSummary', 'Led the MVP onboarding corridor.');
    formData.set('contextDuration', '2025 to present');
    formData.set('contextOutcomes', 'Reduced the corridor to one calm proof-first path.');
    formData.set('contextProjects', 'Published the first proof-first launch corridor.');
    formData.set('contextCollaboration', 'Worked with product and design.');
    formData.set('contextAchievement', 'Shipped the locked MVP onboarding block.');
    formData.set('proofUrl', 'https://example.com/projects/proof-first');
    formData.set('proofTitle', 'Proof-first corridor launch');
    formData.set('proofSummary', 'Shows the first proof-backed onboarding launch.');

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual({
      success: true,
      handle: 'jane_founder',
      publicPortfolioUrl: 'https://proofound.io/portfolio/jane_founder',
      portfolioReady: true,
      browseReady: false,
      qualifiedIntroReady: false,
    });

    expect(individualUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'public',
        field_visibility: expect.objectContaining({
          contact: false,
          workEmail: false,
        }),
      })
    );
    expect(matchingProfileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        desired_roles: ['Proof-first onboarding'],
        work_mode: 'remote',
        engagement_type: 'contract',
      })
    );
    expect(experienceInsert).toHaveBeenCalledTimes(1);
    expect(proofArtifactInsert).toHaveBeenCalledTimes(1);
    expect(proofPackInsert).toHaveBeenCalledTimes(1);
    expect(proofPackItemInsert).toHaveBeenCalledTimes(1);
    expect(reconcileVerifierContradictions).toHaveBeenCalledWith({
      verifierProfileId: 'user-1',
    });
    expect(revalidatePath).toHaveBeenCalledWith('/portfolio/jane_founder');
  });

  it('returns organization public portfolio URL and seeds day-1 org visibility defaults', async () => {
    const orgInsert = vi.fn().mockResolvedValue({ error: null });
    const memberInsert = vi.fn().mockResolvedValue({ error: null });
    const personaEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: personaEq });
    const visibilityUpsert = vi.fn().mockResolvedValue({ error: null });

    const organizationMembersTable = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: memberInsert,
    };

    const organizationsTable = {
      insert: orgInsert,
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    (createClient as any).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'organization_members') {
          return organizationMembersTable;
        }
        if (table === 'organizations') {
          return organizationsTable;
        }
        if (table === 'profiles') {
          return { update: profileUpdate };
        }
        if (table === 'organization_field_visibility') {
          return { upsert: visibilityUpsert };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('displayName', 'Acme Impact');
    formData.set('slug', 'acme-impact');
    formData.set('type', 'company');

    const result = await completeOrganizationOnboarding(formData);

    expect(result).toEqual({
      success: true,
      orgSlug: 'acme-impact',
      publicPortfolioUrl: 'https://proofound.io/portfolio/org/acme-impact',
    });

    expect(visibilityUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        display_name: 'public',
        mission: 'public',
        vision: 'public',
        causes: 'public',
        work_culture: 'internal_only',
      })
    );
    expect(revalidatePath).toHaveBeenCalledWith('/portfolio/org/acme-impact');
  });

  it('creates onboarding proof seeds through canonical proof packs instead of skill_proofs', async () => {
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });
    const individualUpsert = vi.fn().mockResolvedValue({ error: null });
    const matchingProfileUpsert = vi.fn().mockResolvedValue({ error: null });
    const educationInsert = vi.fn().mockResolvedValue({ error: null });
    const proofArtifactInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackItemInsert = vi.fn().mockResolvedValue({ error: null });

    (createClient as any).mockResolvedValue(
      createSupabaseFromMap({
        profiles: { update: profileUpdate },
        individual_profiles: { upsert: individualUpsert },
        matching_profiles: { upsert: matchingProfileUpsert },
        education: { insert: educationInsert },
        proof_artifacts: { insert: proofArtifactInsert },
        proof_packs: { insert: proofPackInsert },
        proof_pack_items: { insert: proofPackItemInsert },
        skills: {
          insert: vi.fn(() => {
            throw new Error('onboarding should not write skills');
          }),
        },
        skill_proofs: {
          insert: vi.fn(() => {
            throw new Error('onboarding should not write skill_proofs');
          }),
        },
      })
    );

    const formData = new FormData();
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'jane_founder');
    formData.set('headline', 'Builder');
    formData.set('location', 'Stockholm, Sweden');
    formData.set('timezone', 'Europe/Stockholm');
    formData.set('focusArea', 'Product strategy');
    formData.set('workMode', 'remote');
    formData.set('engagementType', 'fractional');
    formData.set('contextType', 'education');
    formData.set('contextTitle', 'Proof systems cohort');
    formData.set('contextOrganizationName', 'Proof Academy');
    formData.set('contextSummary', 'A focused learning program on proof systems.');
    formData.set('contextDuration', 'Spring 2026');
    formData.set('contextOutcomes', 'Built a proof-first onboarding prototype.');
    formData.set('contextProjects', 'Structured a live Proof Pack from the course.');
    formData.set('contextDegree', 'Independent fellowship');
    formData.set('contextSkills', 'Proof systems, product strategy');
    formData.set('proofUrl', 'https://example.com/projects/proof-pack');
    formData.set('proofTitle', 'Proof Pack Launch');
    formData.set('proofSummary', 'A live proof-backed launch artifact.');

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        handle: 'jane_founder',
      })
    );
    expect(educationInsert).toHaveBeenCalledTimes(1);
    expect(proofArtifactInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Proof Pack Launch',
        source_url: 'https://example.com/projects/proof-pack',
        metadata: expect.objectContaining({
          imported_from: 'onboarding',
          focus_area: 'Product strategy',
        }),
      })
    );
    expect(proofPackInsert).toHaveBeenCalledTimes(1);
    expect(proofPackItemInsert).toHaveBeenCalledTimes(1);
  });
});
