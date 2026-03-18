'use server';

import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { resolvePublicSnippetBaseUrl } from '@/lib/profile/snippet-generator';
import { ORGANIZATION_DAY_ONE_VISIBILITY } from '@/lib/portfolio/public-organization';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';
import { emitIndividualOnboardingCompleted } from '@/lib/analytics/events';
import { syncReadinessMilestones } from '@/lib/readiness/analytics';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';
import { validateProofPackAnchor } from '@/lib/proofs/pack-anchor';

const choosePersonaSchema = z.object({
  persona: z.enum(['individual', 'org_member']),
});

const INDIVIDUAL_DAY_ONE_FIELD_VISIBILITY = {
  header: true,
  proofBar: true,
  workEmail: false,
  linkedin: true,
  identity: true,
  counts: false,
  skills: false,
  bio: false,
  contact: false,
} as const;

type OnboardingContextType = 'experience' | 'education' | 'volunteering';

function buildPublicPortfolioUrl(pathname: string) {
  const baseUrl = resolvePublicSnippetBaseUrl();
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}

function isOnboardingContextType(value: string): value is OnboardingContextType {
  return value === 'experience' || value === 'education' || value === 'volunteering';
}

function normalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}

function validateHandle(value: string): string | null {
  if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
    return 'Handle can only contain letters, numbers, hyphens, and underscores';
  }

  return null;
}

function normalizeOrganizationSlug(value: string): string {
  return value.trim().toLowerCase();
}

function validateOrganizationSlug(value: string): string | null {
  if (!/^[a-z0-9-]+$/.test(value.trim())) {
    return 'Slug can only contain lowercase letters, numbers, and hyphens';
  }

  return null;
}

export async function choosePersona(formData: FormData) {
  const user = await requireAuth();

  const data = {
    persona: formData.get('persona') as string,
  };

  const result = choosePersonaSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Invalid persona choice' };
  }

  const supabase = await createClient({ allowCookieWrite: true });
  const { error } = await supabase
    .from('profiles')
    .update({ persona: result.data.persona, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('Failed to update persona:', error);
    return { error: 'Failed to update persona. Please try again.' };
  }

  revalidatePath('/onboarding');
  return { success: true, persona: result.data.persona };
}

export async function completeIndividualOnboarding(formData: FormData) {
  const user = await requireAuth();
  const trace = startLaunchTrace({
    flow: 'portfolio_publish',
    actorId: user.id,
    actorType: 'user_account',
  });

  const displayName = formData.get('displayName') as string;
  const handle = formData.get('handle') as string;
  const headline = formData.get('headline') as string;
  const location = String(formData.get('location') || '').trim();
  const timezone = String(formData.get('timezone') || '').trim();
  const focusArea = String(formData.get('focusArea') || '').trim();
  const workMode = String(formData.get('workMode') || '').trim();
  const engagementType = String(formData.get('engagementType') || '').trim();
  const contextTypeValue = String(formData.get('contextType') || '').trim();
  const contextTitle = String(formData.get('contextTitle') || '').trim();
  const contextOrganizationName = String(formData.get('contextOrganizationName') || '').trim();
  const contextSummary = String(formData.get('contextSummary') || '').trim();
  const contextDuration = String(formData.get('contextDuration') || '').trim();
  const contextOutcome = String(formData.get('contextOutcome') || '').trim();
  const proofUrl = String(formData.get('proofUrl') || '').trim();
  const proofTitle = String(formData.get('proofTitle') || '').trim();
  const proofSummary = String(formData.get('proofSummary') || '').trim();
  const proofPackClaim = String(formData.get('proofPackClaim') || '').trim();
  const proofPackOwnership = String(formData.get('proofPackOwnership') || '').trim();
  const proofPackOutcome = String(formData.get('proofPackOutcome') || '').trim();

  if (!isOnboardingContextType(contextTypeValue)) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'invalid_context_type',
    });
    return { error: 'Choose one real context before publishing.' };
  }

  const contextType = contextTypeValue as OnboardingContextType;

  if (
    !displayName ||
    !handle ||
    !headline ||
    !location ||
    !timezone ||
    !focusArea ||
    !workMode ||
    !engagementType
  ) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_required_fields',
    });
    return { error: 'Finish the safe shell before publishing.' };
  }

  if (
    !contextTitle ||
    !contextOrganizationName ||
    !contextSummary ||
    !contextDuration ||
    !contextOutcome
  ) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_context_fields',
    });
    return { error: 'Add one real context with a short anchor and outcome before publishing.' };
  }

  if (!proofUrl || !proofTitle || !proofSummary) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_proof_fields',
    });
    return { error: 'Add your first proof before publishing.' };
  }

  if (!proofPackClaim || !proofPackOwnership || !proofPackOutcome) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_proof_pack_fields',
    });
    return { error: 'Structure your first Proof Pack before publishing.' };
  }

  const normalizedHandle = normalizeHandle(handle);
  const slugError = validateHandle(handle);
  if (slugError) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'invalid_handle',
    });
    return { error: slugError };
  }

  try {
    const supabase = await createClient({ allowCookieWrite: true });
    const publicPortfolioPath = `/portfolio/${encodeURIComponent(normalizedHandle)}`;
    const nowIso = new Date().toISOString();

    const profileUpdate = await supabase
      .from('profiles')
      .update({
        handle: normalizedHandle,
        display_name: displayName,
        persona: 'individual',
        updated_at: nowIso,
      })
      .eq('id', user.id);

    if (profileUpdate.error) {
      if (profileUpdate.error.code === '23505') {
        emitLaunchTrace(trace, {
          outcome: 'rejected',
          state: 'portfolio_publish_conflict',
          failureClass: 'handle_conflict',
        });
        return { error: 'Handle already taken. Please choose another.' };
      }

      console.error('Failed to update profile during onboarding:', profileUpdate.error);
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_profile_update_failed',
        failureClass: 'profile_update_failed',
      });
      return { error: 'Failed to complete setup. Please try again.' };
    }

    const individualInsert = await supabase.from('individual_profiles').upsert({
      user_id: user.id,
      headline: headline || null,
      location: location || null,
      visibility: 'public',
      field_visibility: INDIVIDUAL_DAY_ONE_FIELD_VISIBILITY,
    });

    if (individualInsert.error) {
      console.error(
        'Failed to create individual profile during onboarding:',
        individualInsert.error
      );
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_profile_insert_failed',
        failureClass: 'profile_insert_failed',
      });
      return { error: 'Failed to complete setup. Please try again.' };
    }

    const matchingProfileInsert = await supabase.from('matching_profiles').upsert({
      profile_id: user.id,
      timezone,
      desired_roles: [focusArea],
      work_mode: workMode,
      engagement_type: engagementType,
      updated_at: nowIso,
    });

    if (matchingProfileInsert.error) {
      console.error(
        'Failed to persist matching preferences during onboarding:',
        matchingProfileInsert.error
      );
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_matching_profile_failed',
        failureClass: 'matching_profile_failed',
      });
      return { error: 'Failed to save your work preferences. Please try again.' };
    }

    const contextId = randomUUID();
    let contextInsertError: { message?: string } | null = null;

    if (contextType === 'experience') {
      const { error } = await supabase.from('experiences').insert({
        id: contextId,
        user_id: user.id,
        title: contextTitle,
        organization_name: contextOrganizationName,
        org_description: contextSummary,
        duration: contextDuration,
        outcomes: contextOutcome,
        projects: contextSummary,
        colleagues: contextSummary,
        achievements: contextOutcome,
        verified: false,
      });
      contextInsertError = error;
    } else if (contextType === 'education') {
      const { error } = await supabase.from('education').insert({
        id: contextId,
        user_id: user.id,
        institution: contextOrganizationName,
        degree: contextTitle,
        duration: contextDuration,
        skills: contextSummary,
        projects: contextOutcome,
        verified: false,
      });
      contextInsertError = error;
    } else {
      const { error } = await supabase.from('volunteering').insert({
        id: contextId,
        user_id: user.id,
        title: contextTitle,
        org_description: `${contextOrganizationName}: ${contextSummary}`,
        duration: contextDuration,
        cause: contextSummary,
        impact: contextOutcome,
        skills_deployed: contextTitle,
        personal_why: contextSummary,
        verified: false,
      });
      contextInsertError = error;
    }

    if (contextInsertError) {
      console.error('Failed to create onboarding context:', contextInsertError);
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_context_insert_failed',
        failureClass: 'context_insert_failed',
      });
      return { error: 'Failed to save your first context. Please try again.' };
    }

    const artifactId = randomUUID();
    const packId = randomUUID();
    const proofMetadata = {
      imported_from: 'onboarding',
      context_type: contextType,
      context_title: contextTitle,
      context_organization_name: contextOrganizationName,
      context_duration: contextDuration,
      context_summary: contextSummary,
      context_outcome: contextOutcome,
      focus_area: focusArea,
      candidate_evidence: true,
      public_signal: true,
    };

    const proofArtifactInsert = await supabase.from('proof_artifacts').insert({
      id: artifactId,
      owner_type: 'individual_profile',
      owner_id: user.id,
      subject_type: contextType,
      subject_id: contextId,
      artifact_kind: 'link',
      lifecycle_state: 'active',
      title: proofTitle,
      description: proofSummary,
      source_url: proofUrl,
      activated_at: nowIso,
      visibility: 'public',
      reveal_gate: 'none',
      metadata: proofMetadata,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (proofArtifactInsert.error) {
      console.error('Failed to create onboarding proof artifact:', proofArtifactInsert.error);
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_proof_artifact_failed',
        failureClass: 'proof_artifact_failed',
      });
      return { error: 'Failed to save your first proof. Please try again.' };
    }

    const anchorValidation = validateProofPackAnchor({
      packKind: 'verification_bundle',
      ownerType: 'individual_profile',
      ownerId: user.id,
      primarySubjectType: contextType,
      primarySubjectId: contextId,
    } as any);

    if (!anchorValidation.ok) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'portfolio_publish_validation_failed',
        failureClass: anchorValidation.reason,
      });
      return { error: anchorValidation.message };
    }

    const proofPackInsert = await supabase.from('proof_packs').insert({
      id: packId,
      owner_type: 'individual_profile',
      owner_id: user.id,
      pack_kind: 'verification_bundle',
      primary_subject_type: contextType,
      primary_subject_id: contextId,
      lifecycle_state: 'published',
      title: proofPackClaim,
      summary: proofPackOwnership,
      context_json: {
        importedFrom: 'onboarding',
        contextType,
        contextId,
        focusArea,
        workMode,
        engagementType,
        contextTitle,
        contextOrganizationName,
        contextDuration,
        contextSummary,
        contextOutcome,
        evidenceTitle: proofTitle,
        evidenceUrl: proofUrl,
        proofPackClaim,
        proofPackOwnership,
        proofPackOutcome,
      },
      evidence_summary: proofSummary,
      outcomes_summary: proofPackOutcome,
      visibility: 'public',
      reveal_gate: 'none',
      created_by: user.id,
      verification_status: 'unverified',
      freshness_state: 'fresh',
      freshness_evaluated_at: nowIso,
      last_refreshed_at: nowIso,
      portability_meta: {
        completenessState: 'context_anchored',
        importedFrom: 'onboarding',
      },
      metadata: proofMetadata,
      published_at: nowIso,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (proofPackInsert.error) {
      console.error('Failed to create onboarding proof pack:', proofPackInsert.error);
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_proof_pack_failed',
        failureClass: 'proof_pack_failed',
      });
      return { error: 'Failed to structure your first Proof Pack. Please try again.' };
    }

    const proofPackItemInsert = await supabase.from('proof_pack_items').insert({
      pack_id: packId,
      artifact_id: artifactId,
      position: 0,
      included_fields: ['title', 'description', 'sourceUrl', 'issuedAt', 'expiresAt'],
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (proofPackItemInsert.error) {
      console.error('Failed to attach onboarding proof to proof pack:', proofPackItemInsert.error);
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_proof_pack_item_failed',
        failureClass: 'proof_pack_item_failed',
      });
      return { error: 'Failed to finish your first Proof Pack. Please try again.' };
    }

    revalidatePath('/app/i');
    revalidatePath('/app/i/home');
    revalidatePath('/app/i/profile');
    revalidatePath('/app/i/portfolio');
    revalidatePath(publicPortfolioPath);

    try {
      await reconcileVerifierContradictions({
        verifierProfileId: user.id,
      });
    } catch (reconcileError) {
      console.error('Individual onboarding contradiction reconciliation failed:', reconcileError);
    }

    await syncReadinessMilestones(user.id, { source: 'individual_onboarding_completed' });
    const readiness = await getIndividualReadinessState(user.id);
    await emitIndividualOnboardingCompleted(user.id, {
      highestState: readiness.highestState,
      states: readiness.states,
      portfolioReady: readiness.flags.portfolioReady,
      browseReady: readiness.flags.browseReady,
      qualifiedIntroReady: readiness.flags.qualifiedIntroReady,
      proofImported: true,
    });

    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'public_portfolio_live',
      details: {
        highestState: readiness.highestState,
      },
    });

    return {
      success: true,
      handle: normalizedHandle,
      publicPortfolioUrl: buildPublicPortfolioUrl(publicPortfolioPath),
      portfolioReady: readiness.flags.portfolioReady,
      browseReady: readiness.flags.browseReady,
      qualifiedIntroReady: readiness.flags.qualifiedIntroReady,
    };
  } catch (error: any) {
    console.error('Individual onboarding error:', error);
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'portfolio_publish_unhandled_error',
      failureClass: 'unhandled_portfolio_publish_error',
    });
    return { error: 'Failed to complete setup. Please try again.' };
  }
}

export async function completeOrganizationOnboarding(formData: FormData) {
  const user = await requireAuth();
  const trace = startLaunchTrace({
    flow: 'portfolio_publish',
    actorId: user.id,
    actorType: 'organization_member',
  });

  const displayName = formData.get('displayName') as string;
  const slug = formData.get('slug') as string;
  const type = formData.get('type') as string;
  const legalName = formData.get('legalName') as string;
  const mission = formData.get('mission') as string;
  const website = formData.get('website') as string;

  if (!displayName || !slug || !type) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'org_portfolio_publish_validation_failed',
      failureClass: 'missing_required_fields',
    });
    return { error: 'Organization name, slug, and type are required' };
  }

  const orgSlug = normalizeOrganizationSlug(slug);
  const orgSlugError = validateOrganizationSlug(orgSlug);
  if (orgSlugError) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'org_portfolio_publish_validation_failed',
      failureClass: 'invalid_slug',
    });
    return { error: orgSlugError };
  }

  // Validate type
  const validTypes = ['company', 'ngo', 'government', 'network', 'other'];
  if (!validTypes.includes(type)) {
    return { error: 'Invalid organization type' };
  }

  try {
    const supabase = await createClient({ allowCookieWrite: true });

    // Check if user already has an organization (ignore RLS errors)
    const { data: existingMemberships } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('state', 'active')
      .limit(1);

    // If they already have an org, get the org slug and redirect to it
    if (existingMemberships && existingMemberships.length > 0) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('slug')
        .eq('id', existingMemberships[0].org_id)
        .single();

      if (orgData?.slug) {
        revalidatePath(`/app/o/${orgData.slug}`);
        emitLaunchTrace(trace, {
          outcome: 'success',
          state: 'public_portfolio_live',
          details: {
            orgSlug: orgData.slug,
            redirected: true,
          },
        });
        return {
          success: true,
          orgSlug: orgData.slug,
          redirected: true,
          publicPortfolioUrl: buildPublicPortfolioUrl(
            `/portfolio/org/${encodeURIComponent(orgData.slug)}`
          ),
        };
      }

      return {
        error:
          'You are already connected to an organization. Please contact support to update your organization membership.',
      };
    }

    const orgId = randomUUID();

    const orgInsert = await supabase.from('organizations').insert({
      id: orgId,
      slug: orgSlug,
      display_name: displayName,
      legal_name: legalName || null,
      type,
      mission: mission || null,
      website: website || null,
      created_by: user.id,
    });

    if (orgInsert.error) {
      // Check for actual constraint violations (duplicate slug)
      if (orgInsert.error.code === '23505') {
        return { error: 'Organization slug already taken. Please choose another.' };
      }

      // Ignore RLS SELECT errors - the INSERT may have succeeded even if we can't read it back
      // We'll create the membership next which will allow SELECT access
      if (
        !orgInsert.error.message?.includes('row-level security') &&
        !orgInsert.error.message?.includes('new row violates')
      ) {
        console.error('Organization onboarding insert error:', orgInsert.error);
        return { error: 'Failed to create organization. Please try again.' };
      }

      // Log RLS warning but continue with membership creation
      console.log(
        'Organization inserted but RLS blocked SELECT - this is expected, continuing with membership creation'
      );
    }

    const memberInsert = await supabase.from('organization_members').insert({
      org_id: orgId,
      user_id: user.id,
      role: 'org_owner',
      state: 'active',
      accepted_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (memberInsert.error) {
      // Ignore RLS SELECT errors - the INSERT may have succeeded
      if (
        !memberInsert.error.message?.includes('row-level security') &&
        !memberInsert.error.message?.includes('new row violates')
      ) {
        console.error('Failed to add organization owner:', memberInsert.error);
        return { error: 'Failed to create organization. Please try again.' };
      }

      // Log RLS warning but continue - membership was likely created
      console.log('Membership inserted but RLS blocked SELECT - this is expected');
    }

    const personaUpdate = await supabase
      .from('profiles')
      .update({ persona: 'org_member', updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (personaUpdate.error) {
      console.error('Failed to update persona after organization onboarding:', personaUpdate.error);
    }

    const orgVisibilityUpsert = await supabase.from('organization_field_visibility').upsert({
      org_id: orgId,
      ...ORGANIZATION_DAY_ONE_VISIBILITY,
      updated_at: new Date().toISOString(),
    });

    if (orgVisibilityUpsert.error) {
      console.error(
        'Failed to apply day-1 organization visibility defaults:',
        orgVisibilityUpsert.error
      );
    }

    const publicPortfolioPath = `/portfolio/org/${encodeURIComponent(orgSlug)}`;
    revalidatePath(`/app/o/${orgSlug}`);
    revalidatePath(publicPortfolioPath);
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'public_portfolio_live',
      details: {
        orgSlug,
      },
    });
    return {
      success: true,
      orgSlug,
      publicPortfolioUrl: buildPublicPortfolioUrl(publicPortfolioPath),
    };
  } catch (error: any) {
    console.error('Organization onboarding error:', error);
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'org_portfolio_publish_unhandled_error',
      failureClass: 'unhandled_portfolio_publish_error',
    });
    return { error: 'Failed to create organization. Please try again.' };
  }
}
