/**
 * Privacy Settings API
 * GET/POST /api/profile/privacy-settings
 *
 * Manages field-level visibility and redact mode settings
 *
 * PRD References:
 * - Part 5: F4 - Field-Level Visibility Controls
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { emitVisibilityChanged, emitRedactModeToggled } from '@/lib/analytics/events';

export const dynamic = 'force-dynamic';

const PRIVATE_CONTEXT_VISIBILITY_DEFAULTS = {
  experiences: 'private',
  education: 'private',
  volunteering: 'private',
} as const;

/**
 * GET: Fetch user's privacy settings
 */
export async function GET() {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;

    const profile = await db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, user.id),
      columns: {
        fieldVisibility: true,
        redactMode: true,
      },
    });

    if (!profile) {
      return NextResponse.json({
        fieldVisibility: null,
        redactMode: false,
      });
    }

    return NextResponse.json({
      fieldVisibility: {
        ...PRIVATE_CONTEXT_VISIBILITY_DEFAULTS,
        ...((profile.fieldVisibility as Record<string, unknown> | null) || {}),
      },
      redactMode: profile.redactMode || false,
    });
  } catch (error) {
    console.error('Failed to fetch privacy settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch privacy settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Update user's privacy settings
 */
export async function POST(request: NextRequest) {
  try {
    const authContext = await requireApiAuthContext();
    if (!authContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user } = authContext;
    const body = await request.json();
    const { fieldVisibility, redactMode } = body;

    // Get current settings for change tracking
    const currentProfile = await db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, user.id),
      columns: {
        fieldVisibility: true,
        redactMode: true,
      },
    });

    // Update settings
    await db
      .update(individualProfiles)
      .set({
        fieldVisibility: {
          ...PRIVATE_CONTEXT_VISIBILITY_DEFAULTS,
          ...((fieldVisibility as Record<string, unknown> | null) || {}),
        },
        redactMode: redactMode || false,
      })
      .where(eq(individualProfiles.userId, user.id));

    // Emit analytics events for visibility changes
    if (currentProfile && fieldVisibility) {
      const oldVisibility = (currentProfile.fieldVisibility as any) || {};
      Object.keys(fieldVisibility).forEach((field) => {
        if (oldVisibility[field] !== fieldVisibility[field]) {
          const visibility = fieldVisibility[field];
          if (
            visibility === 'public' ||
            visibility === 'network' ||
            visibility === 'network_only' ||
            visibility === 'match_only' ||
            visibility === 'private'
          ) {
            emitVisibilityChanged(user.id, field, visibility);
          }
        }
      });
    }

    // Emit redact mode toggle event
    if (currentProfile && currentProfile.redactMode !== redactMode) {
      emitRedactModeToggled(user.id, redactMode);
    }

    return NextResponse.json({
      success: true,
      message: 'Privacy settings updated successfully',
    });
  } catch (error) {
    console.error('Failed to update privacy settings:', error);
    return NextResponse.json(
      {
        error: 'Failed to update privacy settings',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
