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
import { z } from 'zod';

const createProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  weights: z.record(z.any()),
  constraints: z.record(z.any()),
});

const updateProfileSchema = z.object({
  id: z.string().min(1, 'id is required'),
  name: z.string().min(1).optional(),
  weights: z.record(z.any()).optional(),
  constraints: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = createProfileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile payload', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, weights, constraints } = parsed.data;

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

    const profile = (result as any[])[0];

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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = updateProfileSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid profile payload', details: parsed.error.flatten() }, { status: 400 });
    }
    const { id, name, weights, constraints } = parsed.data;

    // Verify ownership
    const existing = await db.execute(sql`
      SELECT user_id
      FROM matching_profiles
      WHERE id = ${id}
    `);

    if (!(existing as any[]).length) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (((existing as any[])[0] as any).user_id !== user.id) {
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

    const profile = (result as any[])[0];

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
    const supabase = await createClient();
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

    const profiles = (result as any[]).map((row: any) => ({
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
