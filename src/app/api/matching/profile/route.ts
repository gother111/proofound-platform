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
  desiredRoles: z.array(z.string()).optional(),
  desiredIndustries: z.array(z.string()).optional(),
  orgTypes: z.array(z.enum(['company', 'ngo', 'government', 'network', 'startup'])).optional(),
});

const COMPAT_META_KEY = '__compat_profile';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractCompatMeta(profile: typeof matchingProfiles.$inferSelect) {
  const verified = isRecord(profile.verified) ? (profile.verified as Record<string, unknown>) : {};
  const rawMeta = verified[COMPAT_META_KEY];

  if (!isRecord(rawMeta)) {
    return {};
  }

  const name = typeof rawMeta.name === 'string' ? rawMeta.name : undefined;
  const constraints = isRecord(rawMeta.constraints)
    ? (rawMeta.constraints as Record<string, unknown>)
    : undefined;

  return { name, constraints };
}

function mergeCompatMeta(
  existingVerified: unknown,
  payload: { name?: string; constraints?: Record<string, unknown> }
) {
  const verified = isRecord(existingVerified) ? { ...existingVerified } : {};
  const existingMeta = isRecord(verified[COMPAT_META_KEY])
    ? { ...(verified[COMPAT_META_KEY] as Record<string, unknown>) }
    : {};

  if (payload.name !== undefined) {
    existingMeta.name = payload.name;
  }
  if (payload.constraints !== undefined) {
    existingMeta.constraints = payload.constraints;
  }

  verified[COMPAT_META_KEY] = existingMeta;
  return verified;
}

function toCompatProfile(profile: typeof matchingProfiles.$inferSelect) {
  const meta = extractCompatMeta(profile);

  return {
    id: profile.profileId,
    name: meta.name ?? 'Default Profile',
    weights: (profile.weights as Record<string, number> | null) ?? DEFAULT_WEIGHTS,
    desiredRoles: profile.desiredRoles ?? [],
    desiredIndustries: profile.desiredIndustries ?? [],
    orgTypes: profile.orgTypes ?? [],
    constraints: { ...DEFAULT_CONSTRAINTS, ...(meta.constraints ?? {}) },
    isActive: true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

async function upsertCompatProfile(userId: string, data: z.infer<typeof CompatProfileSchema>) {
  const now = new Date();
  const shouldUpdateCompatMeta = data.name !== undefined || data.constraints !== undefined;

  let compatVerified: Record<string, unknown> | undefined;
  if (shouldUpdateCompatMeta) {
    const existingProfile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, userId),
    });

    compatVerified = mergeCompatMeta(existingProfile?.verified, {
      name: data.name,
      constraints: data.constraints as Record<string, unknown> | undefined,
    });
  }

  await db
    .insert(matchingProfiles)
    .values({
      profileId: userId,
      ...(data.weights ? { weights: data.weights } : {}),
      ...(data.desiredRoles ? { desiredRoles: data.desiredRoles } : {}),
      ...(data.desiredIndustries ? { desiredIndustries: data.desiredIndustries } : {}),
      ...(data.orgTypes ? { orgTypes: data.orgTypes } : {}),
      ...(compatVerified ? { verified: compatVerified } : {}),
    })
    .onConflictDoUpdate({
      target: matchingProfiles.profileId,
      set: {
        ...(data.weights ? { weights: data.weights } : {}),
        ...(data.desiredRoles ? { desiredRoles: data.desiredRoles } : {}),
        ...(data.desiredIndustries ? { desiredIndustries: data.desiredIndustries } : {}),
        ...(data.orgTypes ? { orgTypes: data.orgTypes } : {}),
        ...(compatVerified ? { verified: compatVerified } : {}),
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
      profile: toCompatProfile(profile),
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
      profile: toCompatProfile(profile),
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
