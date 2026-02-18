import { and, eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { mobileDeviceTokens } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const RegisterTokenSchema = z.object({
  token: z.string().min(20),
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  appVersion: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
});

const UnregisterTokenSchema = z.object({
  token: z.string().min(20),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = RegisterTokenSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid device token payload',
        400,
        parsed.error.flatten()
      );
    }

    const existing = await db.query.mobileDeviceTokens.findFirst({
      where: eq(mobileDeviceTokens.token, parsed.data.token),
    });

    if (!existing) {
      const [created] = await db
        .insert(mobileDeviceTokens)
        .values({
          userId: auth.user.id,
          token: parsed.data.token,
          platform: 'ios',
          environment: parsed.data.environment,
          enabled: true,
          appVersion: parsed.data.appVersion,
          deviceModel: parsed.data.deviceModel,
          osVersion: parsed.data.osVersion,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return mobileSuccess(created, 201);
    }

    const [updated] = await db
      .update(mobileDeviceTokens)
      .set({
        userId: auth.user.id,
        enabled: true,
        environment: parsed.data.environment,
        appVersion: parsed.data.appVersion ?? existing.appVersion,
        deviceModel: parsed.data.deviceModel ?? existing.deviceModel,
        osVersion: parsed.data.osVersion ?? existing.osVersion,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(mobileDeviceTokens.id, existing.id))
      .returning();

    return mobileSuccess(updated);
  } catch (error) {
    console.error('[mobile.devices.token.post] failed', error);
    return mobileError('internal_error', 'Failed to register device token', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = UnregisterTokenSchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid device token unregister payload',
        400,
        parsed.error.flatten()
      );
    }

    const [updated] = await db
      .update(mobileDeviceTokens)
      .set({
        enabled: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(mobileDeviceTokens.userId, auth.user.id),
          eq(mobileDeviceTokens.token, parsed.data.token)
        )
      )
      .returning();

    if (!updated) {
      return mobileError('not_found', 'Device token not found for this user', 404);
    }

    return mobileSuccess({ removed: true });
  } catch (error) {
    console.error('[mobile.devices.token.delete] failed', error);
    return mobileError('internal_error', 'Failed to unregister device token', 500);
  }
}
