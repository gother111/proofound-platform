/**
 * Privacy Settings API
 *
 * GET - Fetch user's field visibility settings and redact mode status
 * POST - Update user's field visibility settings and redact mode
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { individualProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
      fieldVisibility: profile.fieldVisibility || {},
      redactMode: profile.redactMode || false,
    });
  } catch (error) {
    console.error('Failed to fetch privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const body = await req.json();
    const { fieldVisibility, redactMode } = body;

    // Validate fieldVisibility structure
    if (fieldVisibility && typeof fieldVisibility !== 'object') {
      return NextResponse.json(
        { error: 'Invalid fieldVisibility format' },
        { status: 400 }
      );
    }

    // Validate redactMode is boolean
    if (typeof redactMode !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid redactMode value' },
        { status: 400 }
      );
    }

    // Update profile
    await db
      .update(individualProfiles)
      .set({
        fieldVisibility: fieldVisibility || {},
        redactMode,
        updatedAt: new Date(),
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
    console.error('Failed to update privacy settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

