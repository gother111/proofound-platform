import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/user/account/cancel-deletion
 * 
 * Cancel a pending account deletion request
 * 
 * Flow:
 * 1. Verify user is authenticated
 * 2. Check if deletion is scheduled
 * 3. Clear deletion_requested_at and deletion_scheduled_for
 * 4. Send confirmation email (optional)
 * 5. Return success confirmation
 * 
 * Can only be called during the 30-day grace period
 */
export async function POST() {
  try {
    const user = await requireAuth();

    // Get current profile
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

    // Check if account is already deleted
    if (profile.deleted) {
      return NextResponse.json(
        {
          error: 'Account already deleted',
          message: 'This account has already been permanently deleted and cannot be recovered.',
        },
        { status: 410 } // 410 Gone
      );
    }

    // Check if deletion is scheduled
    if (!profile.deletionScheduledFor) {
      return NextResponse.json(
        {
          error: 'No deletion scheduled',
          message: 'There is no account deletion scheduled for this account.',
        },
        { status: 400 }
      );
    }

    // Check if grace period has expired
    const now = new Date();
    if (profile.deletionScheduledFor <= now) {
      return NextResponse.json(
        {
          error: 'Grace period expired',
          message: 'The grace period for cancelling account deletion has expired. Your account may already be in the deletion process.',
        },
        { status: 410 } // 410 Gone
      );
    }

    // Cancel deletion by clearing the fields
    await db
      .update(profiles)
      .set({
        deletionRequestedAt: null,
        deletionScheduledFor: null,
        deletionReason: null,
        updatedAt: now,
      })
      .where(eq(profiles.id, user.id));

    // Log cancellation
    log.info('privacy.account_deletion.cancelled', {
      userId: user.id,
      daysRemaining: Math.ceil((profile.deletionScheduledFor.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    });

    // TODO: Send cancellation confirmation email
    // This will be implemented in Phase 4 (integration-emails)
    // Email should include:
    // - Confirmation that deletion was cancelled
    // - Account is now active again
    // - Option to request deletion again in the future

    return NextResponse.json({
      status: 'cancellation_successful',
      message: 'Your account deletion has been successfully cancelled.',
      accountStatus: 'active',
      nextSteps: [
        'Your account is now active again',
        'All your data has been preserved',
        'You can continue using Proofound normally',
        'You can request deletion again anytime from Settings',
      ],
    });
  } catch (error) {
    log.error('privacy.account_deletion.cancellation_failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Failed to cancel account deletion',
        message: 'An error occurred while cancelling your deletion request. Please contact support.',
      },
      { status: 500 }
    );
  }
}

