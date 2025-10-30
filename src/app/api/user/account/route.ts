import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';
import { createClient } from '@/lib/supabase/server';
import { sendDeletionScheduledEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// Validation schema for deletion request
const AccountDeletionSchema = z.object({
  password: z.string().min(1, 'Password is required to confirm deletion'),
  reason: z.string().max(500).optional(),
});

/**
 * DELETE /api/user/account
 * 
 * GDPR Article 17 (Right to Erasure)
 * 
 * Request account deletion with 30-day grace period
 * 
 * Flow:
 * 1. Verify user password using Supabase auth (security check)
 * 2. Set deletion_requested_at = NOW()
 * 3. Set deletion_scheduled_for = NOW() + 30 days
 * 4. Send confirmation email with cancellation link
 * 5. Return scheduled deletion date
 * 
 * During grace period:
 * - User can cancel deletion via /api/user/account/cancel-deletion
 * - User receives reminder email at day 23 (7 days before deletion)
 * 
 * After grace period:
 * - Background job (cron) anonymizes account
 * - All PII is removed/replaced with "Deleted User"
 * - Some data retained for 90 days for legal/fraud prevention
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Parse and validate request body
    const body = await request.json();
    const parsed = AccountDeletionSchema.parse(body);

    // Get user profile to access email for password verification
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get the user's email from Supabase auth (not from profile)
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser?.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
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
          message: 'The password you entered is incorrect. Please try again.'
        },
        { status: 401 }
      );
    }

    // Check if account deletion is already scheduled
    if (profile.deletionScheduledFor) {
      return NextResponse.json(
        {
          error: 'Account deletion already scheduled',
          scheduledFor: profile.deletionScheduledFor.toISOString(),
          message: 'Your account deletion is already scheduled. You can cancel it from your settings.',
        },
        { status: 409 }
      );
    }

    // Calculate deletion date (30 days from now)
    const now = new Date();
    const scheduledDeletionDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Update profile with deletion request
    await db
      .update(profiles)
      .set({
        deletionRequestedAt: now,
        deletionScheduledFor: scheduledDeletionDate,
        deletionReason: parsed.reason || null,
        updatedAt: now,
      })
      .where(eq(profiles.id, user.id));

    // Log deletion request
    log.info('privacy.account_deletion.requested', {
      userId: user.id,
      scheduledFor: scheduledDeletionDate.toISOString(),
      reason: parsed.reason || 'Not provided',
    });

    // Send confirmation email with cancellation link
    // Note: Email failures are logged but don't block the deletion request
    try {
      await sendDeletionScheduledEmail(authUser.email, user.id, scheduledDeletionDate);
      log.info('privacy.account_deletion.email_sent', {
        userId: user.id,
        email: authUser.email,
      });
    } catch (emailError) {
      // Log email failure but don't block the deletion request
      log.error('privacy.account_deletion.email_failed', {
        userId: user.id,
        error: emailError instanceof Error ? emailError.message : 'Unknown error',
      });
    }

    // Generate cancellation URL
    const cancellationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/settings?tab=privacy`;

    return NextResponse.json({
      status: 'deletion_scheduled',
      scheduledFor: scheduledDeletionDate.toISOString(),
      gracePeriodDays: 30,
      cancellationUrl,
      message: 'Your account deletion has been scheduled. You have 30 days to cancel this request.',
      nextSteps: [
        'You will receive a confirmation email shortly',
        'You can cancel this request anytime within the next 30 days',
        'A reminder email will be sent 7 days before deletion',
        'After 30 days, your account will be permanently anonymized',
      ],
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
        message: 'An error occurred while processing your deletion request. Please try again later.',
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
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Calculate days remaining if deletion is scheduled
    let daysRemaining = null;
    if (profile.deletionScheduledFor) {
      const now = new Date();
      const diff = profile.deletionScheduledFor.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (24 * 60 * 60 * 1000));
    }

    return NextResponse.json({
      accountStatus: profile.deleted ? 'deleted' : (profile.deletionScheduledFor ? 'deletion_scheduled' : 'active'),
      deletionRequestedAt: profile.deletionRequestedAt?.toISOString() || null,
      deletionScheduledFor: profile.deletionScheduledFor?.toISOString() || null,
      daysRemaining,
      canCancelDeletion: profile.deletionScheduledFor && !profile.deleted,
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

