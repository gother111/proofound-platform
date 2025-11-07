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
import { revalidatePath } from 'next/cache';

/**
 * Mark the guided tour as completed for the current user
 */
export async function completeTour() {
  try {
    const user = await requireAuth();

    await db
      .update(profiles)
      .set({
        tourCompleted: true,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    // Revalidate pages that might show tour
    revalidatePath('/app');
    revalidatePath('/app/i');
    revalidatePath('/app/o');

    return { success: true };
  } catch (error) {
    console.error('Failed to complete tour:', error);
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
    console.error('Failed to reset tour:', error);
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
    console.error('Failed to get tour status:', error);
    return {
      success: false,
      tourCompleted: false,
      persona: 'unknown' as const,
      userId: '',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
