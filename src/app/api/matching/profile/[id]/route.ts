/**
 * Matching Profile Detail API
 *
 * GET /api/matching/profile/[id] - Get specific matching profile
 * DELETE /api/matching/profile/[id] - Delete matching profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get profile
    const result = await db.execute(sql`
      SELECT *
      FROM matching_profiles
      WHERE id = ${id}
        AND user_id = ${user.id}
    `);

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = result.rows[0] as any;

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        weights: profile.weights,
        constraints: profile.constraints,
        isActive: profile.is_active,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      },
    });
  } catch (error) {
    log.error('matching.profile.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const existing = await db.execute(sql`
      SELECT user_id
      FROM matching_profiles
      WHERE id = ${id}
    `);

    if (!existing.rows.length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if ((existing.rows[0] as any).user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this profile' }, { status: 403 });
    }

    // Delete profile
    await db.execute(sql`
      DELETE FROM matching_profiles
      WHERE id = ${id}
    `);

    log.info('matching.profile.deleted', {
      userId: user.id,
      profileId: id,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    log.error('matching.profile.delete.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
