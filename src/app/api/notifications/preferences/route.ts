import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { notificationPreferences } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';

export const dynamic = 'force-dynamic';

const UpdatePreferencesSchema = z.object({
  inAppMatchSuggested: z.boolean().optional(),
  inAppIntroAccepted: z.boolean().optional(),
  inAppMessageReceived: z.boolean().optional(),
  inAppVerificationRequested: z.boolean().optional(),
  inAppVerificationCompleted: z.boolean().optional(),
  inAppAssignmentPublished: z.boolean().optional(),
  inAppInterviewScheduled: z.boolean().optional(),
  inAppContractSigned: z.boolean().optional(),
  emailMatchSuggested: z.boolean().optional(),
  emailIntroAccepted: z.boolean().optional(),
  emailMessageReceived: z.boolean().optional(),
  emailVerificationRequested: z.boolean().optional(),
  emailVerificationCompleted: z.boolean().optional(),
  emailAssignmentPublished: z.boolean().optional(),
  emailInterviewScheduled: z.boolean().optional(),
  emailContractSigned: z.boolean().optional(),
});

/**
 * GET /api/notifications/preferences
 *
 * Get user's notification preferences
 */
export async function GET() {
  try {
    const user = await requireAuth();

    let prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, user.id),
    });

    // If no preferences exist, create default ones
    if (!prefs) {
      const [newPrefs] = await db
        .insert(notificationPreferences)
        .values({
          userId: user.id,
        })
        .returning();
      prefs = newPrefs;
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    log.error('notification-preferences.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/preferences
 *
 * Update user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = UpdatePreferencesSchema.parse(body);

    // Check if preferences exist
    const existingPrefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, user.id),
    });

    let updatedPrefs;

    if (existingPrefs) {
      // Update existing preferences
      const [updated] = await db
        .update(notificationPreferences)
        .set({
          ...validatedData,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, user.id))
        .returning();
      updatedPrefs = updated;
    } else {
      // Create new preferences
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          userId: user.id,
          ...validatedData,
        })
        .returning();
      updatedPrefs = created;
    }

    log.info('notification-preferences.updated', {
      userId: user.id,
    });

    return NextResponse.json({ preferences: updatedPrefs });
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.error('notification-preferences.validation.failed', {
        errors: error.errors,
      });
      return NextResponse.json(
        { error: 'Invalid preferences data', details: error.errors },
        { status: 400 }
      );
    }

    log.error('notification-preferences.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
