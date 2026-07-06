/**
 * Tour Actions
 *
 * Server actions for managing guided tour state
 */

'use server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';
import { revalidatePath } from 'next/cache';

/**
 * Mark the guided tour as completed for the current user
 * This is called both when the tour is completed and when it's skipped
 * to ensure the tour doesn't show again.
 */
export async function completeTour() {
  try {
    const user = await requireAuth();

    const result = await db
      .update(profiles)
      .set({
        tourCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    // Verify the update was successful by checking the profile
    const updatedProfile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        tourCompleted: true,
      },
    });

    if (!updatedProfile || !updatedProfile.tourCompleted) {
      log.error('tour.complete.verify_failed', {
        userId: user.id,
      });
      return {
        success: false,
        error: 'Failed to verify tour completion in database',
      };
    }

    // Revalidate pages that might show tour
    revalidatePath('/app');
    revalidatePath('/app/i');
    revalidatePath('/app/o');

    return { success: true };
  } catch (error) {
    log.error('tour.complete.failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Reset tour status (for testing or user request)
 */
export async function resetTour() {
  try {
    const user = await requireAuth();

    await db
      .update(profiles)
      .set({
        tourCompleted: false,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    revalidatePath('/app');
    revalidatePath('/app/i');
    revalidatePath('/app/o');

    return { success: true };
  } catch (error) {
    log.error('tour.reset.failed', { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get tour status for current user
 */
export async function getTourStatus() {
  try {
    const user = await requireAuth();

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.id, user.id),
      columns: {
        tourCompleted: true,
        persona: true,
      },
    });

    return {
      success: true,
      tourCompleted: profile?.tourCompleted ?? false,
      persona: profile?.persona ?? 'unknown',
      userId: user.id,
    };
  } catch (error) {
    log.error('tour.status.failed', { error });
    return {
      success: false,
      tourCompleted: false,
      persona: 'unknown' as const,
      userId: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
