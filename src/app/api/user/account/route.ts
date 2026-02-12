import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
  try {
    const user = await requireAuth();

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

    // Remove Supabase auth user to revoke future access
    try {
      const adminClient = createAdminClient();
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
      if (deleteError) {
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

    // Mark profile as deleted (defense-in-depth if procedure did not)
    await db
      .update(profiles)
      .set({
        deletionRequestedAt: new Date(),
        deletionScheduledFor: null,
        deletionReason: parsed.reason || null,
        deleted: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    log.info('privacy.account_deletion.completed', {
      userId: user.id,
      reason: parsed.reason || 'Not provided',
    });

    return NextResponse.json({
      status: 'deleted',
      message: 'Your account has been permanently deleted. This action cannot be undone.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
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
    const user = await requireAuth();

    const [profile] = await db
      .select({
        id: profiles.id,
        deletionRequestedAt: profiles.deletionRequestedAt,
        deleted: profiles.deleted,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      accountStatus: profile.deleted ? 'deleted' : 'active',
      deletionRequestedAt: profile.deletionRequestedAt?.toISOString() || null,
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
