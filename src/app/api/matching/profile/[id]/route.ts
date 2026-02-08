/**
 * Matching Profile Detail API
 *
 * GET /api/matching/profile/[id] - Get specific matching profile
 * DELETE /api/matching/profile/[id] - Delete matching profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db';
import { matchingProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/log';

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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Legacy API exposed multiple profiles; current schema supports exactly one per user.
    if (id !== user.id) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = await db.query.matchingProfiles.findFirst({
      where: eq(matchingProfiles.profileId, user.id),
    });

    if (!profile?.weights) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: user.id,
        name: 'Default Profile',
        weights: profile.weights,
        constraints: defaultLegacyConstraints(),
        isActive: true,
        updatedAt: profile.updatedAt,
      },
    });
  } catch (error) {
    log.error('matching.profile.legacy.get.failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, _ctx: { params: Promise<{ id: string }> }) {
  // Do not delete the canonical matching profile through a legacy endpoint.
  // This prevents accidental removal of matching setup used by /api/matching-profile and matching engine.
  return NextResponse.json({ error: 'Not supported. Use /api/matching-profile.' }, { status: 405 });
}
