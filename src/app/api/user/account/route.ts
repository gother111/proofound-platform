import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { profiles } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  createLifecycleOperation,
  executeAccountDeletionLifecycle,
  finalizeLifecycleOperation,
} from '@/lib/lifecycle/reconciliation';
import {
  createProfileDeletionRequest,
  getLatestProfileDeletionRequest,
  updateProfileDeletionRequestState,
} from '@/lib/lifecycle/residual';
import { emitLaunchTrace, startLaunchTrace } from '@/lib/launch/trace';

export const dynamic = 'force-dynamic';

const DELETION_REASON_ALLOWLIST = new Set([
  'No longer need the service',
  'Privacy concerns',
  'Found a better alternative',
  'Too many emails/notifications',
  'Difficult to use',
  'Not enough matches',
  'Account security concern',
  'Other',
]);

const ACTIVE_DELETION_STATES = new Set([
  'requested',
  'processing',
  'blocked_legal_hold',
  'failed_requires_manual_review',
]);

// Validation schema for deletion request
const AccountDeletionSchema = z.object({
  password: z.string().optional(),
  confirmPhrase: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({
      message: 'You must type the confirmation phrase exactly: DELETE MY ACCOUNT',
    }),
  }),
  reason: z.string().max(500).optional(),
});

function normalizeDeletionReason(reason?: string | null) {
  const trimmed = reason?.trim();
  if (!trimmed) {
    return null;
  }

  return DELETION_REASON_ALLOWLIST.has(trimmed) ? trimmed : 'Other';
}

function getAuthProviders(authUser: { app_metadata?: Record<string, unknown> } | null) {
  const metadata = authUser?.app_metadata ?? {};
  const providers = new Set<string>();
  const metadataProviders = metadata.providers;

  if (Array.isArray(metadataProviders)) {
    for (const provider of metadataProviders) {
      if (typeof provider === 'string') {
        providers.add(provider);
      }
    }
  }

  if (typeof metadata.provider === 'string') {
    providers.add(metadata.provider);
  }

  return providers;
}

function deletionStatusResponse(input: {
  status: 'deletion_in_progress' | 'deleted';
  deletionRequest?: { id?: string | null; lifecycleState?: string | null } | null;
  operationId?: string | null;
}) {
  const statusCode = input.status === 'deleted' ? 200 : 202;

  return NextResponse.json(
    {
      status: input.status,
      accountStatus: input.deletionRequest?.lifecycleState ?? input.status,
      deletionRequestId: input.deletionRequest?.id ?? null,
      operationId: input.operationId ?? null,
      message:
        input.status === 'deleted'
          ? 'Your account has already been deleted.'
          : 'Account deletion is already in progress.',
    },
    { status: statusCode }
  );
}

/**
 * DELETE /api/user/account
 *
 * GDPR Article 17 (Right to Erasure)
 *
 * PRD I-25: Immediate, irreversible deletion (no grace period).
 */
export async function DELETE(request: NextRequest) {
  let deletionRequest: { id: string } | null = null;
  let lifecycleOperation: { id: string } | null = null;
  const trace = startLaunchTrace({
    flow: 'delete_unpublish',
    requestId: request.headers.get('x-request-id'),
    actorType: 'anonymous',
  });

  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'account_delete_unauthorized',
        failureClass: 'unauthorized',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    trace.actorId = user.id;
    trace.actorType = 'user_account';
    trace.objectRefs.profileId = user.id;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'account_delete_validation_failed',
        failureClass: 'invalid_json_body',
      });
      return NextResponse.json(
        {
          error: 'Invalid deletion request',
          message: 'Request body must be valid JSON.',
        },
        { status: 400 }
      );
    }

    const parsedResult = AccountDeletionSchema.safeParse(body);
    if (!parsedResult.success) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'account_delete_validation_failed',
        failureClass: 'invalid_deletion_request',
      });
      return NextResponse.json(
        {
          error: 'Invalid deletion request',
          details: parsedResult.error.flatten(),
        },
        { status: 400 }
      );
    }
    const parsed = parsedResult.data;

    // Get user profile to access email for password verification
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const existingDeletionRequest = await getLatestProfileDeletionRequest(user.id);
    if (profile.deleted || existingDeletionRequest?.lifecycleState === 'deleted') {
      return deletionStatusResponse({
        status: 'deleted',
        deletionRequest: existingDeletionRequest,
        operationId: existingDeletionRequest?.lifecycleOperationId ?? null,
      });
    }

    if (
      existingDeletionRequest &&
      ACTIVE_DELETION_STATES.has(existingDeletionRequest.lifecycleState)
    ) {
      return deletionStatusResponse({
        status: 'deletion_in_progress',
        deletionRequest: existingDeletionRequest,
        operationId: existingDeletionRequest.lifecycleOperationId ?? null,
      });
    }

    // Get the user's email from Supabase auth (not from profile)
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const authProviders = getAuthProviders(authUser);
    const isEmailPasswordAccount = authProviders.size === 0 || authProviders.has('email');
    const normalizedReason = normalizeDeletionReason(parsed.reason);

    if (isEmailPasswordAccount) {
      if (!parsed.password) {
        return NextResponse.json(
          {
            error: 'Password required',
            message: 'Password confirmation is required to delete an email/password account.',
          },
          { status: 400 }
        );
      }

      // Verify password by attempting to sign in with the correct email.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authUser.email, // Use actual email, not user.id
        password: parsed.password,
      });

      if (signInError) {
        // Log failed password attempt for security monitoring.
        log.warn('privacy.account_deletion.invalid_password', {
          userId: user.id,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
        });

        return NextResponse.json(
          {
            error: 'Invalid password',
            message: 'The password you entered is incorrect. Please try again.',
          },
          { status: 401 }
        );
      }
    }

    lifecycleOperation = await createLifecycleOperation({
      operationType: 'delete',
      subjectType: 'profile',
      subjectId: user.id,
      requestedBy: user.id,
      visibleStatus: 'processing',
      metadata: {
        reason: normalizedReason,
        reasonMinimized: parsed.reason ? normalizedReason !== parsed.reason.trim() : false,
        authProviderClass: isEmailPasswordAccount ? 'email_password' : 'oauth',
      },
      targets: [
        { targetType: 'db_record', targetRef: `profiles:${user.id}`, desiredState: 'deleted' },
        { targetType: 'snippet', targetRef: 'profile_snippets', desiredState: 'revoked' },
        { targetType: 'proof_pack', targetRef: 'proof_packs', desiredState: 'revoked' },
        { targetType: 'storage_object', targetRef: 'uploaded_files', desiredState: 'deleted' },
        {
          targetType: 'public_portfolio',
          targetRef: `profiles:${user.id}`,
          desiredState: 'disabled',
        },
        {
          targetType: 'search_index_state',
          targetRef: `profiles:${user.id}`,
          desiredState: 'noindex_pending',
        },
        {
          targetType: 'analytics_snapshot',
          targetRef: `profiles:${user.id}`,
          desiredState: 'retained_pseudonymized',
        },
      ],
    });
    deletionRequest = await createProfileDeletionRequest({
      profileId: user.id,
      requestedBy: user.id,
      lifecycleOperationId: lifecycleOperation.id,
      reason: normalizedReason,
      metadata: {
        confirmPhraseVerified: true,
        reasonMinimized: parsed.reason ? normalizedReason !== parsed.reason.trim() : false,
        authProviderClass: isEmailPasswordAccount ? 'email_password' : 'oauth',
      },
    });
    await updateProfileDeletionRequestState({
      deletionRequestId: deletionRequest.id,
      toState: 'processing',
      actorType: 'system',
      trigger: 'deletion_processing_started',
      metadata: {
        operationId: lifecycleOperation.id,
      },
    });

    // Immediate deletion: anonymize data now (stored procedure handles cascading cleanup)
    try {
      await db.execute(sql`SELECT anonymize_user_account(${user.id}::uuid)`);
    } catch (anonymizeError) {
      if (deletionRequest) {
        await updateProfileDeletionRequestState({
          deletionRequestId: deletionRequest.id,
          toState: 'failed_requires_manual_review',
          actorType: 'system',
          trigger: 'deletion_failed',
          failureCode: 'anonymize_failed',
          metadata: {
            message:
              anonymizeError instanceof Error ? anonymizeError.message : 'Unknown anonymize error',
          },
        });
      }
      if (lifecycleOperation) {
        await finalizeLifecycleOperation(lifecycleOperation.id, {
          status: 'failed_requires_manual_review',
          visibleStatus: 'failed',
          summaryCode: 'anonymize_failed',
        });
      }
      log.error('privacy.account_deletion.anonymize_failed', {
        userId: user.id,
        error: anonymizeError instanceof Error ? anonymizeError.message : 'Unknown error',
      });
      return NextResponse.json(
        {
          error: 'Failed to delete account',
          message: 'An error occurred while deleting your account.',
        },
        { status: 500 }
      );
    }

    await executeAccountDeletionLifecycle({
      userId: user.id,
      reason: normalizedReason,
      operationId: lifecycleOperation.id,
    });

    // Revoke future access only after data deletion/anonymization work has succeeded.
    try {
      const adminClient = createAdminClient();
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        await updateProfileDeletionRequestState({
          deletionRequestId: deletionRequest.id,
          toState: 'failed_requires_manual_review',
          actorType: 'system',
          trigger: 'deletion_failed',
          failureCode: 'auth_delete_failed',
          metadata: {
            message: deleteError.message,
            dataDeletionCompletedBeforeAuthFailure: true,
          },
        });
        await finalizeLifecycleOperation(lifecycleOperation.id, {
          status: 'failed_requires_manual_review',
          visibleStatus: 'failed',
          summaryCode: 'auth_delete_failed',
        });
        log.error('privacy.account_deletion.auth_delete_failed', {
          userId: user.id,
          error: deleteError.message,
          dataDeletionCompletedBeforeAuthFailure: true,
        });
        return NextResponse.json(
          {
            error: 'Failed to delete account',
            message: 'Could not revoke account access. Please try again shortly.',
          },
          { status: 500 }
        );
      }
    } catch (authDeleteError) {
      await updateProfileDeletionRequestState({
        deletionRequestId: deletionRequest.id,
        toState: 'failed_requires_manual_review',
        actorType: 'system',
        trigger: 'deletion_failed',
        failureCode: 'auth_delete_failed',
        metadata: {
          message:
            authDeleteError instanceof Error ? authDeleteError.message : 'Unknown auth error',
          dataDeletionCompletedBeforeAuthFailure: true,
        },
      });
      await finalizeLifecycleOperation(lifecycleOperation.id, {
        status: 'failed_requires_manual_review',
        visibleStatus: 'failed',
        summaryCode: 'auth_delete_failed',
      });
      log.error('privacy.account_deletion.auth_delete_failed', {
        userId: user.id,
        error: authDeleteError instanceof Error ? authDeleteError.message : 'Unknown error',
        dataDeletionCompletedBeforeAuthFailure: true,
      });
      return NextResponse.json(
        {
          error: 'Failed to delete account',
          message: 'Could not revoke account access. Please try again shortly.',
        },
        { status: 500 }
      );
    }

    await updateProfileDeletionRequestState({
      deletionRequestId: deletionRequest.id,
      toState: 'deleted',
      actorType: 'system',
      trigger: 'deletion_completed',
      metadata: {
        operationId: lifecycleOperation.id,
      },
    });
    await finalizeLifecycleOperation(lifecycleOperation.id, {
      status: 'completed',
      visibleStatus: 'completed',
      summaryCode: 'account_deleted',
    });

    log.info('privacy.account_deletion.completed', {
      userId: user.id,
      reason: normalizedReason || 'Not provided',
    });
    emitLaunchTrace(trace, {
      outcome: 'success',
      state: 'public_projection_removed',
      details: {
        deletionRequestId: deletionRequest.id,
        operationId: lifecycleOperation.id,
      },
    });

    return NextResponse.json({
      status: 'deleted',
      deletionRequestId: deletionRequest.id,
      operationId: lifecycleOperation.id,
      message: 'Your account has been permanently deleted. This action cannot be undone.',
    });
  } catch (error) {
    log.error('privacy.account_deletion.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    emitLaunchTrace(trace, {
      outcome: 'failure',
      state: 'account_delete_failed',
      failureClass: error instanceof Error ? error.name : 'account_delete_failed',
    });
    if (deletionRequest) {
      await updateProfileDeletionRequestState({
        deletionRequestId: deletionRequest.id,
        toState: 'failed_requires_manual_review',
        actorType: 'system',
        trigger: 'deletion_failed',
        failureCode: error instanceof Error ? error.name : 'deletion_failed',
        metadata: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(() => undefined);
    }
    if (lifecycleOperation) {
      await finalizeLifecycleOperation(lifecycleOperation.id, {
        status: 'failed_requires_manual_review',
        visibleStatus: 'failed',
        summaryCode: error instanceof Error ? error.name : 'deletion_failed',
      }).catch(() => undefined);
    }

    return NextResponse.json(
      {
        error: 'Failed to delete account',
        message:
          'An error occurred while processing your deletion request. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/account
 *
 * Get current account status including deletion status
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const [profile] = await db
      .select({
        id: profiles.id,
        lifecycleState: profiles.lifecycleState,
        deletionRequestedAt: profiles.deletionRequestedAt,
        deleted: profiles.deleted,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    const deletionRequest = await getLatestProfileDeletionRequest(user.id);

    return NextResponse.json({
      accountStatus:
        deletionRequest?.lifecycleState ?? (profile.deleted ? 'deleted' : profile.lifecycleState),
      deletionRequestedAt:
        deletionRequest?.requestedAt?.toISOString() ||
        profile.deletionRequestedAt?.toISOString() ||
        null,
      deletionScheduledFor: null,
      daysRemaining: null,
      canCancelDeletion: false,
    });
  } catch (error) {
    log.error('privacy.account_status.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Failed to fetch account status',
      },
      { status: 500 }
    );
  }
}
