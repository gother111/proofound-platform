import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { sendDeletionScheduledEmail } from '@/lib/email';
import { trackAccountDeletionRequested } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const GRACE_PERIOD_DAYS = 30;

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
 * Schedule account deletion with a 30-day grace period.
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

    // If account already deleted (anonymized), do not allow scheduling again.
    if (profile.deleted) {
      return NextResponse.json(
        {
          error: 'Account already deleted',
          message: 'This account has already been permanently deleted and cannot be recovered.',
        },
        { status: 410 }
      );
    }

    // If deletion is already scheduled in the future, do not allow re-scheduling.
    if (profile.deletionScheduledFor && profile.deletionScheduledFor > new Date()) {
      return NextResponse.json(
        {
          error: 'Deletion already scheduled',
          message:
            'Account deletion is already scheduled. You can cancel it from Privacy Settings.',
          deletionScheduledFor: profile.deletionScheduledFor.toISOString(),
        },
        { status: 409 }
      );
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

    const now = new Date();
    const scheduledFor = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    // Schedule deletion (grace period)
    await db
      .update(profiles)
      .set({
        deletionRequestedAt: now,
        deletionScheduledFor: scheduledFor,
        deletionReason: parsed.reason || null,
        deleted: false,
        updatedAt: now,
      })
      .where(eq(profiles.id, user.id));

    // Send confirmation email (best-effort)
    try {
      await sendDeletionScheduledEmail(authUser.email, user.id, scheduledFor);
    } catch (emailError) {
      log.error('privacy.account_deletion.scheduled_email_failed', {
        userId: user.id,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
    }

    // Track analytics (best-effort)
    await trackAccountDeletionRequested(
      user.id,
      scheduledFor.toISOString(),
      request,
      parsed.reason
    );

    log.info('privacy.account_deletion.scheduled', {
      userId: user.id,
      scheduledFor: scheduledFor.toISOString(),
    });

    return NextResponse.json({
      status: 'deletion_scheduled',
      accountStatus: 'deletion_scheduled',
      deletionRequestedAt: now.toISOString(),
      deletionScheduledFor: scheduledFor.toISOString(),
      daysRemaining: GRACE_PERIOD_DAYS,
      canCancelDeletion: true,
      message:
        'Your account deletion has been scheduled. You have 30 days to cancel before permanent deletion.',
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
        error: 'Failed to schedule account deletion',
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
        deletionScheduledFor: profiles.deletionScheduledFor,
        deleted: profiles.deleted,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Calculate days remaining if deletion is scheduled
    let daysRemaining = null;
    let canCancelDeletion = false;
    if (profile.deletionScheduledFor) {
      const now = new Date();
      const diff = profile.deletionScheduledFor.getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
      canCancelDeletion = profile.deletionScheduledFor > now && !profile.deleted;
    }

    return NextResponse.json({
      accountStatus: profile.deleted
        ? 'deleted'
        : profile.deletionScheduledFor
          ? 'deletion_scheduled'
          : 'active',
      deletionRequestedAt: profile.deletionRequestedAt?.toISOString() || null,
      deletionScheduledFor: profile.deletionScheduledFor?.toISOString() || null,
      daysRemaining,
      canCancelDeletion,
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
