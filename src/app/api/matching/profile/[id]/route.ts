/**
 * Legacy compatibility route for matching profile detail.
 */

import { NextRequest, NextResponse } from 'next/server';
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

const COMPAT_META_KEY = '__compat_profile';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toCompatProfile(profile: typeof matchingProfiles.$inferSelect) {
  const verified = isRecord(profile.verified) ? (profile.verified as Record<string, unknown>) : {};
  const rawMeta = verified[COMPAT_META_KEY];
  const meta = isRecord(rawMeta) ? rawMeta : {};

  const name = typeof meta.name === 'string' ? meta.name : 'Default Profile';
  const constraints = isRecord(meta.constraints)
    ? (meta.constraints as Record<string, unknown>)
    : undefined;

  return {
    id: profile.profileId,
    name,
    weights: (profile.weights as Record<string, number> | null) ?? DEFAULT_WEIGHTS,
    constraints: { ...DEFAULT_CONSTRAINTS, ...(constraints ?? {}) },
    isActive: true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: toCompatProfile(profile),
    });
  } catch (error) {
    log.error('matching.profile.compat.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    if (id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this profile' }, { status: 403 });
    }

    await db.delete(matchingProfiles).where(eq(matchingProfiles.profileId, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    log.error('matching.profile.compat.delete.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
