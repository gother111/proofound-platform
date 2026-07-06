import { beforeEach, describe, expect, it, vi } from 'vitest';
import { completeIndividualOnboarding, completeOrganizationOnboarding } from '@/actions/onboarding';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';
import { syncReadinessMilestones } from '@/lib/readiness/analytics';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { emitIndividualOnboardingCompleted } from '@/lib/analytics/events';
import { attachUploadedFile } from '@/lib/uploads/lifecycle';
import { log } from '@/lib/log';

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

vi.mock('@/lib/log', () => ({
  log: {
    error: vi.fn(),
    warn: vi.fn(),
  },
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

  function setFirstProofOwnershipFields(formData: FormData) {
    formData.set('proofContributionMode', 'team');
    formData.set('proofOwnershipLevel', 'owned_scope');
    formData.set('proofOwnershipNote', 'I owned the proof mapping and launch handoff.');
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
    formData.set('firstName', 'Jane');
    formData.set('lastName', 'Founder');
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'Jane_Founder');
    formData.set('headline', 'Builder');
    formData.set('location', 'Stockholm, Sweden');
    formData.set('timezone', 'Europe/Stockholm');
    formData.set('focusArea', 'Proof-first onboarding');
    formData.set('workMode', 'remote');
    formData.set('engagementType', 'contract');
    formData.set('contextType', 'experience');
    formData.set('contextKind', 'work');
    formData.set('contextTitle', 'Onboarding lead');
    formData.set('contextOrganizationName', 'Proofound');
    formData.set('contextSummary', 'Led the MVP onboarding corridor.');
    formData.set('contextDuration', '2025 to present');
    formData.set('contextOutcome', 'Reduced the corridor to one calm proof-first path.');
    formData.set('contextCompanySize', '11-50');
    formData.set('contextIndustryDomain', 'Proof-first hiring');
    formData.set('contextScope', 'global');
    formData.set('contextOperatingEnvironment', 'Remote launch team');
    formData.set('secondaryContextNote', 'Also touched founder operations.');
    formData.set('proofUrl', 'https://example.com/projects/proof-first');
    formData.set('proofTitle', 'Proof-first corridor launch');
    formData.set('proofSummary', 'Launch note showing the first proof-backed onboarding launch.');
    formData.set('proofPackClaim', 'Proof-first corridor launch');
    formData.set(
      'proofPackOwnership',
      'I owned the contribution shown in this proof inside this context.'
    );
    formData.set('proofPackOutcome', 'Reduced the corridor to one calm proof-first path.');
    formData.set(
      'proofPackMeasuredOutcomes',
      JSON.stringify([
        {
          id: 'outcome-1',
          statement: 'Reduced onboarding support tickets',
          value: '23%',
          timeframe: 'Q1 pilot',
        },
        {
          id: 'outcome-2',
          statement: 'Shortened first proof review',
          value: '2 days faster',
          timeframe: 'private beta',
        },
      ])
    );
    formData.set('proofPackSkills', 'Product strategy, stakeholder interviews, onboarding design');
    setFirstProofOwnershipFields(formData);
    formData.set('firstProofVerificationAction', 'draft');
    formData.set(
      'firstProofVerificationPreview',
      'Specific claim: Proof-first corridor launch\nObserved behavior to confirm: onboarding launch.'
    );
    formData.set(
      'firstProofVerificationConfirmers',
      JSON.stringify([
        {
          name: 'Verifier One',
          relationship: 'client',
          email: 'Verifier@Example.com',
        },
        {
          name: 'Verifier Two',
          relationship: 'organization_representative',
          email: 'org@example.com',
        },
      ])
    );

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        handle: 'jane_founder',
        publicPortfolioUrl: 'https://proofound.io/portfolio/jane_founder',
        portfolioReady: true,
        browseReady: false,
        qualifiedIntroReady: false,
      })
    );

    expect(individualUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        visibility: 'network',
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
    expect(experienceInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_description: 'Led the MVP onboarding corridor.',
        organization_industry: 'Proof-first hiring',
        organization_industry_legacy_text: 'Proof-first hiring',
        organization_employee_amount: '11-50',
        outcomes: 'Reduced the corridor to one calm proof-first path.',
        projects: 'Led the MVP onboarding corridor.',
        colleagues: 'Remote launch team',
        achievements: 'Reduced the corridor to one calm proof-first path.',
      })
    );
    expect(proofArtifactInsert).toHaveBeenCalledTimes(1);
    expect(proofPackInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        primary_claim_type: 'outcome',
        title: 'Proof-first corridor launch',
        summary: 'Proof-first corridor launch',
        role_context: 'Onboarding lead',
        ownership_statement: 'I owned the contribution shown in this proof inside this context.',
        timeframe_label: '2025 to present',
        evidence_summary: 'Launch note showing the first proof-backed onboarding launch.',
        outcomes_summary:
          'Reduced onboarding support tickets · 23% · Q1 pilot; Shortened first proof review · 2 days faster · private beta',
        verification_summary: 'No scoped verification is recorded for this proof record yet.',
        proof_quality_score: '0.60',
        schema_version: 'proof_pack/v2',
        context_json: expect.objectContaining({
          contextSummary: 'Led the MVP onboarding corridor.',
          contextOutcome: 'Reduced the corridor to one calm proof-first path.',
          contextKind: 'work',
          contextCompanySize: '11-50',
          contextIndustryDomain: 'Proof-first hiring',
          contextScope: 'global',
          contextOperatingEnvironment: 'Remote launch team',
          secondaryContextNote: 'Also touched founder operations.',
          secondaryContextLinksOptional: true,
          primaryAnchorRequiredForIntroEligibility: true,
          evidenceTitle: 'Proof-first corridor launch',
          evidenceUrl: 'https://example.com/projects/proof-first',
          proofPackOutcome:
            'Reduced onboarding support tickets · 23% · Q1 pilot; Shortened first proof review · 2 days faster · private beta',
          claimedMeasuredOutcomes: [
            expect.objectContaining({
              id: 'outcome-1',
              statement: 'Reduced onboarding support tickets',
              value: '23%',
              timeframe: 'Q1 pilot',
              supportingSkills: ['Product strategy', 'stakeholder interviews', 'onboarding design'],
              proofPackId: expect.any(String),
              proofPackTitle: 'Proof-first corridor launch',
              claimStatus: 'proof_linked',
              verificationStatus: 'proof_linked',
              supportingProofLinked: true,
            }),
            expect.objectContaining({
              id: 'outcome-2',
              statement: 'Shortened first proof review',
              value: '2 days faster',
              timeframe: 'private beta',
              supportingSkills: ['Product strategy', 'stakeholder interviews', 'onboarding design'],
              proofPackId: expect.any(String),
              proofPackTitle: 'Proof-first corridor launch',
              claimStatus: 'proof_linked',
              verificationStatus: 'proof_linked',
              supportingProofLinked: true,
            }),
          ],
          outcomeClaimStatus: 'proof_linked',
          outcomeVerificationStatus: 'proof_linked',
          proofPackSkills: ['Product strategy', 'stakeholder interviews', 'onboarding design'],
          proofContributionMode: 'team',
          proofOwnershipLevel: 'owned_scope',
          proofOwnershipNote: 'I owned the proof mapping and launch handoff.',
          firstProofVerificationIntent: expect.objectContaining({
            action: 'draft',
            preview:
              'Specific claim: Proof-first corridor launch\nObserved behavior to confirm: onboarding launch.',
            confirmers: [
              {
                name: 'Verifier One',
                relationship: 'client',
                email: 'verifier@example.com',
              },
              {
                name: 'Verifier Two',
                relationship: 'organization_representative',
                email: 'org@example.com',
              },
            ],
            semantics:
              'Scoped verification request draft only; email transport does not equal verification.',
          }),
        }),
      })
    );
    expect(proofArtifactInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          context_kind: 'work',
          context_industry_domain: 'Proof-first hiring',
          context_company_size: '11-50',
          context_operating_environment: 'Remote launch team',
          secondary_context_links_optional: true,
          primary_anchor_required_for_intro_eligibility: true,
          proof_pack_skills: ['Product strategy', 'stakeholder interviews', 'onboarding design'],
          proof_contribution_mode: 'team',
          proof_ownership_level: 'owned_scope',
          proof_ownership_note: 'I owned the proof mapping and launch handoff.',
          claimed_outcome_count: 2,
          outcome_claim_status: 'proof_linked',
          outcome_verification_status: 'proof_linked',
          claimed_measured_outcomes: [
            expect.objectContaining({
              statement: 'Reduced onboarding support tickets',
              supportingSkills: ['Product strategy', 'stakeholder interviews', 'onboarding design'],
              claimStatus: 'proof_linked',
              verificationStatus: 'proof_linked',
            }),
            expect.objectContaining({
              statement: 'Shortened first proof review',
              supportingSkills: ['Product strategy', 'stakeholder interviews', 'onboarding design'],
              claimStatus: 'proof_linked',
              verificationStatus: 'proof_linked',
            }),
          ],
          first_proof_verification_intent: expect.objectContaining({
            action: 'draft',
            confirmers: [
              {
                name: 'Verifier One',
                relationship: 'client',
                email: 'verifier@example.com',
              },
              {
                name: 'Verifier Two',
                relationship: 'organization_representative',
                email: 'org@example.com',
              },
            ],
          }),
        }),
      })
    );
    expect(proofPackItemInsert).toHaveBeenCalledTimes(1);
    expect(proofPackItemInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        item_class: 'url_link',
        subtype_metadata: expect.objectContaining({
          artifactKind: 'link',
          proofArtifactType: 'project',
        }),
      })
    );
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

  it('logs individual onboarding proof-pack insert failures structurally', async () => {
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });
    const individualUpsert = vi.fn().mockResolvedValue({ error: null });
    const matchingProfileUpsert = vi.fn().mockResolvedValue({ error: null });
    const experienceInsert = vi.fn().mockResolvedValue({ error: null });
    const proofArtifactInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackInsert = vi.fn().mockResolvedValue({ error: { message: 'pack insert failed' } });

    (createClient as any).mockResolvedValue(
      createSupabaseFromMap({
        profiles: { update: profileUpdate },
        individual_profiles: { upsert: individualUpsert },
        matching_profiles: { upsert: matchingProfileUpsert },
        experiences: { insert: experienceInsert },
        proof_artifacts: { insert: proofArtifactInsert },
        proof_packs: { insert: proofPackInsert },
      })
    );

    const formData = new FormData();
    formData.set('firstName', 'Jane');
    formData.set('lastName', 'Founder');
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'jane_founder');
    formData.set('location', 'Stockholm');
    formData.set('contextType', 'experience');
    formData.set('contextKind', 'work');
    formData.set('contextTitle', 'First proof context');
    formData.set('contextOrganizationName', 'Proofound');
    formData.set('contextSummary', 'Starter proof context.');
    formData.set('contextDuration', '2026');
    formData.set('contextOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofUrl', 'https://example.com/proof');
    formData.set('proofTitle', 'Launch proof');
    formData.set('proofSummary', 'Shows one proof artifact.');
    formData.set('proofPackClaim', 'Launch proof');
    formData.set('proofPackOwnership', 'Created as solo work. I created the artifact.');
    formData.set('proofPackOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofPackSkills', 'Product strategy, proof systems, onboarding design');
    setFirstProofOwnershipFields(formData);

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual({
      error: 'Failed to structure your first proof record. Please try again.',
    });
    expect(log.error).toHaveBeenCalledWith(
      'onboarding.individual.proof_pack_insert_failed',
      expect.objectContaining({
        userId: 'user-1',
        contextType: 'experience',
        artifactId: expect.any(String),
        error: { message: 'pack insert failed' },
      })
    );
  });

  it('logs organization onboarding owner insert failures structurally', async () => {
    const orgInsert = vi.fn().mockResolvedValue({ error: null });
    const memberInsert = vi.fn().mockResolvedValue({ error: { message: 'owner insert failed' } });

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
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set('displayName', 'Acme Impact');
    formData.set('slug', 'acme-impact');
    formData.set('type', 'company');

    const result = await completeOrganizationOnboarding(formData);

    expect(result).toEqual({
      error:
        'Organization setup could not be saved. Your details are still here; please try again.',
    });
    expect(log.error).toHaveBeenCalledWith(
      'onboarding.organization.owner_insert_failed',
      expect.objectContaining({
        orgId: expect.any(String),
        userId: 'user-1',
        error: { message: 'owner insert failed' },
      })
    );
  });

  it('rejects first-proof submissions without 3 to 5 proof-supported skills', async () => {
    const formData = new FormData();
    formData.set('firstName', 'Jane');
    formData.set('lastName', 'Founder');
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'jane_founder');
    formData.set('location', 'Stockholm');
    formData.set('contextType', 'experience');
    formData.set('contextTitle', 'First proof context');
    formData.set('contextOrganizationName', 'Proofound');
    formData.set('contextSummary', 'Starter proof context.');
    formData.set('contextDuration', '2026');
    formData.set('contextOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofUrl', 'https://example.com/proof');
    formData.set('proofTitle', 'Launch proof');
    formData.set('proofSummary', 'Shows one proof artifact.');
    formData.set('proofPackClaim', 'Launch proof');
    formData.set('proofPackOwnership', 'Created as solo work. I created the artifact.');
    formData.set('proofPackOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofPackSkills', 'Documentation, onboarding design');
    setFirstProofOwnershipFields(formData);

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual({ error: 'Add 3 to 5 skills this proof actually supports.' });
    expect(createClient).not.toHaveBeenCalled();
  });

  it('rejects tampered first-proof submissions with synthetic context anchors', async () => {
    const formData = new FormData();
    formData.set('firstName', 'Jane');
    formData.set('lastName', 'Founder');
    formData.set('displayName', 'Jane Founder');
    formData.set('handle', 'jane_founder');
    formData.set('location', 'Stockholm');
    formData.set('contextType', 'experience');
    formData.set('proofUrl', 'https://example.com/proof');
    formData.set('proofTitle', 'Launch proof');
    formData.set('proofSummary', 'Shows one proof artifact.');
    formData.set('proofPackClaim', 'Launch proof');
    formData.set('proofPackOwnership', 'Created as solo work. I created the artifact.');
    formData.set('proofPackOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofPackSkills', 'Product strategy, proof systems, onboarding design');
    setFirstProofOwnershipFields(formData);

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual({
      error: 'Add one real context with a short anchor before saving your first proof record.',
    });
    expect(createClient).not.toHaveBeenCalled();
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
    formData.set('firstName', 'Jane');
    formData.set('lastName', 'Founder');
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
    formData.set('contextOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofUrl', 'https://example.com/projects/proof-pack');
    formData.set('proofTitle', 'Proof Pack Launch');
    formData.set('proofSummary', 'A live proof-backed launch artifact.');
    formData.set('proofPackClaim', 'Proof Pack Launch');
    formData.set(
      'proofPackOwnership',
      'I owned the contribution shown in this proof inside this context.'
    );
    formData.set('proofPackOutcome', 'Built a proof-first onboarding prototype.');
    formData.set('proofPackSkills', 'Product strategy, proof systems, onboarding design');
    setFirstProofOwnershipFields(formData);

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        handle: 'jane_founder',
      })
    );
    expect(educationInsert).toHaveBeenCalledTimes(1);
    expect(educationInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        institution: 'Proof Academy',
        degree: 'Proof systems cohort',
        skills: 'A focused learning program on proof systems.',
        projects: 'Built a proof-first onboarding prototype.',
      })
    );
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
    expect(proofPackInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Proof Pack Launch',
        summary: 'Proof Pack Launch',
        ownership_statement: 'I owned the contribution shown in this proof inside this context.',
        outcomes_summary: 'Built a proof-first onboarding prototype.',
        schema_version: 'proof_pack/v2',
      })
    );
    expect(proofPackItemInsert).toHaveBeenCalledTimes(1);
  });

  it('accepts the narrow first-proof file payload and attaches the uploaded artifact', async () => {
    const profileEq = vi.fn().mockResolvedValue({ error: null });
    const profileUpdate = vi.fn().mockReturnValue({ eq: profileEq });
    const individualUpsert = vi.fn().mockResolvedValue({ error: null });
    const matchingProfileUpsert = vi.fn().mockResolvedValue({ error: null });
    const experienceInsert = vi.fn().mockResolvedValue({ error: null });
    const proofArtifactInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackInsert = vi.fn().mockResolvedValue({ error: null });
    const proofPackItemInsert = vi.fn().mockResolvedValue({ error: null });

    (attachUploadedFile as any).mockResolvedValue({
      durable_path: 'individual_profile/user-1/proof/launch-proof.pdf',
      public_path: null,
      quarantine_path: null,
      detected_mime: 'application/pdf',
      declared_mime: 'application/pdf',
      sanitized_filename: 'launch-proof.pdf',
      upload_kind: 'proof',
    });

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
    formData.set('firstName', 'Jane');
    formData.set('lastName', 'Founder');
    formData.set('displayName', 'Jane Founder');
    formData.set('residence', 'Stockholm');
    formData.set('timezone', 'Europe/Stockholm');
    formData.set('location', 'Stockholm');
    formData.set('contextType', 'experience');
    formData.set('contextKind', 'work');
    formData.set('contextTitle', 'First proof: Launch proof');
    formData.set('contextOrganizationName', 'Stockholm');
    formData.set('contextSummary', 'A first proof onboarding artifact.');
    formData.set('contextDuration', '2026');
    formData.set('contextOutcome', 'Shows the first proof artifact.');
    formData.set('proofInputType', 'file');
    formData.set('proofArtifactType', 'document');
    formData.set('uploadedFileId', '00000000-0000-4000-8000-000000000001');
    formData.set('proofFileName', 'launch-proof.pdf');
    formData.set('proofTitle', 'Launch proof');
    formData.set('proofSummary', 'Shows the first proof artifact.');
    formData.set('proofPackClaim', 'Launch proof');
    formData.set(
      'proofPackOwnership',
      'I owned or contributed to the work represented by this proof artifact.'
    );
    formData.set('proofPackOutcome', 'Shows the first proof artifact.');
    formData.set('proofPackSkills', 'Proof writing, artifact review, onboarding design');
    setFirstProofOwnershipFields(formData);

    const result = await completeIndividualOnboarding(formData);

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        handle: 'jane-founder-user1',
      })
    );
    expect(profileUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        handle: 'jane-founder-user1',
        display_name: 'Jane Founder',
      })
    );
    expect(experienceInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'First proof: Launch proof',
        organization_name: 'Stockholm',
      })
    );
    expect(proofArtifactInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        artifact_kind: 'document',
        uploaded_file_id: '00000000-0000-4000-8000-000000000001',
        storage_path: 'individual_profile/user-1/proof/launch-proof.pdf',
        mime_type: 'application/pdf',
        source_url: null,
        visibility: 'owner_only',
        metadata: expect.objectContaining({
          proofInputType: 'file',
          proofArtifactType: 'document',
        }),
      })
    );
    expect(attachUploadedFile).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
      'user-1',
      'proof_pack',
      expect.any(String)
    );
    expect(proofPackItemInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        item_class: 'file_upload',
      })
    );
  });
});
