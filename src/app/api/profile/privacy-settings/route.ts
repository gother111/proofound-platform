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
import { z } from 'zod';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { requireApiAuthContext } from '@/lib/auth';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { emitVisibilityChanged, emitRedactModeToggled } from '@/lib/analytics/events';
import { ProfileVisibilityLevelSchema } from '@/lib/contracts/domain';

export const dynamic = 'force-dynamic';

const PRIVATE_CONTEXT_VISIBILITY_DEFAULTS = {
  experiences: 'private',
  education: 'private',
  volunteering: 'private',
} as const;

const FieldVisibilitySchema = z
  .object({
    avatar: ProfileVisibilityLevelSchema.optional(),
    tagline: ProfileVisibilityLevelSchema.optional(),
    location: ProfileVisibilityLevelSchema.optional(),
    skills: ProfileVisibilityLevelSchema.optional(),
    experiences: ProfileVisibilityLevelSchema.optional(),
    education: ProfileVisibilityLevelSchema.optional(),
    impactStories: ProfileVisibilityLevelSchema.optional(),
  })
  .strict();

const INDIVIDUAL_PURPOSE_VISIBILITY_FIELDS = new Set(['mission', 'vision', 'values', 'causes']);

function sanitizeIndividualFieldVisibility(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value || {}).filter(
      ([field]) => !INDIVIDUAL_PURPOSE_VISIBILITY_FIELDS.has(field)
    )
  );
}

const PrivacySettingsUpdateSchema = z
  .object({
    fieldVisibility: FieldVisibilitySchema.optional().default({}),
    redactMode: z.boolean().optional().default(false),
  })
  .strict();

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
        ...sanitizeIndividualFieldVisibility(
          profile.fieldVisibility as Record<string, unknown> | null
        ),
      },
      redactMode: profile.redactMode || false,
    });
  } catch (error) {
    return safeApiErrorResponse({
      event: 'profile.privacy_settings.get.failed',
      error,
      publicMessage: 'Failed to fetch privacy settings',
    });
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
    const { fieldVisibility, redactMode } = PrivacySettingsUpdateSchema.parse(body);

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
          ...sanitizeIndividualFieldVisibility(fieldVisibility as Record<string, unknown> | null),
        },
        redactMode: redactMode || false,
      })
      .where(eq(individualProfiles.userId, user.id));

    // Emit analytics events for visibility changes
    if (currentProfile && fieldVisibility) {
      const oldVisibility = (currentProfile.fieldVisibility as any) || {};
      Object.entries(fieldVisibility).forEach(([field, visibility]) => {
        if (oldVisibility[field] !== visibility) {
          if (
            visibility === 'public' ||
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
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: 'Invalid privacy settings',
      });
    }

    return safeApiErrorResponse({
      event: 'profile.privacy_settings.update.failed',
      error,
      publicMessage: 'Failed to update privacy settings',
    });
  }
}
