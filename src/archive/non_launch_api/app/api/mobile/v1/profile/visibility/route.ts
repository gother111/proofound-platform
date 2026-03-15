import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { db } from '@/db';
import { profileFieldVisibility } from '@/db/schema';
import { requireMobileAuth } from '@/lib/api/mobile/auth';
import { mobileError, mobileSuccess } from '@/lib/api/mobile/response';

export const dynamic = 'force-dynamic';

const VisibilityLevelSchema = z.enum(['public', 'network_only', 'match_only', 'private']);

const UpdateVisibilitySchema = z.object({
  displayName: VisibilityLevelSchema.optional(),
  avatar: VisibilityLevelSchema.optional(),
  headline: VisibilityLevelSchema.optional(),
  location: VisibilityLevelSchema.optional(),
  mission: VisibilityLevelSchema.optional(),
  vision: VisibilityLevelSchema.optional(),
  values: VisibilityLevelSchema.optional(),
  causes: VisibilityLevelSchema.optional(),
  experiences: VisibilityLevelSchema.optional(),
  education: VisibilityLevelSchema.optional(),
  volunteering: VisibilityLevelSchema.optional(),
  skills: VisibilityLevelSchema.optional(),
  impactStories: VisibilityLevelSchema.optional(),
});

const defaultVisibility = {
  displayName: 'public',
  avatar: 'public',
  headline: 'public',
  location: 'network_only',
  mission: 'public',
  vision: 'public',
  values: 'public',
  causes: 'public',
  experiences: 'network_only',
  education: 'public',
  volunteering: 'public',
  skills: 'public',
  impactStories: 'match_only',
} as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const [visibility] = await db
      .select()
      .from(profileFieldVisibility)
      .where(eq(profileFieldVisibility.profileId, auth.user.id))
      .limit(1);

    if (!visibility) {
      return mobileSuccess(defaultVisibility);
    }

    return mobileSuccess({
      displayName: visibility.displayName,
      avatar: visibility.avatar,
      headline: visibility.headline,
      location: visibility.location,
      mission: visibility.mission,
      vision: visibility.vision,
      values: visibility.values,
      causes: visibility.causes,
      experiences: visibility.experiences,
      education: visibility.education,
      volunteering: visibility.volunteering,
      skills: visibility.skills,
      impactStories: visibility.impactStories,
    });
  } catch (error) {
    console.error('[mobile.profile.visibility.get] failed', error);
    return mobileError('internal_error', 'Failed to fetch profile visibility', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireMobileAuth(request);
    if ('status' in auth) {
      return auth;
    }

    const parsed = UpdateVisibilitySchema.safeParse(await request.json());
    if (!parsed.success) {
      return mobileError(
        'validation_error',
        'Invalid visibility payload',
        400,
        parsed.error.flatten()
      );
    }

    const [existing] = await db
      .select()
      .from(profileFieldVisibility)
      .where(eq(profileFieldVisibility.profileId, auth.user.id))
      .limit(1);

    if (!existing) {
      await db.insert(profileFieldVisibility).values({
        profileId: auth.user.id,
        ...defaultVisibility,
        ...parsed.data,
      });
    } else {
      await db
        .update(profileFieldVisibility)
        .set({
          ...parsed.data,
          updatedAt: new Date(),
        })
        .where(eq(profileFieldVisibility.profileId, auth.user.id));
    }

    return mobileSuccess({ updated: true });
  } catch (error) {
    console.error('[mobile.profile.visibility.patch] failed', error);
    return mobileError('internal_error', 'Failed to update profile visibility', 500);
  }
}
