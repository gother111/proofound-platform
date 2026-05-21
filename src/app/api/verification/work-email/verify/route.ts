import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconcileVerifierContradictions } from '@/lib/verification/contradiction';
import { hashWorkEmailVerificationToken } from '@/lib/verification/work-email-token';
import {
  buildWorkflowView,
  getLatestWorkEmailVerification,
  recordVerificationTransition,
} from '@/lib/workflow/service';
import { log } from '@/lib/log';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

/**
 * GET /api/verification/work-email/verify?token=xxx
 *
 * Verifies a work email using the token from the email link.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
    }
    const tokenHash = hashWorkEmailVerificationToken(token);

    const supabase = await createClient();

    // Find the profile with this token
    const { data: profile, error: findError } = await supabase
      .from('individual_profiles')
      .select('user_id, work_email, work_email_token_expires, work_email_org_id')
      .eq('work_email_token_hash', tokenHash)
      .single();

    if (findError || !profile) {
      return NextResponse.json({ error: 'Invalid or expired verification token' }, { status: 400 });
    }

    // Check if token is expired
    if (
      profile.work_email_token_expires &&
      new Date(profile.work_email_token_expires) < new Date()
    ) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check if this work email is already verified by another user
    // This prevents race conditions where multiple users try to verify the same email
    const { data: existingVerifiedProfile } = await supabase
      .from('individual_profiles')
      .select('user_id')
      .eq('work_email', profile.work_email)
      .eq('work_email_verified', true)
      .neq('user_id', profile.user_id)
      .maybeSingle();

    if (existingVerifiedProfile) {
      return NextResponse.json(
        { error: 'This work email is already verified by another account' },
        { status: 400 }
      );
    }

    // Update profile: confirm the work email channel metadata and clear the transport token.
    // The unique constraint will catch any race conditions that slip through.
    const nowIso = new Date().toISOString();
    const reverifyDueAtIso = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from('individual_profiles')
      .update({
        work_email_verified: true,
        work_email_verified_at: nowIso,
        work_email_reverify_due_at: reverifyDueAtIso,
        work_email_token: null, // Clear the token
        work_email_token_hash: null,
        work_email_token_expires: null,
      })
      .eq('user_id', profile.user_id);

    if (updateError) {
      log.error('verification.work_email_verify.profile_update_failed', {
        profileId: profile.user_id,
        error: updateError.message ?? String(updateError),
      });

      // Handle unique constraint violation (PostgreSQL error code 23505)
      // This catches race conditions where two users verify the same email simultaneously
      if (updateError.code === '23505' || updateError.message?.includes('unique')) {
        return NextResponse.json(
          { error: 'This work email is already verified by another account' },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: 'Failed to verify work email' }, { status: 500 });
    }

    try {
      await reconcileVerifierContradictions({
        verifierProfileId: profile.user_id,
        verifierEmail: profile.work_email,
      });
    } catch (reconcileError) {
      log.warn('verification.work_email_verify.contradiction_reconcile_failed', {
        profileId: profile.user_id,
        error: reconcileError instanceof Error ? reconcileError.message : String(reconcileError),
      });
    }

    let updatedVerificationRecord = null;
    if (isUuid(profile.user_id)) {
      try {
        const verificationRecord = await getLatestWorkEmailVerification(profile.user_id);
        if (verificationRecord) {
          updatedVerificationRecord = await recordVerificationTransition({
            verificationRecordId: verificationRecord.id,
            toState: 'verified',
            actorType: 'candidate',
            actorId: profile.user_id,
            metadata: {
              workEmail: profile.work_email,
            },
          });
        }
      } catch (workflowError) {
        log.warn('verification.work_email_verify.workflow_sync_failed', {
          profileId: profile.user_id,
          error: workflowError instanceof Error ? workflowError.message : String(workflowError),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Work email verified successfully',
      workEmail: profile.work_email,
      workflow: updatedVerificationRecord
        ? buildWorkflowView({
            machine: 'verification',
            state: updatedVerificationRecord.status,
            reasonCode: updatedVerificationRecord.failureCode,
            timestamps: {
              completedAt: updatedVerificationRecord.completedAt?.toISOString(),
              verifiedAt: updatedVerificationRecord.verifiedAt?.toISOString(),
              requestExpiresAt: updatedVerificationRecord.requestExpiresAt?.toISOString(),
            },
          })
        : null,
    });
  } catch (error) {
    log.error('verification.work_email_verify.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
