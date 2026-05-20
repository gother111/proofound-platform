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
  experiences: ProfileVisibilityLevelSchema.optional(),
  education: ProfileVisibilityLevelSchema.optional(),
  volunteering: ProfileVisibilityLevelSchema.optional(),
  skills: ProfileVisibilityLevelSchema.optional(),
  impactStories: ProfileVisibilityLevelSchema.optional(),
});

const INDIVIDUAL_MVP_VISIBILITY_DEFAULTS = {
  displayName: PROFILE_VISIBILITY_DEFAULTS.displayName,
  avatar: PROFILE_VISIBILITY_DEFAULTS.avatar,
  headline: PROFILE_VISIBILITY_DEFAULTS.headline,
  location: PROFILE_VISIBILITY_DEFAULTS.location,
  experiences: PROFILE_VISIBILITY_DEFAULTS.experiences,
  education: PROFILE_VISIBILITY_DEFAULTS.education,
  volunteering: PROFILE_VISIBILITY_DEFAULTS.volunteering,
  skills: PROFILE_VISIBILITY_DEFAULTS.skills,
  impactStories: PROFILE_VISIBILITY_DEFAULTS.impactStories,
} as const;

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
      return NextResponse.json(INDIVIDUAL_MVP_VISIBILITY_DEFAULTS);
    }

    return NextResponse.json({
      displayName: visibility.displayName,
      avatar: visibility.avatar,
      headline: visibility.headline,
      location: visibility.location,
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

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
