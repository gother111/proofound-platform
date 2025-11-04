import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { profileFieldVisibility } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

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

/**
 * GET /api/profile/visibility
 *
 * Get the current user's field visibility settings
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Fetch existing visibility settings
    const [visibility] = await db
      .select()
      .from(profileFieldVisibility)
      .where(eq(profileFieldVisibility.profileId, user.id))
      .limit(1);

    if (!visibility) {
      // Return default settings
      return NextResponse.json({
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
      });
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
    const user = await requireAuth();
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
      // Create new settings with defaults for unspecified fields
      await db.insert(profileFieldVisibility).values({
        profileId: user.id,
        displayName: validated.displayName || 'public',
        avatar: validated.avatar || 'public',
        headline: validated.headline || 'public',
        location: validated.location || 'network_only',
        mission: validated.mission || 'public',
        vision: validated.vision || 'public',
        values: validated.values || 'public',
        causes: validated.causes || 'public',
        experiences: validated.experiences || 'network_only',
        education: validated.education || 'public',
        volunteering: validated.volunteering || 'public',
        skills: validated.skills || 'public',
        impactStories: validated.impactStories || 'match_only',
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
