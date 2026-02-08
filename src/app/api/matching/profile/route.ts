/**
 * Legacy Matching Profile API (Compatibility Layer)
 *
 * This route previously implemented CRUD over a different `matching_profiles` schema
 * (columns like `user_id`, `name`, `constraints`, `is_active`).
 *
 * The current schema uses a single matching profile per user keyed by `profile_id`.
 * The canonical API is `GET/PUT /api/matching-profile`.
 *
 * Compatibility goals:
 * - Avoid runtime 500s if older UI components call these endpoints.
 * - Persist weights to the current `matching_profiles.weights` column.
 * - Return a legacy-shaped payload: { id, name, weights, constraints }.
 *
 * NOTE: `constraints` are accepted and echoed but are not enforced by the matching engine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matchingProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';

const LegacyWeightsSchema = z.record(z.number());

const LegacyConstraintsSchema = z
  .object({
    requireEmailVerified: z.boolean().optional(),
    requirePhoneVerified: z.boolean().optional(),
    requireProfileComplete: z.boolean().optional(),
    requireMinSkillMatch: z.boolean().optional(),
    minSkillMatchThreshold: z.number().optional(),
    requireLocationMatch: z.boolean().optional(),
    requireAvailabilityMatch: z.boolean().optional(),
  })
  .passthrough();

const LegacyUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  weights: LegacyWeightsSchema.optional(),
  constraints: LegacyConstraintsSchema.optional(),
});

function defaultLegacyConstraints() {
  return {
    requireEmailVerified: true,
    requirePhoneVerified: false,
    requireProfileComplete: false,
    requireMinSkillMatch: false,
    minSkillMatchThreshold: 0.3,
    requireLocationMatch: false,
    requireAvailabilityMatch: false,
  };
}

async function getCurrentWeights(userId: string): Promise<Record<string, number> | null> {
  const profile = await db.query.matchingProfiles.findFirst({
    where: eq(matchingProfiles.profileId, userId),
  });

  const weights = profile?.weights as unknown;
  if (!weights || typeof weights !== 'object') return null;
  return weights as Record<string, number>;
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireAuth();

    const weights = await getCurrentWeights(user.id);
    if (!weights) {
      return NextResponse.json({ success: true, profiles: [] });
    }

    return NextResponse.json({
      success: true,
      profiles: [
        {
          id: user.id,
          name: 'Default Profile',
          weights,
          constraints: defaultLegacyConstraints(),
          isActive: true,
        },
      ],
    });
  } catch (error) {
    log.error('matching.profile.legacy.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to list profiles' }, { status: 500 });
  }
}

async function upsertWeightsFromLegacy(request: NextRequest) {
  const user = await requireAuth();
  const parsed = LegacyUpsertSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile payload', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const name = parsed.data.name ?? 'Default Profile';
  const constraints = parsed.data.constraints ?? defaultLegacyConstraints();

  if (!parsed.data.weights) {
    return NextResponse.json({ error: 'weights is required' }, { status: 400 });
  }

  const profileToUpsert: typeof matchingProfiles.$inferInsert = {
    profileId: user.id,
    weights: parsed.data.weights,
  };

  await db
    .insert(matchingProfiles)
    .values(profileToUpsert)
    .onConflictDoUpdate({
      target: matchingProfiles.profileId,
      set: { weights: parsed.data.weights, updatedAt: new Date() },
    });

  log.info('matching.profile.legacy.weights.upserted', {
    userId: user.id,
  });

  return NextResponse.json({
    success: true,
    profile: {
      id: user.id,
      name,
      weights: parsed.data.weights,
      constraints,
      isActive: true,
      updatedAt: new Date().toISOString(),
    },
  });
}

export async function POST(req: NextRequest) {
  return upsertWeightsFromLegacy(req);
}

export async function PUT(req: NextRequest) {
  return upsertWeightsFromLegacy(req);
}
