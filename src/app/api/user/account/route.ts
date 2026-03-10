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

// Validation schema for deletion request
const AccountDeletionSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm deletion'),
  confirmPhrase: z.literal('DELETE MY ACCOUNT', {
    errorMap: () => ({
      message: 'You must type the confirmation phrase exactly: DELETE MY ACCOUNT',
    }),
  }),
  reason: z.string().max(500).optional(),
});

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

    // Parse and validate request body
    const body = await request.json();
    const parsed = AccountDeletionSchema.parse(body);

    // Get user profile to access email for password verification
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get the user's email from Supabase auth (not from profile)
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    // Verify password by attempting to sign in with the correct email
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: authUser.email, // Use actual email, not user.id
      password: parsed.password,
    });

    if (signInError) {
      // Log failed password attempt for security monitoring
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

    lifecycleOperation = await createLifecycleOperation({
      operationType: 'delete',
      subjectType: 'profile',
      subjectId: user.id,
      requestedBy: user.id,
      visibleStatus: 'processing',
      metadata: {
        reason: parsed.reason || null,
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
      reason: parsed.reason || null,
      metadata: {
        confirmPhraseVerified: true,
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

    // Remove Supabase auth user to revoke future access
    try {
      const adminClient = createAdminClient();
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
        if (deletionRequest) {
          await updateProfileDeletionRequestState({
            deletionRequestId: deletionRequest.id,
            toState: 'failed_requires_manual_review',
            actorType: 'system',
            trigger: 'deletion_failed',
            failureCode: 'auth_delete_failed',
            metadata: {
              message: deleteError.message,
            },
          });
        }
        if (lifecycleOperation) {
          await finalizeLifecycleOperation(lifecycleOperation.id, {
            status: 'failed_requires_manual_review',
            visibleStatus: 'failed',
            summaryCode: 'auth_delete_failed',
          });
        }
        log.error('privacy.account_deletion.auth_delete_failed', {
          userId: user.id,
          error: deleteError.message,
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
      if (deletionRequest) {
        await updateProfileDeletionRequestState({
          deletionRequestId: deletionRequest.id,
          toState: 'failed_requires_manual_review',
          actorType: 'system',
          trigger: 'deletion_failed',
          failureCode: 'auth_delete_failed',
          metadata: {
            message:
              authDeleteError instanceof Error ? authDeleteError.message : 'Unknown auth error',
          },
        });
      }
      if (lifecycleOperation) {
        await finalizeLifecycleOperation(lifecycleOperation.id, {
          status: 'failed_requires_manual_review',
          visibleStatus: 'failed',
          summaryCode: 'auth_delete_failed',
        });
      }
      log.error('privacy.account_deletion.auth_delete_failed', {
        userId: user.id,
        error: authDeleteError instanceof Error ? authDeleteError.message : 'Unknown error',
      });
      return NextResponse.json(
        {
          error: 'Failed to delete account',
          message: 'Could not revoke account access. Please try again shortly.',
        },
        { status: 500 }
      );
    }

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
      reason: parsed.reason || null,
      operationId: lifecycleOperation.id,
    });
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
      reason: parsed.reason || 'Not provided',
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
    if (error instanceof z.ZodError) {
      emitLaunchTrace(trace, {
        outcome: 'rejected',
        state: 'account_delete_validation_failed',
        failureClass: 'invalid_deletion_request',
      });
      return NextResponse.json(
        {
          error: 'Invalid deletion request',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

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
