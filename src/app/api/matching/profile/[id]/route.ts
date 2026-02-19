/**
 * Legacy matching profile detail adapter.
 *
 * Canonical endpoint: /api/core/matching/matching-profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { matchingProfiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth';
import { addDeprecationHeaders } from '@/lib/api/deprecation';
import { GET as getCanonicalMatchingProfile } from '@/app/api/core/matching/matching-profile/route';

const CanonicalPath = '/api/core/matching/matching-profile';

function toLegacyProfile(profile: any) {
  if (!profile) {
    return null;
  }

  const verified = (profile.verified || {}) as Record<string, boolean>;

  return {
    id: profile.profileId,
    name: 'Default Profile',
    weights: profile.weights || {},
    constraints: {
      requireEmailVerified: !!verified.email,
      requirePhoneVerified: !!verified.phone,
      requireProfileComplete: !!verified.profileComplete,
    },
    isActive: true,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const canonicalResponse = await getCanonicalMatchingProfile();
  const payload = await canonicalResponse.json().catch(() => null);

  if (!canonicalResponse.ok) {
    return addDeprecationHeaders(
      NextResponse.json(payload || { error: 'Failed to get profile' }, {
        status: canonicalResponse.status,
      }),
      CanonicalPath
    );
  }

  const profile = (payload as any)?.profile;
  if (!profile || profile.profileId !== id) {
    return addDeprecationHeaders(
      NextResponse.json({ error: 'Profile not found' }, { status: 404 }),
      CanonicalPath
    );
  }

  return addDeprecationHeaders(
    NextResponse.json({
      success: true,
      profile: toLegacyProfile(profile),
    }),
    CanonicalPath
  );
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireAuth();

  if (id !== user.id) {
    return addDeprecationHeaders(
      NextResponse.json({ error: 'Profile not found' }, { status: 404 }),
      CanonicalPath
    );
  }

  await db.delete(matchingProfiles).where(eq(matchingProfiles.profileId, user.id));

  return addDeprecationHeaders(NextResponse.json({ success: true }), CanonicalPath);
}
