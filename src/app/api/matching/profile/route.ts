/**
 * Legacy compatibility route for matching profile editor.
 * Canonical profile persistence is stored in matching_profiles keyed by profile_id.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { matchingProfiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { log } from '@/lib/log';

const DEFAULT_WEIGHTS = {
  skills: 0.3,
  experience: 0.15,
  values: 0.25,
  causes: 0.15,
  location: 0.05,
  compensation: 0.05,
  availability: 0.03,
  language: 0.02,
};

const DEFAULT_CONSTRAINTS = {
  requireEmailVerified: true,
  requirePhoneVerified: false,
  requireProfileComplete: false,
  requireMinSkillMatch: false,
  minSkillMatchThreshold: 0.3,
  requireLocationMatch: false,
  requireAvailabilityMatch: false,
};

const CompatProfileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).optional(),
  weights: z.record(z.number()).optional(),
  constraints: z.record(z.any()).optional(),
});

function toCompatProfile(
  profile: typeof matchingProfiles.$inferSelect,
  overrides?: { name?: string; constraints?: Record<string, unknown> }
) {
  return {
    id: profile.profileId,
    name: overrides?.name ?? 'Default Profile',
    weights: (profile.weights as Record<string, number> | null) ?? DEFAULT_WEIGHTS,
    constraints: overrides?.constraints ?? DEFAULT_CONSTRAINTS,
    isActive: true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

async function upsertCompatProfile(userId: string, data: z.infer<typeof CompatProfileSchema>) {
  const now = new Date();

  await db
    .insert(matchingProfiles)
    .values({
      profileId: userId,
      ...(data.weights ? { weights: data.weights } : {}),
    })
    .onConflictDoUpdate({
      target: matchingProfiles.profileId,
      set: {
        ...(data.weights ? { weights: data.weights } : {}),
        updatedAt: now,
      },
    });

  const profile = await db.query.matchingProfiles.findFirst({
    where: eq(matchingProfiles.profileId, userId),
  });

  if (!profile) {
    throw new Error('Failed to save matching profile');
  }

  return profile;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const parsed = CompatProfileSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = await upsertCompatProfile(user.id, parsed.data);

    return NextResponse.json({
      success: true,
      profile: toCompatProfile(profile, {
        name: parsed.data.name,
        constraints: parsed.data.constraints as Record<string, unknown> | undefined,
      }),
    });
  } catch (error) {
    log.error('matching.profile.compat.create.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireAuth();
    const parsed = CompatProfileSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid profile payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    if (parsed.data.id && parsed.data.id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to update this profile' }, { status: 403 });
    }

    const profile = await upsertCompatProfile(user.id, parsed.data);

    return NextResponse.json({
      success: true,
      profile: toCompatProfile(profile, {
        name: parsed.data.name,
        constraints: parsed.data.constraints as Record<string, unknown> | undefined,
      }),
    });
  } catch (error) {
    log.error('matching.profile.compat.update.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireAuth();

    const profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    return NextResponse.json({
      success: true,
      profiles: profile ? [toCompatProfile(profile)] : [],
    });
  } catch (error) {
    log.error('matching.profile.compat.list.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to list profiles' }, { status: 500 });
  }
}
