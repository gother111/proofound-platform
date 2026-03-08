import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkEmailValidity } from '@/lib/verification/work-email-validity';
import { isMissingColumnError } from '@/lib/db/schemaCompatibility';
import { resolveHasLinkedInIdentityVerification } from '@/lib/linkedin-verified';
import {
  listVerificationRecordsForOwner,
  summarizeVerificationPolicy,
} from '@/lib/verification/policy';
import { buildWorkflowView } from '@/lib/workflow/service';

function hasActiveWorkEmailToken(profile: {
  work_email_token?: string | null;
  work_email_token_expires?: string | null;
  work_email_verified?: boolean | null;
}) {
  if (!profile.work_email_token || profile.work_email_verified) {
    return false;
  }

  if (!profile.work_email_token_expires) {
    return false;
  }

  const expiresAtMs = new Date(profile.work_email_token_expires).getTime();
  if (!Number.isFinite(expiresAtMs)) {
    return false;
  }

  return expiresAtMs > Date.now();
}

/**
 * GET /api/verification/status
 *
 * Returns the current verification status for the logged-in user.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const latestSelect =
      'verified, verification_method, verification_status, verification_tier, verification_tier_source, verified_at, work_email, work_email_verified, work_email_verified_at, work_email_reverify_due_at, work_email_token, work_email_token_expires, linkedin_verification_status, linkedin_verification_level, linkedin_verified_at, linkedin_verification_data';
    const legacySelect =
      'verified, verification_method, verification_status, verified_at, work_email, work_email_verified, work_email_token, work_email_token_expires';
    const latestOnlyColumns = [
      'verification_tier',
      'verification_tier_source',
      'work_email_verified_at',
      'work_email_reverify_due_at',
      'linkedin_verification_status',
      'linkedin_verification_level',
      'linkedin_verified_at',
      'linkedin_verification_data',
    ];

    // Fetch individual profile with verification status.
    // Fallback keeps this endpoint working when deployments run against slightly older schemas.
    let { data: profile, error: profileError } = await supabase
      .from('individual_profiles')
      .select(latestSelect)
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError && isMissingColumnError(profileError, latestOnlyColumns)) {
      console.warn('Falling back to legacy verification status query due to schema lag.', {
        code: profileError.code,
        message: profileError.message,
      });

      const { data: legacyProfile, error: legacyProfileError } = await supabase
        .from('individual_profiles')
        .select(legacySelect)
        .eq('user_id', user.id)
        .maybeSingle();

      profileError = legacyProfileError;
      profile = legacyProfile
        ? {
            ...legacyProfile,
            work_email_verified_at: null,
            work_email_reverify_due_at: null,
            verification_tier: 'unverified',
            verification_tier_source: 'unknown',
            linkedin_verification_status: 'unverified',
            linkedin_verification_level: 'unverified',
            linkedin_verified_at: null,
            linkedin_verification_data: null,
          }
        : legacyProfile;
    }

    // Handle errors - maybeSingle() typically returns null data and no error if not found
    // But if there's an error, log it and only fail on real database errors
    if (profileError) {
      // Log the full error for debugging
      console.error('Error fetching individual profile:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });

      // PGRST116 = "not found" (PostgREST error code), which is expected when profile doesn't exist
      // Most Supabase clients return null without error for maybeSingle(), but some may return this code
      // Only treat as error if it's a real database error (not "not found")
      const isNotFoundError =
        profileError.code === 'PGRST116' ||
        profileError.message?.toLowerCase().includes('not found') ||
        profileError.message?.toLowerCase().includes('no rows');

      if (!isNotFoundError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch verification status',
            details: profileError.message || 'Database error',
          },
          { status: 500 }
        );
      }
      // If it's a "not found" error, continue to return default unverified status below
    }

    if (!profile) {
      // If no individual profile exists, return default unverified status
      return NextResponse.json({
        verified: false,
        verificationMethod: null,
        verificationStatus: 'unverified',
        verificationTier: 'unverified',
        verificationTierSource: 'unknown',
        verifiedAt: null,
        linkedinVerificationStatus: 'unverified',
        linkedinVerificationLevel: 'unverified',
        linkedinHasIdentityVerification: false,
        linkedinVerifiedAt: null,
        workEmail: null,
        workEmailVerified: false,
        workEmailReverifyDueAt: null,
        workEmailNeedsReverify: false,
        workflow: null,
      });
    }

    const canonicalRecords = await listVerificationRecordsForOwner(
      'individual_profile',
      user.id
    ).catch(() => []);
    const canonicalWorkEmailVerification =
      canonicalRecords.find((record) => record.verificationKind === 'work_email') ?? null;
    const workEmailValidity = resolveWorkEmailValidity(profile);
    const hasPendingToken =
      hasActiveWorkEmailToken(profile) || canonicalWorkEmailVerification?.status === 'pending';
    const policySummary = summarizeVerificationPolicy({
      records: canonicalRecords,
      legacyProfile: {
        verified: profile.verified,
        verificationMethod: profile.verification_method,
        verificationStatus: profile.verification_status,
        verificationTier: profile.verification_tier,
        verificationTierSource: profile.verification_tier_source,
        workEmailCurrentlyVerified: workEmailValidity.isCurrentlyVerified,
        linkedinVerificationStatus: profile.linkedin_verification_status,
        linkedinHasIdentityVerification: resolveHasLinkedInIdentityVerification(
          profile.linkedin_verification_data
        ),
      },
    });
    const linkedinVerificationStatus =
      (profile.linkedin_verification_status as
        | 'unverified'
        | 'pending'
        | 'verified'
        | 'failed'
        | null) || 'unverified';
    const linkedinVerificationLevel =
      (profile.linkedin_verification_level as
        | 'unverified'
        | 'pending'
        | 'workplace'
        | 'identity'
        | 'failed'
        | null) ||
      (policySummary.compatibility.verificationTier === 'identity_verified'
        ? 'identity'
        : policySummary.compatibility.verificationTier === 'workplace_verified'
          ? 'workplace'
          : 'unverified');
    const linkedinHasIdentityVerification =
      linkedinVerificationLevel === 'identity' ||
      resolveHasLinkedInIdentityVerification(profile.linkedin_verification_data);
    const effectiveIdentityVerified =
      policySummary.compatibility.verificationTier === 'identity_verified';
    const verificationStatus =
      hasPendingToken && policySummary.compatibility.verificationStatus === 'unverified'
        ? 'pending'
        : policySummary.compatibility.verificationStatus;
    const verificationMethod =
      verificationStatus === 'pending' &&
      hasPendingToken &&
      !policySummary.compatibility.verificationMethod
        ? 'work_email'
        : policySummary.compatibility.verificationMethod;
    const workflowState =
      canonicalWorkEmailVerification?.status === 'verified' && workEmailValidity.needsReverify
        ? 'expired'
        : (canonicalWorkEmailVerification?.status ?? 'pending');

    return NextResponse.json({
      verified: effectiveIdentityVerified,
      verificationMethod,
      verificationStatus,
      verificationTier: policySummary.compatibility.verificationTier,
      verificationTierSource: policySummary.compatibility.verificationTierSource,
      verifiedAt: profile.verified_at,
      linkedinVerificationStatus,
      linkedinVerificationLevel,
      linkedinHasIdentityVerification,
      linkedinVerifiedAt: profile.linkedin_verified_at,
      workEmail: profile.work_email,
      workEmailVerified:
        workEmailValidity.isCurrentlyVerified || policySummary.compatibility.workEmailVerified,
      workEmailReverifyDueAt: workEmailValidity.reverifyDueAt,
      workEmailNeedsReverify: workEmailValidity.needsReverify,
      summary: {
        badgeSemanticsVersion: policySummary.badgeSemanticsVersion,
        publicBadges: policySummary.publicBadges,
        orgReviewBadges: policySummary.orgReviewBadges,
        internalBadges: policySummary.internalBadges,
        slots: policySummary.slots,
        activeIssues: policySummary.activeIssues,
      },
      workflow: buildWorkflowView({
        machine: 'verification',
        state: workflowState,
        reasonCode: canonicalWorkEmailVerification?.failureCode ?? null,
        timestamps: {
          requestedAt: canonicalWorkEmailVerification?.requestedAt?.toISOString(),
          expiresAt: canonicalWorkEmailVerification?.expiresAt?.toISOString(),
          requestExpiresAt: canonicalWorkEmailVerification?.requestExpiresAt?.toISOString(),
          followUpDueAt: canonicalWorkEmailVerification?.followUpDueAt?.toISOString(),
          completedAt: canonicalWorkEmailVerification?.completedAt?.toISOString(),
          expiredAt: canonicalWorkEmailVerification?.expiredAt?.toISOString(),
          downgradedAt: canonicalWorkEmailVerification?.downgradedAt?.toISOString(),
          contradictedAt: canonicalWorkEmailVerification?.contradictedAt?.toISOString(),
          disputedAt: canonicalWorkEmailVerification?.disputedAt?.toISOString(),
          revokedAt: canonicalWorkEmailVerification?.revokedAt?.toISOString(),
          cancelledAt: canonicalWorkEmailVerification?.cancelledAt?.toISOString(),
          verifiedAt: canonicalWorkEmailVerification?.verifiedAt?.toISOString(),
        },
      }),
    });
  } catch (error) {
    console.error('Error in verification status API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
