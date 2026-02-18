import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { notificationPreferences } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const PreferencesSchema = z.object({
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
  pushMatchSuggested: z.boolean().optional(),
  pushIntroAccepted: z.boolean().optional(),
  pushMessageReceived: z.boolean().optional(),
  pushVerificationRequested: z.boolean().optional(),
  pushVerificationCompleted: z.boolean().optional(),
  pushAssignmentPublished: z.boolean().optional(),
  pushInterviewScheduled: z.boolean().optional(),
  pushContractSigned: z.boolean().optional(),
});

function defaultPreferences(userId: string) {
  return {
    userId,
    inAppMatchSuggested: true,
    inAppIntroAccepted: true,
    inAppMessageReceived: true,
    inAppVerificationRequested: true,
    inAppVerificationCompleted: true,
    inAppAssignmentPublished: true,
    inAppInterviewScheduled: true,
    inAppContractSigned: true,
    emailMatchSuggested: true,
    emailIntroAccepted: true,
    emailMessageReceived: false,
    emailVerificationRequested: true,
    emailVerificationCompleted: true,
    emailAssignmentPublished: true,
    emailInterviewScheduled: true,
    emailContractSigned: true,
    pushMatchSuggested: true,
    pushIntroAccepted: true,
    pushMessageReceived: true,
    pushVerificationRequested: true,
    pushVerificationCompleted: true,
    pushAssignmentPublished: true,
    pushInterviewScheduled: true,
    pushContractSigned: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    let [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, auth.user.id))
      .limit(1);

    if (!prefs) {
      [prefs] = await db
        .insert(notificationPreferences)
        .values(defaultPreferences(auth.user.id))
        .returning();
    }

    return mobileSuccess(prefs);
  } catch (error) {
    console.error('[mobile.notifications.preferences.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch notification preferences', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = PreferencesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid notification preferences payload',
        400,
        parsed.error.flatten()
      );
    }

    const [existing] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, auth.user.id))
      .limit(1);

    if (!existing) {
      const [created] = await db
        .insert(notificationPreferences)
        .values({
          ...defaultPreferences(auth.user.id),
          ...parsed.data,
        })
        .returning();

      return mobileSuccess(created);
    }

    const [updated] = await db
      .update(notificationPreferences)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(notificationPreferences.userId, auth.user.id))
      .returning();

    return mobileSuccess(updated);
  } catch (error) {
    console.error('[mobile.notifications.preferences.patch] failed', error);
    return mobileError('internal_error', 'Failed to update notification preferences', 500);
  }
}
