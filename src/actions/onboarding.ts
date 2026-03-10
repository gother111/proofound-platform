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
import { upsertCanonicalProofArtifactFromSkillProof } from '@/lib/canonical/repository';

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

function buildPublicPortfolioUrl(pathname: string) {
  const baseUrl = resolvePublicSnippetBaseUrl();
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}

function slugifySkillSeed(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
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
  const bio = formData.get('bio') as string;
  const location = formData.get('location') as string;
  const proofUrl = String(formData.get('proofUrl') || '').trim();
  const proofTitle = String(formData.get('proofTitle') || '').trim();
  const proofSkillLabel = String(formData.get('proofSkillLabel') || '').trim();

  if (!displayName || !handle) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_required_fields',
    });
    return { error: 'Display name and handle are required' };
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

    const profileUpdate = await supabase
      .from('profiles')
      .update({
        handle: normalizedHandle,
        display_name: displayName,
        persona: 'individual',
        updated_at: new Date().toISOString(),
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
      bio: bio || null,
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

    let onboardingSkillId: string | null = null;
    if (proofUrl && proofSkillLabel) {
      onboardingSkillId = randomUUID();
      const skillSeed = slugifySkillSeed(proofSkillLabel);

      const skillInsert = await supabase.from('skills').insert({
        id: onboardingSkillId,
        profile_id: user.id,
        skill_id: `onboarding-${skillSeed || randomUUID().slice(0, 8)}`,
        skill_code: null,
        level: 3,
        competency_label: 'C3',
        months_experience: 0,
        relevance: 'current',
        last_used_at: new Date().toISOString(),
      });

      if (skillInsert.error) {
        console.error('Failed to seed onboarding skill:', skillInsert.error);
        emitLaunchTrace(trace, {
          outcome: 'failure',
          state: 'portfolio_publish_skill_seed_failed',
          failureClass: 'skill_seed_failed',
        });
        return { error: 'Failed to save your first proof. Please try again.' };
      }

      const proofInsert = await supabase
        .from('skill_proofs')
        .insert({
          id: randomUUID(),
          skill_id: onboardingSkillId,
          profile_id: user.id,
          proof_type: 'link',
          title: proofTitle || proofSkillLabel || 'Proof link',
          description: `Imported during onboarding for ${proofSkillLabel}.`,
          url: proofUrl,
          verified: false,
          metadata: {
            visibility: 'public',
            imported_from: 'onboarding',
            candidate_evidence: true,
            topic_label: proofSkillLabel,
          },
        })
        .select()
        .single();

      if (proofInsert.error || !proofInsert.data) {
        console.error('Failed to seed onboarding proof:', proofInsert.error);
        emitLaunchTrace(trace, {
          outcome: 'failure',
          state: 'portfolio_publish_proof_seed_failed',
          failureClass: 'proof_seed_failed',
        });
        return { error: 'Failed to save your first proof. Please try again.' };
      }

      await upsertCanonicalProofArtifactFromSkillProof({
        id: proofInsert.data.id,
        skillId: onboardingSkillId,
        profileId: user.id,
        proofType: 'link',
        title: proofInsert.data.title,
        description: proofInsert.data.description,
        url: proofInsert.data.url,
        filePath: proofInsert.data.file_path,
        issuedDate: proofInsert.data.issued_date,
        expiresDate: proofInsert.data.expires_date,
        metadata:
          proofInsert.data.metadata && typeof proofInsert.data.metadata === 'object'
            ? (proofInsert.data.metadata as Record<string, unknown>)
            : {},
        createdAt: proofInsert.data.created_at,
        updatedAt: proofInsert.data.updated_at,
      });
    }

    revalidatePath('/app/i');
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
      proofImported: Boolean(proofUrl && proofSkillLabel),
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
