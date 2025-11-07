/**
 * Matching Profile API
 *
 * POST /api/matching/profile - Create new matching profile
 * PUT /api/matching/profile - Update existing matching profile
 * GET /api/matching/profile - List user's matching profiles
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { log } from '@/lib/log';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, weights, constraints } = body;

    // Validate input
    if (!name || !weights || !constraints) {
      return NextResponse.json(
        { error: 'name, weights, and constraints are required' },
        { status: 400 }
      );
    }

    // Insert profile
    const result = await db.execute(sql`
      INSERT INTO matching_profiles (
        user_id,
        name,
        weights,
        constraints,
        is_active
      ) VALUES (
        ${user.id},
        ${name},
        ${JSON.stringify(weights)},
        ${JSON.stringify(constraints)},
        TRUE
      )
      RETURNING *
    `);

    const profile = result.rows[0] as any;

    log.info('matching.profile.created', {
      userId: user.id,
      profileId: profile.id,
      name,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        weights: profile.weights,
        constraints: profile.constraints,
        isActive: profile.is_active,
        createdAt: profile.created_at,
      },
    });
  } catch (error) {
    log.error('matching.profile.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, name, weights, constraints } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required for updates' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Unauthorized to update this profile' }, { status: 403 });
    }

    // Update profile
    const result = await db.execute(sql`
      UPDATE matching_profiles
      SET
        name = COALESCE(${name}, name),
        weights = COALESCE(${weights ? JSON.stringify(weights) : null}::jsonb, weights),
        constraints = COALESCE(${constraints ? JSON.stringify(constraints) : null}::jsonb, constraints),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);

    const profile = result.rows[0] as any;

    log.info('matching.profile.updated', {
      userId: user.id,
      profileId: id,
      name,
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        weights: profile.weights,
        constraints: profile.constraints,
        isActive: profile.is_active,
        updatedAt: profile.updated_at,
      },
    });
  } catch (error) {
    log.error('matching.profile.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all profiles for user
    const result = await db.execute(sql`
      SELECT *
      FROM matching_profiles
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `);

    const profiles = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      weights: row.weights,
      constraints: row.constraints,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      profiles,
    });
  } catch (error) {
    log.error('matching.profile.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Failed to list profiles' }, { status: 500 });
  }
}
