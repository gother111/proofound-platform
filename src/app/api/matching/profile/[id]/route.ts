import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { matchingProfiles } from '@/db/schema';
import { requireApiAuthContext } from '@/lib/auth';
import { GET as getMatchingProfile } from '@/app/api/core/matching/matching-profile/handler';
import { mapIndustryListToCanonical } from '@/lib/industry/options';

export { dynamic } from '@/app/api/core/matching/matching-profile/handler';

function toLegacyProfile(profile: any) {
  if (!profile) {
    return null;
  }

  const verified = (profile.verified || {}) as Record<string, boolean>;
  const preferred = mapIndustryListToCanonical(
    profile.preferredIndustryKeys?.length
      ? profile.preferredIndustryKeys
      : profile.preferredIndustryLabels?.length
        ? profile.preferredIndustryLabels
        : profile.desiredIndustries
  );

  return {
    id: profile.profileId,
    name: 'Default Profile',
    weights: profile.weights || {},
    desiredRoles: profile.desiredRoles || [],
    desiredIndustries: preferred.labels,
    orgTypes: profile.orgTypes || [],
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

  const canonicalResponse = await getMatchingProfile();
  const payload = await canonicalResponse.json().catch(() => null);

  if (!canonicalResponse.ok) {
    return NextResponse.json(payload || { error: 'Failed to get profile' }, {
      status: canonicalResponse.status,
    });
  }

  const profile = (payload as any)?.profile;
  if (!profile || profile.profileId !== id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    profile: toLegacyProfile(profile),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authContext = await requireApiAuthContext();
  if (!authContext) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user } = authContext;

  if (id !== user.id) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  await db.delete(matchingProfiles).where(eq(matchingProfiles.profileId, user.id));

  return NextResponse.json({ success: true });
}
