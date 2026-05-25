'use server';

import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { resolvePublicSiteBaseUrl } from '@/lib/profile/snippet-generator';
import { ORGANIZATION_DAY_ONE_VISIBILITY } from '@/lib/portfolio/public-organization';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';
import { emitIndividualOnboardingCompleted } from '@/lib/analytics/events';
import { syncReadinessMilestones } from '@/lib/readiness/analytics';
import { getIndividualReadinessState } from '@/lib/readiness/individual-state';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';
import { log } from '@/lib/log';
import { validateProofPackAnchor } from '@/lib/proofs/pack-anchor';
import { attachUploadedFile } from '@/lib/uploads/lifecycle';
import { resolveArtifactDisplayName } from '@/lib/uploads/privacy';

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
type OnboardingArtifactInputMode = 'link' | 'file';
type OnboardingContributionMode = 'solo' | 'team';
type FirstProofVerificationAction = 'none' | 'draft' | 'send_now';
type FirstProofVerificationConfirmerRelationship =
  | 'client'
  | 'peer'
  | 'manager'
  | 'teacher'
  | 'collaborator'
  | 'organization_representative';

type FirstProofVerificationConfirmer = {
  name: string;
  relationship: FirstProofVerificationConfirmerRelationship;
  email: string;
};
type ClaimedMeasuredOutcome = {
  id: string;
  statement: string;
  value: string | null;
  timeframe: string | null;
  evidenceRelation: 'artifact_or_context';
  supportingSkills: string[];
  proofPackId: string | null;
  proofPackTitle: string | null;
  claimStatus: 'claimed' | 'proof_linked';
  verificationStatus: 'unverified' | 'proof_linked';
  supportingProofLinked: boolean;
  source: 'individual_onboarding';
};

const ONBOARDING_ARTIFACT_TYPES = new Set([
  'project',
  'document',
  'credential',
  'media',
  'reference',
  'other',
]);
type OnboardingContextKind = 'work' | 'volunteering' | 'education_learning' | 'other_safe';

const ONBOARDING_COMPANY_SIZE_VALUES = new Set([
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5001+',
]);

const ONBOARDING_CONTRIBUTION_MODES = new Set(['solo', 'team']);
const ONBOARDING_OWNERSHIP_LEVELS = new Set([
  'created_all',
  'led_delivery',
  'owned_scope',
  'contributed_scope',
]);

const FIRST_PROOF_VERIFICATION_ACTIONS = new Set<FirstProofVerificationAction>([
  'none',
  'draft',
  'send_now',
]);

const FIRST_PROOF_VERIFICATION_RELATIONSHIPS = new Set<FirstProofVerificationConfirmerRelationship>(
  ['client', 'peer', 'manager', 'teacher', 'collaborator', 'organization_representative']
);

function buildPublicPortfolioUrl(pathname: string) {
  const baseUrl = resolvePublicSiteBaseUrl();
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${baseUrl}${normalizedPath}`;
}

function isOnboardingContextType(value: string): value is OnboardingContextType {
  return value === 'experience' || value === 'education' || value === 'volunteering';
}

function isOnboardingContextKind(value: string): value is OnboardingContextKind {
  return (
    value === 'work' ||
    value === 'volunteering' ||
    value === 'education_learning' ||
    value === 'other_safe'
  );
}

function normalizeHandle(value: string): string {
  return value.trim().toLowerCase();
}

function slugifyHandleSeed(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'proof-builder';
}

function generateOnboardingHandle(displayName: string, userId: string): string {
  return `${slugifyHandleSeed(displayName)}-${userId.replace(/-/g, '').slice(0, 8)}`;
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

function resolveOnboardingProofItemSubtype(proofUrl: string) {
  if (/github\.com\/.+\/pull\//i.test(proofUrl)) {
    return 'pr';
  }
  if (/github\.com\/.+\/commit\//i.test(proofUrl)) {
    return 'commit';
  }
  if (/github\.com\//i.test(proofUrl)) {
    return 'repo';
  }
  return null;
}

function normalizeArtifactInputMode(value: string): OnboardingArtifactInputMode {
  return value === 'file' ? 'file' : 'link';
}

function normalizeOnboardingArtifactType(value: string) {
  return ONBOARDING_ARTIFACT_TYPES.has(value) ? value : 'project';
}

function resolveProofArtifactKind(inputMode: OnboardingArtifactInputMode, artifactType: string) {
  if (inputMode === 'link') return 'link';
  if (artifactType === 'credential') return 'credential';
  if (artifactType === 'media') return 'image';
  if (artifactType === 'reference') return 'reference';
  return 'document';
}

function normalizeFirstProofVerificationAction(value: string): FirstProofVerificationAction {
  return FIRST_PROOF_VERIFICATION_ACTIONS.has(value as FirstProofVerificationAction)
    ? (value as FirstProofVerificationAction)
    : 'none';
}

function parseFirstProofVerificationConfirmers(value: FormDataEntryValue | null) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return [] as FirstProofVerificationConfirmer[];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const name = typeof record.name === 'string' ? record.name.trim() : '';
        const email = typeof record.email === 'string' ? record.email.trim().toLowerCase() : '';
        const relationship =
          typeof record.relationship === 'string' &&
          FIRST_PROOF_VERIFICATION_RELATIONSHIPS.has(
            record.relationship as FirstProofVerificationConfirmerRelationship
          )
            ? (record.relationship as FirstProofVerificationConfirmerRelationship)
            : null;

        if (!name || !email || !relationship) {
          return null;
        }

        return {
          name: name.slice(0, 120),
          relationship,
          email: email.slice(0, 254),
        };
      })
      .filter((item): item is FirstProofVerificationConfirmer => Boolean(item))
      .slice(0, 2);
  } catch {
    return [];
  }
}

function parseClaimedMeasuredOutcomes(value: FormDataEntryValue | null): ClaimedMeasuredOutcome[] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map<ClaimedMeasuredOutcome | null>((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const row = entry as Record<string, unknown>;
      const statement =
        typeof row.statement === 'string'
          ? row.statement.trim()
          : typeof row.label === 'string'
            ? row.label.trim()
            : '';
      if (!statement) {
        return null;
      }

      const rawValue =
        typeof row.value === 'string'
          ? row.value.trim()
          : row.value === null || row.value === undefined
            ? ''
            : String(row.value).trim();
      const timeframe = typeof row.timeframe === 'string' ? row.timeframe.trim() : '';
      const id =
        typeof row.id === 'string' && row.id.trim() ? row.id.trim() : `outcome-${index + 1}`;

      return {
        id,
        statement,
        value: rawValue || null,
        timeframe: timeframe || null,
        evidenceRelation: 'artifact_or_context' as const,
        supportingSkills: [] as string[],
        proofPackId: null,
        proofPackTitle: null,
        claimStatus: 'claimed' as const,
        verificationStatus: 'unverified' as const,
        supportingProofLinked: false as const,
        source: 'individual_onboarding' as const,
      };
    })
    .filter((entry): entry is ClaimedMeasuredOutcome => entry !== null)
    .slice(0, 3);
}

function buildClaimedOutcomeSummary(outcomes: ClaimedMeasuredOutcome[], fallback: string) {
  if (outcomes.length === 0) {
    return fallback;
  }

  return outcomes
    .map((outcome) =>
      [outcome.statement, outcome.value, outcome.timeframe].filter(Boolean).join(' · ')
    )
    .join('; ');
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
    log.error('onboarding.persona.update_failed', {
      userId: user.id,
      error,
    });
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

  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const cityOrResidence = String(
    formData.get('cityOrResidence') || formData.get('residence') || ''
  ).trim();
  const displayName = String(formData.get('displayName') || `${firstName} ${lastName}`).trim();
  const handle = String(
    formData.get('handle') || generateOnboardingHandle(displayName, user.id)
  ).trim();
  const headline = String(
    formData.get('headline') || `First proof artifact from ${displayName}`
  ).trim();
  const location = String(formData.get('location') || cityOrResidence).trim();
  const timezone = String(formData.get('timezone') || 'Europe/Stockholm').trim();
  const focusArea = String(formData.get('focusArea') || 'First proof artifact').trim();
  const workMode = String(formData.get('workMode') || 'remote').trim();
  const engagementType = String(formData.get('engagementType') || 'project_based').trim();
  const contextKindValue = String(formData.get('contextKind') || '').trim();
  const contextTypeValue = String(formData.get('contextType') || 'experience').trim();
  const contextCompanySize = String(formData.get('contextCompanySize') || '').trim();
  const contextIndustryDomain = String(formData.get('contextIndustryDomain') || '').trim();
  const contextFocusArea = String(formData.get('contextFocusArea') || '').trim();
  const contextScope = String(formData.get('contextScope') || '').trim();
  const contextOperatingEnvironment = String(
    formData.get('contextOperatingEnvironment') || ''
  ).trim();
  const secondaryContextNote = String(formData.get('secondaryContextNote') || '').trim();
  const proofInputType = normalizeArtifactInputMode(
    String(formData.get('proofInputType') || formData.get('artifactInputMode') || 'link')
  );
  const proofArtifactType = normalizeOnboardingArtifactType(
    String(formData.get('proofArtifactType') || formData.get('artifactType') || '')
  );
  const uploadedFileId = String(
    formData.get('uploadedFileId') || formData.get('proofUploadedFileId') || ''
  ).trim();
  const proofFileName = String(formData.get('proofFileName') || '').trim();
  const proofUrl = String(formData.get('proofUrl') || '').trim();
  const proofTitle = String(formData.get('proofTitle') || '').trim();
  const proofSummary = String(formData.get('proofSummary') || '').trim();
  const contextTitle = String(formData.get('contextTitle') || '').trim();
  const contextOrganizationName = String(formData.get('contextOrganizationName') || '').trim();
  const contextSummary = String(formData.get('contextSummary') || '').trim();
  const contextDuration = String(formData.get('contextDuration') || '').trim();
  const contextOutcome = String(formData.get('contextOutcome') || '').trim();
  const proofPackClaim = String(formData.get('proofPackClaim') || '').trim();
  const proofPackOwnership = String(formData.get('proofPackOwnership') || '').trim();
  const proofPackOutcome = String(formData.get('proofPackOutcome') || '').trim();
  const proofContributionModeValue = String(formData.get('proofContributionMode') || '').trim();
  const proofContributionMode = ONBOARDING_CONTRIBUTION_MODES.has(proofContributionModeValue)
    ? (proofContributionModeValue as OnboardingContributionMode)
    : null;
  const proofOwnershipLevel = String(formData.get('proofOwnershipLevel') || '').trim();
  const proofOwnershipNote = String(formData.get('proofOwnershipNote') || '').trim();
  const claimedMeasuredOutcomes = parseClaimedMeasuredOutcomes(
    formData.get('proofPackMeasuredOutcomes')
  );
  const effectiveProofPackOutcome = buildClaimedOutcomeSummary(
    claimedMeasuredOutcomes,
    proofPackOutcome
  );
  const proofPackSkills = String(formData.get('proofPackSkills') || '')
    .split(/[\n,]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
  const scaffoldSkills = proofPackSkills;
  const firstProofVerificationAction = normalizeFirstProofVerificationAction(
    String(formData.get('firstProofVerificationAction') || 'none')
  );
  const firstProofVerificationPreview = String(formData.get('firstProofVerificationPreview') || '')
    .trim()
    .slice(0, 4000);
  const firstProofVerificationConfirmers = parseFirstProofVerificationConfirmers(
    formData.get('firstProofVerificationConfirmers')
  );
  const firstProofVerificationIntent =
    firstProofVerificationAction === 'none'
      ? null
      : {
          action: firstProofVerificationAction,
          preview: firstProofVerificationPreview || null,
          confirmers: firstProofVerificationConfirmers,
          savedAt: new Date().toISOString(),
          semantics:
            'Scoped verification request draft only; email transport does not equal verification.',
        };

  if (!isOnboardingContextType(contextTypeValue)) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'invalid_context_type',
    });
    return { error: 'Choose one real context before publishing.' };
  }

  const contextType = contextTypeValue as OnboardingContextType;
  const contextKind = isOnboardingContextKind(contextKindValue)
    ? contextKindValue
    : contextType === 'education'
      ? 'education_learning'
      : contextType === 'volunteering'
        ? 'volunteering'
        : 'work';
  const normalizedCompanySize = ONBOARDING_COMPANY_SIZE_VALUES.has(contextCompanySize)
    ? contextCompanySize
    : null;

  if (!displayName || !handle || !location) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_required_fields',
    });
    return { error: 'Finish the basic identity shell before saving your first Proof Pack.' };
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
    return {
      error: 'Add one real context with a short anchor before saving your first Proof Pack.',
    };
  }

  const isFileProof = proofInputType === 'file';
  if (!proofTitle || !proofSummary || (isFileProof ? !uploadedFileId : !proofUrl)) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_proof_fields',
    });
    return { error: 'Add your first proof before saving your first Proof Pack.' };
  }

  if (!proofPackClaim || !proofPackOwnership || !effectiveProofPackOutcome) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_proof_pack_fields',
    });
    return { error: 'Structure your first Proof Pack before saving it.' };
  }

  if (
    !proofContributionMode ||
    !ONBOARDING_OWNERSHIP_LEVELS.has(proofOwnershipLevel) ||
    !proofOwnershipNote
  ) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'missing_proof_ownership_fields',
    });
    return {
      error: 'Choose whether the proof was solo or team work and describe what you owned.',
    };
  }

  if (proofPackSkills.length < 3 || proofPackSkills.length > 5) {
    emitLaunchTrace(trace, {
      outcome: 'rejected',
      state: 'portfolio_publish_validation_failed',
      failureClass: 'invalid_proof_pack_skills_count',
    });
    return { error: 'Add 3 to 5 skills this proof actually supports.' };
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

      log.error('onboarding.individual.profile_update_failed', {
        userId: user.id,
        error: profileUpdate.error,
      });
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_profile_update_failed',
        failureClass: 'profile_update_failed',
      });
      return { error: 'Failed to complete setup. Please try again.' };
    }

    const individualInsert = await supabase.from('individual_profiles').upsert({
      user_id: user.id,
      headline: headline || `First proof: ${proofTitle}`,
      location: location || cityOrResidence || null,
      visibility: 'network',
      field_visibility: INDIVIDUAL_DAY_ONE_FIELD_VISIBILITY,
    });

    if (individualInsert.error) {
      log.error('onboarding.individual.profile_insert_failed', {
        userId: user.id,
        error: individualInsert.error,
      });
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_profile_insert_failed',
        failureClass: 'profile_insert_failed',
      });
      return { error: 'Failed to complete setup. Please try again.' };
    }

    const matchingProfileInsert = await supabase.from('matching_profiles').upsert({
      profile_id: user.id,
      timezone: timezone || null,
      desired_roles: [focusArea || contextFocusArea || contextTitle].filter(Boolean),
      work_mode: workMode || null,
      engagement_type: engagementType || null,
      updated_at: nowIso,
    });

    if (matchingProfileInsert.error) {
      log.error('onboarding.individual.matching_profile_failed', {
        userId: user.id,
        error: matchingProfileInsert.error,
      });
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
        organization_industry: contextIndustryDomain || contextFocusArea || null,
        organization_industry_legacy_text: contextIndustryDomain || contextFocusArea || null,
        organization_employee_amount: normalizedCompanySize,
        org_description: contextSummary,
        duration: contextDuration,
        outcomes: contextOutcome,
        projects: contextSummary,
        colleagues: contextOperatingEnvironment || contextScope || contextSummary,
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
        skills:
          [contextFocusArea || contextIndustryDomain, contextOperatingEnvironment]
            .filter(Boolean)
            .join(' · ') || contextSummary,
        projects: [contextOutcome, contextScope].filter(Boolean).join(' · ') || contextOutcome,
        verified: false,
      });
      contextInsertError = error;
    } else {
      const { error } = await supabase.from('volunteering').insert({
        id: contextId,
        user_id: user.id,
        title: contextTitle,
        org_description: [contextOrganizationName, contextSummary, contextOperatingEnvironment]
          .filter(Boolean)
          .join(': '),
        duration: contextDuration,
        cause: contextFocusArea || contextIndustryDomain || contextSummary,
        impact: contextOutcome,
        skills_deployed: contextTitle,
        personal_why: secondaryContextNote || contextSummary,
        verified: false,
      });
      contextInsertError = error;
    }

    if (contextInsertError) {
      log.error('onboarding.individual.context_insert_failed', {
        userId: user.id,
        contextType,
        error: contextInsertError,
      });
      emitLaunchTrace(trace, {
        outcome: 'failure',
        state: 'portfolio_publish_context_insert_failed',
        failureClass: 'context_insert_failed',
      });
      return { error: 'Failed to save your first context. Please try again.' };
    }

    const artifactId = randomUUID();
    const packId = randomUUID();
    const proofItemSubtype = resolveOnboardingProofItemSubtype(proofUrl);
    const attachedUpload = uploadedFileId
      ? await attachUploadedFile(uploadedFileId, user.id, 'proof_pack', packId)
      : null;

    if (uploadedFileId && !attachedUpload) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'portfolio_publish_validation_failed',
        failureClass: 'uploaded_file_not_attachable',
      });
      return { error: 'Uploaded file is awaiting privacy review or failed checks.' };
    }

    const uploadedFileStoragePath =
      attachedUpload?.quarantine_path ||
      attachedUpload?.durable_path ||
      attachedUpload?.public_path ||
      null;
    const uploadedFileDisplayName = attachedUpload
      ? resolveArtifactDisplayName({
          sanitizedFilename: attachedUpload.sanitized_filename ?? null,
          originalFilename: attachedUpload.original_filename ?? null,
          detectedMime: attachedUpload.detected_mime ?? null,
          uploadKind: attachedUpload.upload_kind ?? null,
        })
      : null;
    const claimedMeasuredOutcomesWithLinks = claimedMeasuredOutcomes.map((outcome) => ({
      ...outcome,
      supportingSkills: scaffoldSkills.slice(0, 3),
      proofPackId: packId,
      proofPackTitle: proofTitle,
      claimStatus: 'proof_linked' as const,
      verificationStatus: 'proof_linked' as const,
      supportingProofLinked: true,
    }));

    const proofMetadata = {
      imported_from: 'onboarding',
      context_kind: contextKind,
      context_type: contextType,
      context_title: contextTitle,
      context_organization_name: contextOrganizationName,
      context_duration: contextDuration,
      context_summary: contextSummary,
      context_outcome: contextOutcome,
      context_company_size: normalizedCompanySize,
      context_industry_domain: contextIndustryDomain || null,
      context_focus_area: contextFocusArea || null,
      context_scope: contextScope || null,
      context_operating_environment: contextOperatingEnvironment || null,
      secondary_context_note: secondaryContextNote || null,
      secondary_context_links_optional: true,
      primary_anchor_required_for_intro_eligibility: true,
      context_visibility: 'private_anchor_public_safe_pack',
      focus_area: focusArea || contextFocusArea || contextTitle,
      proof_pack_skills: scaffoldSkills,
      proof_contribution_mode: proofContributionMode,
      proof_ownership_level: proofOwnershipLevel,
      proof_ownership_note: proofOwnershipNote,
      claimed_measured_outcomes: claimedMeasuredOutcomesWithLinks,
      claimed_outcome_count: claimedMeasuredOutcomes.length,
      outcome_claim_status: claimedMeasuredOutcomes.length > 0 ? 'proof_linked' : null,
      outcome_verification_status: claimedMeasuredOutcomes.length > 0 ? 'proof_linked' : null,
      candidate_evidence: true,
      public_signal: false,
      artifactSubtype: proofItemSubtype,
      proofInputType,
      proofArtifactType,
      proofFileName: uploadedFileDisplayName || proofFileName,
      uploadedFileId: uploadedFileId || null,
      first_proof_verification_intent: firstProofVerificationIntent,
    };

    const proofArtifactInsert = await supabase.from('proof_artifacts').insert({
      id: artifactId,
      owner_type: 'individual_profile',
      owner_id: user.id,
      subject_type: contextType,
      subject_id: contextId,
      artifact_kind: resolveProofArtifactKind(proofInputType, proofArtifactType),
      lifecycle_state: 'active',
      title: proofTitle,
      description: proofSummary,
      source_url: proofUrl || null,
      uploaded_file_id: uploadedFileId || null,
      storage_path: uploadedFileStoragePath,
      mime_type: attachedUpload?.detected_mime || null,
      activated_at: nowIso,
      visibility: 'owner_only',
      reveal_gate: 'none',
      metadata: proofMetadata,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (proofArtifactInsert.error) {
      log.error('onboarding.individual.proof_artifact_insert_failed', {
        userId: user.id,
        contextType,
        error: proofArtifactInsert.error,
      });
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
      lifecycle_state: 'ready',
      primary_claim_type: effectiveProofPackOutcome ? 'outcome' : 'contribution',
      title: proofTitle,
      summary: proofPackClaim,
      role_context: contextTitle,
      ownership_statement: proofPackOwnership,
      timeframe_label: contextDuration,
      context_json: {
        importedFrom: 'onboarding',
        contextKind,
        contextType,
        contextId,
        focusArea: focusArea || contextFocusArea || contextTitle,
        workMode: workMode || null,
        engagementType: engagementType || null,
        contextTitle,
        contextOrganizationName,
        contextDuration,
        contextSummary,
        contextOutcome,
        contextCompanySize: normalizedCompanySize,
        contextIndustryDomain,
        contextFocusArea,
        contextScope,
        contextOperatingEnvironment,
        secondaryContextNote,
        secondaryContextLinksOptional: true,
        primaryAnchorRequiredForIntroEligibility: true,
        evidenceTitle: proofTitle,
        evidenceUrl: proofUrl,
        proofInputType,
        proofArtifactType,
        uploadedFileId,
        proofFileName,
        proofPackClaim,
        proofPackOwnership,
        proofContributionMode,
        proofOwnershipLevel,
        proofOwnershipNote,
        proofPackOutcome: effectiveProofPackOutcome,
        claimedMeasuredOutcomes: claimedMeasuredOutcomesWithLinks,
        outcomeClaimStatus: claimedMeasuredOutcomes.length > 0 ? 'proof_linked' : null,
        outcomeVerificationStatus: claimedMeasuredOutcomes.length > 0 ? 'proof_linked' : null,
        proofPackSkills: scaffoldSkills,
        firstProofVerificationIntent,
      },
      evidence_summary: proofSummary,
      outcomes_summary: effectiveProofPackOutcome || null,
      verification_summary: 'No scoped verification is recorded for this Proof Pack yet.',
      visibility: 'owner_only',
      reveal_gate: 'none',
      created_by: user.id,
      verification_status: 'unverified',
      freshness_state: 'fresh',
      proof_quality_score: '0.60',
      schema_version: 'proof_pack/v2',
      freshness_evaluated_at: nowIso,
      last_refreshed_at: nowIso,
      portability_meta: {
        completenessState: 'context_anchored',
        importedFrom: 'onboarding',
        firstProofMilestone: 'portfolio_started',
        verificationOptionalAtCreation: true,
        firstProofVerificationIntent,
      },
      metadata: proofMetadata,
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (proofPackInsert.error) {
      log.error('onboarding.individual.proof_pack_insert_failed', {
        userId: user.id,
        contextType,
        artifactId,
        error: proofPackInsert.error,
      });
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
      item_class: isFileProof ? 'file_upload' : proofItemSubtype ? 'repo_activity' : 'url_link',
      subtype_metadata: {
        ...(proofItemSubtype ? { subtype: proofItemSubtype } : {}),
        artifactKind: resolveProofArtifactKind(proofInputType, proofArtifactType),
        proofArtifactType,
      },
      included_fields: ['title', 'description', 'sourceUrl', 'issuedAt', 'expiresAt'],
      created_at: nowIso,
      updated_at: nowIso,
    });

    if (proofPackItemInsert.error) {
      log.error('onboarding.individual.proof_pack_item_insert_failed', {
        userId: user.id,
        contextType,
        artifactId,
        packId,
        error: proofPackItemInsert.error,
      });
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
    revalidatePath(publicPortfolioPath);

    try {
      await reconcileVerifierContradictions({
        verifierProfileId: user.id,
      });
    } catch (reconcileError) {
      log.warn('onboarding.individual.contradiction_reconcile_failed', {
        userId: user.id,
        error: reconcileError,
      });
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
      state: 'first_proof_pack_created',
      details: {
        highestState: readiness.highestState,
      },
    });

    return {
      success: true,
      handle: normalizedHandle,
      publicPortfolioUrl: buildPublicPortfolioUrl(publicPortfolioPath),
      scaffoldProfilePath: '/app/i/profile',
      firstProofPackId: packId,
      firstProofPackCreated: true,
      portfolioReady: readiness.flags.portfolioReady,
      browseReady: readiness.flags.browseReady,
      qualifiedIntroReady: readiness.flags.qualifiedIntroReady,
      firstProofVerificationArtifact: {
        type: contextType,
        id: contextId,
      },
    };
  } catch (error: any) {
    log.error('onboarding.individual.unexpected_failed', {
      userId: user.id,
      error,
    });
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
        log.error('onboarding.organization.insert_failed', {
          orgId,
          error: orgInsert.error,
        });
        return { error: 'Failed to create organization. Please try again.' };
      }

      // Log RLS warning but continue with membership creation
      log.warn('organization.onboarding.insert_select_blocked_by_rls', {
        orgId,
      });
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
        log.error('onboarding.organization.owner_insert_failed', {
          orgId,
          userId: user.id,
          error: memberInsert.error,
        });
        return { error: 'Failed to create organization. Please try again.' };
      }

      // Log RLS warning but continue - membership was likely created
      log.warn('organization.onboarding.member_select_blocked_by_rls', {
        orgId,
      });
    }

    const personaUpdate = await supabase
      .from('profiles')
      .update({ persona: 'org_member', updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (personaUpdate.error) {
      log.warn('onboarding.organization.persona_update_failed', {
        orgId,
        userId: user.id,
        error: personaUpdate.error,
      });
    }

    const orgVisibilityUpsert = await supabase.from('organization_field_visibility').upsert({
      org_id: orgId,
      ...ORGANIZATION_DAY_ONE_VISIBILITY,
      updated_at: new Date().toISOString(),
    });

    if (orgVisibilityUpsert.error) {
      log.warn('onboarding.organization.visibility_defaults_failed', {
        orgId,
        error: orgVisibilityUpsert.error,
      });
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
    log.error('onboarding.organization.unexpected_failed', {
      userId: user.id,
      error,
    });
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'org_portfolio_publish_unhandled_error',
      failureClass: 'unhandled_portfolio_publish_error',
    });
    return { error: 'Failed to create organization. Please try again.' };
  }
}
