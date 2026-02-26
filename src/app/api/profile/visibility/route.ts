import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { profileFieldVisibility } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { ProfileVisibilityLevelSchema, PROFILE_VISIBILITY_DEFAULTS } from '@/lib/contracts/domain';

export const dynamic = 'force-dynamic';

const UpdateVisibilitySchema = z.object({
  displayName: ProfileVisibilityLevelSchema.optional(),
  avatar: ProfileVisibilityLevelSchema.optional(),
  headline: ProfileVisibilityLevelSchema.optional(),
  location: ProfileVisibilityLevelSchema.optional(),
  mission: ProfileVisibilityLevelSchema.optional(),
  vision: ProfileVisibilityLevelSchema.optional(),
  values: ProfileVisibilityLevelSchema.optional(),
  causes: ProfileVisibilityLevelSchema.optional(),
  experiences: ProfileVisibilityLevelSchema.optional(),
  education: ProfileVisibilityLevelSchema.optional(),
  volunteering: ProfileVisibilityLevelSchema.optional(),
  skills: ProfileVisibilityLevelSchema.optional(),
  impactStories: ProfileVisibilityLevelSchema.optional(),
});

/**
 * GET /api/profile/visibility
 *
 * Get the current user's field visibility settings
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    // Fetch existing visibility settings
    const [visibility] = await db
      .select()
      .from(profileFieldVisibility)
      .where(eq(profileFieldVisibility.profileId, user.id))
      .limit(1);

    if (!visibility) {
      return NextResponse.json(PROFILE_VISIBILITY_DEFAULTS);
    }

    return NextResponse.json({
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
    console.error('Error fetching visibility settings:', error);
    return NextResponse.json({ error: 'Failed to fetch visibility settings' }, { status: 500 });
  }
}

/**
 * POST /api/profile/visibility
 *
 * Update the current user's field visibility settings
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();

    // Validate input
    const validated = UpdateVisibilitySchema.parse(body);

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(profileFieldVisibility)
      .where(eq(profileFieldVisibility.profileId, user.id))
      .limit(1);

    if (existing) {
      // Update existing settings
      await db
        .update(profileFieldVisibility)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(profileFieldVisibility.profileId, user.id));
    } else {
      await db.insert(profileFieldVisibility).values({
        profileId: user.id,
        displayName: validated.displayName || PROFILE_VISIBILITY_DEFAULTS.displayName,
        avatar: validated.avatar || PROFILE_VISIBILITY_DEFAULTS.avatar,
        headline: validated.headline || PROFILE_VISIBILITY_DEFAULTS.headline,
        location: validated.location || PROFILE_VISIBILITY_DEFAULTS.location,
        mission: validated.mission || PROFILE_VISIBILITY_DEFAULTS.mission,
        vision: validated.vision || PROFILE_VISIBILITY_DEFAULTS.vision,
        values: validated.values || PROFILE_VISIBILITY_DEFAULTS.values,
        causes: validated.causes || PROFILE_VISIBILITY_DEFAULTS.causes,
        experiences: validated.experiences || PROFILE_VISIBILITY_DEFAULTS.experiences,
        education: validated.education || PROFILE_VISIBILITY_DEFAULTS.education,
        volunteering: validated.volunteering || PROFILE_VISIBILITY_DEFAULTS.volunteering,
        skills: validated.skills || PROFILE_VISIBILITY_DEFAULTS.skills,
        impactStories: validated.impactStories || PROFILE_VISIBILITY_DEFAULTS.impactStories,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Visibility settings updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }

    console.error('Error updating visibility settings:', error);
    return NextResponse.json({ error: 'Failed to update visibility settings' }, { status: 500 });
  }
}
