/**
 * Privacy Settings API
 *
 * GET - Fetch user's field visibility settings and redact mode status
 * POST - Update user's field visibility settings and redact mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { safeApiErrorResponse, safeValidationErrorResponse } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProfileVisibilityLevelSchema } from '@/lib/contracts/domain';

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
    volunteering: ProfileVisibilityLevelSchema.optional(),
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
    redactMode: z.boolean(),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await db.query.individualProfiles.findFirst({
      where: eq(individualProfiles.userId, user.id),
      columns: {
        fieldVisibility: true,
        redactMode: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
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
      event: 'user.privacy_settings.get.failed',
      error,
      publicMessage: 'Failed to fetch privacy settings',
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const { fieldVisibility, redactMode } = PrivacySettingsUpdateSchema.parse(body);

    // Update profile
    await db
      .update(individualProfiles)
      .set({
        fieldVisibility: {
          ...PRIVATE_CONTEXT_VISIBILITY_DEFAULTS,
          ...sanitizeIndividualFieldVisibility(fieldVisibility as Record<string, unknown> | null),
        },
        redactMode,
      })
      .where(eq(individualProfiles.userId, user.id));

    // Log analytics event
    await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: 'privacy_settings_updated',
      event_data: {
        redactMode,
        fieldsConfigured: Object.keys(fieldVisibility || {}).length,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return safeValidationErrorResponse({
        error,
        message: 'Invalid privacy settings',
      });
    }

    return safeApiErrorResponse({
      event: 'user.privacy_settings.update.failed',
      error,
      publicMessage: 'Failed to update privacy settings',
    });
  }
}
